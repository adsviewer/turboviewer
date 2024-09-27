import { FeedbackTypeEnum } from '@repo/database';
import { builder } from '../builder';

export const FeedbackType = builder.enumType(FeedbackTypeEnum, {
  name: 'FeedbackTypeEnum',
});

export const FeedbackDto = builder.prismaObject('Feedback', {
  fields: (t) => ({
    type: t.expose('type', {
      type: FeedbackType,
      nullable: false,
    }),
    message: t.exposeString('message', { nullable: false }),
  }),
});
