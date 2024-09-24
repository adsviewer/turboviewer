import { FeedbackType, prisma } from '@repo/database';
import { FireAndForget } from '@repo/utils';
import { GraphQLError } from 'graphql';
import { builder } from '../builder';
import { sendFeedbackReceivedEmail } from '../../email';
import { FeedbackDto, FeedbackTypeEnum } from './feedback-types';

const fireAndForget = new FireAndForget();

builder.mutationFields((t) => ({
  sendFeedback: t.withAuth({ authenticated: true }).field({
    nullable: false,
    type: FeedbackDto,
    args: {
      message: t.arg.string({ required: true }),
      type: t.arg({
        type: FeedbackTypeEnum,
        required: true,
      }),
    },
    validate: (args) => Boolean(args.message && args.type),
    resolve: async (_root, args, ctx, _info) => {
      const { message, type } = args;

      const validFeedbackTypes = [FeedbackType.BUG_REPORT, FeedbackType.FEATURE_SUGGESTION, FeedbackType.OTHER];
      if (!validFeedbackTypes.includes(type)) {
        throw new GraphQLError('Invalid feedback type');
      }

      const user = await prisma.user.findUnique({ where: { id: ctx.currentUserId } });
      if (!user) {
        throw new GraphQLError('User not found');
      }

      const feedback = await prisma.feedback.create({
        data: {
          userId: ctx.currentUserId,
          message,
          type,
          createdAt: new Date(),
        },
      });

      fireAndForget.add(() => sendFeedbackReceivedEmail(user.email, user.firstName, user.lastName));

      return {
        id: feedback.id,
        userId: feedback.userId,
        type: feedback.type,
        message: feedback.message,
        createdAt: feedback.createdAt,
      };
    },
  }),
}));
