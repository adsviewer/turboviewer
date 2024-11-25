import { NotificationTypeEnum, prisma } from '@repo/database';
import { commentBodySchema } from '@repo/utils';
import { pubSub } from '@repo/pubsub';
import { builder } from '../builder';
import { CommentDto } from './comment-types';

builder.queryFields((t) => ({
  comments: t.withAuth({ isInOrg: true }).prismaField({
    type: [CommentDto],
    nullable: false,
    args: {
      creativeId: t.arg.string({ required: true }),
    },
    resolve: async (query, parent, args) => {
      const data = await prisma.comment.findMany({
        ...query,
        where: { creativeId: args.creativeId },
      });

      return data;
    },
  }),
}));

builder.mutationFields((t) => {
  return {
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
          ...query,
          body: args.body,
          creativeId: args.creativeId,
          userId: ctx.currentUserId,
          taggedUsers: {
            connect: args.taggedUsersIds.map((id) => ({ id })),
          },
        };

        if (!args.commentToUpdateId) {
          await prisma.notification.createMany({
            data: args.taggedUsersIds.map((userToNotifyId) => ({
              receivingUserId: userToNotifyId,
              type: NotificationTypeEnum.COMMENT_MENTION,
              extraData: {
                commentMentionCreativeId: args.creativeId,
              },
              isRead: false,
            })),
          });

          // Fire notification events to notify tagged users
          for (const userToNotifyId of args.taggedUsersIds) {
            pubSub.publish('user:notification:new-notification', ctx.currentUserId, {
              receivingUserId: userToNotifyId,
              type: NotificationTypeEnum.COMMENT_MENTION,
              extraData: {
                commentMentionCreativeId: args.creativeId,
              },
              isRead: false,
            });
          }
          return await prisma.comment.create({ data });
        }
        return await prisma.comment.update({ where: { id: args.commentToUpdateId }, data });
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
  };
});
