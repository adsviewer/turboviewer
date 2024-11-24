import { pubSub } from '@repo/pubsub';
import { type NotificationEvent } from '@repo/shared-types';
import { NotificationTypeEnum, prisma } from '@repo/database';
import { builder } from '../builder';
import { NotificationDto } from './notification-types';

builder.subscriptionFields((t) => ({
  notificationEvent: t.withAuth({ isInOrg: true }).field({
    type: NotificationDto,
    nullable: false,
    resolve: (root: NotificationEvent, _args, _ctx, _info) => {
      return root;
    },
    subscribe: (_root, _args, ctx) => {
      return pubSub.subscribe('user:notification:new-notification', ctx.currentUserId);
    },
  }),
}));

builder.mutationFields((t) => ({
  createNotification: t.withAuth({ isInOrg: true }).prismaField({
    nullable: false,
    type: NotificationDto,
    args: {
      receivingUserId: t.arg.string({ required: true }),
      type: t.arg({ type: NotificationTypeEnum, required: true }),
      commentMentionCreativeId: t.arg.string({ required: false }),
    },
    resolve: async (query, _root, args, _ctx) => {
      return await prisma.notification.create({
        ...query,
        data: {
          receivingUserId: args.receivingUserId,
          type: args.type,
          commentMentionCreativeId: args.commentMentionCreativeId,
        },
      });
    },
  }),
}));
