import { IntegrationTypeEnum } from '@repo/database';
import { meta } from '@repo/channel-meta';
import type { ChannelInterface } from '@repo/channel-utils';

export const getChannel = (channel: IntegrationTypeEnum): ChannelInterface => {
  switch (channel) {
    case IntegrationTypeEnum.META:
      return meta;
    default:
      throw new Error('Channel not found');
  }
};

export const isIntegrationTypeEnum = (val: string): val is IntegrationTypeEnum =>
  Object.values(IntegrationTypeEnum).includes(val as IntegrationTypeEnum);
