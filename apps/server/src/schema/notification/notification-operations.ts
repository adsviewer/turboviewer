import { pubSub } from '@repo/pubsub';
import { type NotificationEvent } from '@repo/shared-types';
import { NotificationTypeEnum, prisma } from '@repo/database';
import { builder } from '../builder';
import { NotificationDto, NotificationEventDto } from './notification-types';

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

builder.queryFields((t) => ({
  notifications: t.withAuth({ isInOrg: true }).prismaField({
    type: [NotificationDto],
    nullable: false,
    resolve: async (query, _root, _args, ctx) => {
      return await prisma.notification.findMany({
        ...query,
        where: { receivingUserId: ctx.currentUserId },
      });
    },
  }),
}));

builder.mutationFields((t) => ({
  markAllNotificationsAsRead: t.withAuth({ isInOrg: true }).field({
    type: 'Boolean',
    nullable: false,
    resolve: async (_root, _args, ctx) => {
      await prisma.notification.updateMany({
        where: { receivingUserId: ctx.currentUserId, isRead: false },
        data: { isRead: true },
      });
      return true;
    },
  }),
}));
