import { prisma } from '@repo/database';
import { messageSchema } from '@repo/utils';
import { builder } from '../builder';
import { FeedbackDto, FeedbackType } from './feedback-types';
import { postFeedbackToSlack } from './feedback-helper';

builder.mutationFields((t) => ({
  sendFeedback: t.withAuth({ isInOrg: true }).prismaField({
    nullable: false,
    type: FeedbackDto,
    args: {
      message: t.arg.string({ required: true, validate: { schema: messageSchema } }),
      type: t.arg({
        type: FeedbackType,
        required: true,
      }),
    },
    resolve: async (query, _root, args, ctx, _info) => {
      const { message, type } = args;

      const res = await prisma.feedback.create({
        ...query,
        data: {
          userId: ctx.currentUserId,
          message,
          type,
          currentOrganizationId: ctx.organizationId,
        },
      });
      await postFeedbackToSlack(res);

      return res;
    },
  }),
}));
