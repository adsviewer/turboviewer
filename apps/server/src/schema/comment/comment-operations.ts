import { prisma } from '@repo/database';
import { builder } from '../builder';
import { CommentDto } from './comment-types';

builder.queryFields((t) => ({
  comments: t.withAuth({ isInOrg: true }).prismaField({
    type: [CommentDto],
    nullable: false,
    args: {
      creativeId: t.arg.string({ required: true }),
    },
    resolve: async (query, parent, args) =>
      prisma.comment.findMany({
        ...query,
        where: { creativeId: args.creativeId },
      }),
  }),
}));

builder.mutationFields((t) => ({
  upsertComment: t.withAuth({ isInOrg: true }).prismaField({
    nullable: false,
    type: CommentDto,
    args: {
      commentToUpdateId: t.arg.string({ required: false }),
      body: t.arg.string({ required: true }),
      creativeId: t.arg.string({ required: true }),
      taggedUsersIds: t.arg.stringList({ required: true, defaultValue: [] }),
    },
    resolve: async (query, parent, args, ctx) => {
      const data = {
        ...query,
        body: args.body,
        creativeId: args.creativeId,
        userId: ctx.currentUserId,
        taggedUsers: {
          connect: args.taggedUsersIds.map((id) => ({ id })),
        },
      };

      return !args.commentToUpdateId
        ? prisma.comment.create({ data })
        : prisma.comment.update({ where: { id: args.commentToUpdateId }, data });
    },
  }),
  deleteComment: t.withAuth({ isInOrg: true }).prismaField({
    nullable: false,
    type: CommentDto,
    args: {
      commentId: t.arg.string({ required: true }),
    },
    resolve: async (query, parent, args) => prisma.comment.delete({ ...query, where: { id: args.commentId } }),
  }),
}));
