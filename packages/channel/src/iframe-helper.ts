import { Cacheable } from '@repo/redis';
import { type DeviceEnum, prisma, type PublisherEnum } from '@repo/database';
import { AError } from '@repo/utils';
import { decryptTokens } from '@repo/channel-utils';
import { getChannel } from './channel-helper';

const getKey = (publisher: PublisherEnum, adId: string, format: string): string =>
  `iFramePerInsight:${publisher}:${String(adId)}:${format}`;

export const iFramePerInsight = new Cacheable(
  async ({ publisher, adId, format }: { adId: string; publisher?: PublisherEnum; format: string }) => {
    if (publisher) return getKey(publisher, adId, format);
    const ad = await prisma.ad.findUniqueOrThrow({
      select: { adAccount: { select: { integration: true } } },
      where: { id: adId },
    });
    const channel = getChannel(ad.adAccount.integration.type);
    return getKey(channel.getDefaultPublisher(), adId, format);
  },
  async ({
    adId,
    publisher,
    device,
    position,
  }: {
    adId: string;
    publisher?: PublisherEnum;
    device?: DeviceEnum;
    position?: string;
  }) => {
    const ad = await prisma.ad.findUnique({
      select: { adAccount: { select: { integration: true } } },
      where: { id: adId },
    });
    if (!ad) return new AError('Ad not found');

    const channel = getChannel(ad.adAccount.integration.type);
    const decryptedIntegration = decryptTokens(ad.adAccount.integration);
    if (!decryptedIntegration) return new AError('Integration not found');
    return channel.getAdPreview(decryptedIntegration, adId, publisher, device, position);
  },
  60 * 60 * 24,
);
