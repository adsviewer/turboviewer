import { prisma } from '@repo/database';
import { FireAndForget, messageSchema } from '@repo/utils';
import { builder } from '../builder';
import { sendFeedbackReceivedEmail } from '../../email';
import { FeedbackDto, FeedbackType } from './feedback-types';

const fireAndForget = new FireAndForget();

builder.mutationFields((t) => ({
  sendFeedback: t.withAuth({ authenticated: true }).prismaField({
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

      const user = await prisma.user.findUniqueOrThrow({ where: { id: ctx.currentUserId } });

      fireAndForget.add(() => sendFeedbackReceivedEmail(user.email, user.firstName, user.lastName));

      return await prisma.feedback.create({
        data: {
          userId: ctx.currentUserId,
          message,
          type,
        },
      });
    },
  }),
}));
