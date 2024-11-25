import { pubSub } from '@repo/pubsub';
import { type NotificationEvent } from '@repo/shared-types';
import { NotificationTypeEnum } from '@repo/database';
import { builder } from '../builder';
import { NotificationEventDto } from './notification-types';

export const NotificationType = builder.enumType(NotificationTypeEnum, {
  name: 'NotificationTypeEnum',
});

builder.subscriptionFields((t) => ({
  newNotification: t.withAuth({ isInOrg: true }).field({
    type: NotificationEventDto,
    nullable: false,
    resolve: (root: NotificationEvent, _args, _ctx, _info) => {
      return root;
    },
    subscribe: (_root, _args, ctx) => {
      return pubSub.subscribe('user:notification:new-notification', ctx.currentUserId);
    },
  }),
}));
