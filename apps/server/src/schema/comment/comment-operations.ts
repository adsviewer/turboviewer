import { NotificationTypeEnum, prisma } from '@repo/database';
import { commentBodySchema } from '@repo/utils';
import { pubSub } from '@repo/pubsub';
import { createId } from '@paralleldrive/cuid2';
import { builder } from '../builder';
import { CommentDto } from './comment-types';

builder.queryFields((t) => ({
  comments: t.withAuth({ isInOrg: true }).prismaConnection({
    type: CommentDto,
    cursor: 'id',
    defaultSize: 10,
    edgesNullable: false,
    nodeNullable: false,
    nullable: false,
    totalCount: async (_parent, args, _ctx, _info) => {
      return await prisma.comment.count({
        where: { creativeId: args.creativeId },
      });
    },
    args: {
      creativeId: t.arg.string({ required: true }),
    },
    resolve: async (query, _parent, args) => {
      const data = await prisma.comment.findMany({
        ...query,
        where: { creativeId: args.creativeId },
        orderBy: { createdAt: 'desc' },
      });
      return data;
    },
  }),
}));

builder.mutationFields((t) => ({
  upsertComment: t.withAuth({ isInOrg: true }).prismaField({
    nullable: false,
    type: CommentDto,
    args: {
      commentToUpdateId: t.arg.string({ required: false }),
      body: t.arg.string({ required: true, validate: { schema: commentBodySchema } }),
      creativeId: t.arg.string({ required: true }),
      taggedUsersIds: t.arg.stringList({ required: true, defaultValue: [] }),
    },
    resolve: async (query, _parent, args, ctx) => {
      const data = {
        body: args.body,
        creativeId: args.creativeId,
        userId: ctx.currentUserId,
        taggedUsers: {
          connect: args.taggedUsersIds.map((id) => ({ id })),
        },
      };

      if (!args.commentToUpdateId) {
        const notificationsData = args.taggedUsersIds.map((userToNotifyId) => ({
          id: createId(),
          receivingUserId: userToNotifyId,
          type: NotificationTypeEnum.COMMENT_MENTION,
          extraData: {
            commentMentionCreativeId: args.creativeId,
          },
          isRead: false,
        }));

        await prisma.notification.createMany({
          data: notificationsData,
        });

        // Fire notification events to notify tagged users
        for (const notification of notificationsData) {
          pubSub.publish('user:notification:new-notification', notification.receivingUserId, {
            id: notification.id,
            receivingUserId: notification.receivingUserId,
            type: NotificationTypeEnum.COMMENT_MENTION,
            extraData: {
              commentMentionCreativeId: args.creativeId,
            },
            isRead: false,
            createdAt: new Date(),
          });
        }
      }

      return await prisma.comment.upsert({
        ...query,
        where: { id: args.commentToUpdateId ?? createId() },
        create: data,
        update: data,
      });
    },
  }),

  deleteComment: t.withAuth({ isInOrg: true }).prismaField({
    nullable: false,
    type: CommentDto,
    args: {
      commentId: t.arg.string({ required: true }),
    },
    resolve: async (query, parent, args) => await prisma.comment.delete({ ...query, where: { id: args.commentId } }),
  }),
}));
