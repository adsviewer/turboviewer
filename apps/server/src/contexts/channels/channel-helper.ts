import { IntegrationTypeEnum } from '@repo/database';
import type { ChannelInterface } from './channel-interface';
import { meta } from './meta/meta-channel';

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
