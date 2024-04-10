import { IntegrationTypeEnum } from '@repo/database';
import type { ChannelInterface } from './channel-interface';
import { facebook } from './fb/fb-channel';

export const getChannel = (channel: IntegrationTypeEnum): ChannelInterface => {
  switch (channel) {
    case IntegrationTypeEnum.FACEBOOK:
      return facebook;
    default:
      throw new Error('Channel not found');
  }
};

export const isIntegrationTypeEnum = (val: string): val is IntegrationTypeEnum =>
  Object.values(IntegrationTypeEnum).includes(val as IntegrationTypeEnum);
