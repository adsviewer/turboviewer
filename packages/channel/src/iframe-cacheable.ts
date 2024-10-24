import { Cacheable } from '@repo/redis';
import { type DeviceEnum, IntegrationTypeEnum, prisma, type PublisherEnum } from '@repo/database';
import { AError, isAError } from '@repo/utils';
import { getConnectedIntegrationByAccountId, IFrameTypeEnum, type IFrameWithType } from '@repo/channel-utils';
import { getChannel } from './channel-helper';

const getKey = (adId: string, publisher?: PublisherEnum, device?: DeviceEnum, position?: string): string =>
  `iFramePerInsight:adId_${String(adId)}:publisher_${String(publisher)}:device_${String(device)}:position_${String(position)}`;

const embeddedFrameIntegrations: IntegrationTypeEnum[] = [IntegrationTypeEnum.TIKTOK];

const getFn =
  () =>
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
  }): Promise<IFrameWithType | AError> => {
    const ad = await prisma.ad.findUnique({
      select: { adAccount: true },
      where: { id: adId },
    });
    if (!ad) return new AError('Ad not found');

    const integration = await getConnectedIntegrationByAccountId(ad.adAccount.id);
    if (isAError(integration)) return integration;

    const channel = getChannel(integration.type);
    const iFrame = await channel.getAdPreview(integration, adId, publisher, device, position);
    if (isAError(iFrame)) return iFrame;
    return {
      ...iFrame,
      type: embeddedFrameIntegrations.includes(ad.adAccount.type) ? IFrameTypeEnum.EMBEDDED : IFrameTypeEnum.IFRAME,
    };
  };

export const iFramePerInsight = new Cacheable(
  ({
    adId,
    publisher,
    device,
    position,
  }: {
    adId: string;
    publisher?: PublisherEnum;
    device?: DeviceEnum;
    position?: string;
  }) => getKey(adId, publisher, device, position),
  getFn(),
  60 * 60 * 3,
);
