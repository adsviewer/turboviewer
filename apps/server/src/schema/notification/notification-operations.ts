import { pubSub } from '@repo/pubsub';
import { type NotificationEvent } from '@repo/shared-types';
import { prisma } from '@repo/database';
import { builder } from '../builder';
import { NotificationDto, NotificationEventDto } from './notification-types';

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
      const data = await prisma.notification.findMany({
        ...query,
        where: { receivingUserId: ctx.currentUserId },
        orderBy: { createdAt: 'desc' },
      });
      return data;
    },
  }),
}));

builder.mutationFields((t) => ({
  markNotificationAsRead: t.withAuth({ isInOrg: true }).field({
    type: 'Boolean',
    nullable: false,
    args: {
      notificationId: t.arg.string({ required: true }),
    },
    resolve: async (_root, args, ctx) => {
      await prisma.notification.update({
        where: { id: args.notificationId, receivingUserId: ctx.currentUserId },
        data: { isRead: true },
      });
      return true;
    },
  }),
}));
