import { IntegrationTypeEnum } from '@repo/database';
import { meta } from '@repo/channel-meta';
import type { ChannelInterface } from '@repo/channel-utils';
import { linkedIn } from '@repo/channel-linkedin';
import { tiktok } from '@repo/channel-tiktok';

export const getChannel = (channel: IntegrationTypeEnum): ChannelInterface => {
  switch (channel) {
    case IntegrationTypeEnum.META:
      return meta;
    case IntegrationTypeEnum.LINKEDIN:
      return linkedIn;
    case IntegrationTypeEnum.TIKTOK:
      return tiktok;
    default:
      throw new Error('Channel not found');
  }
};

export const isIntegrationTypeEnum = (val: string): val is IntegrationTypeEnum =>
  Object.values(IntegrationTypeEnum).includes(val as IntegrationTypeEnum);
