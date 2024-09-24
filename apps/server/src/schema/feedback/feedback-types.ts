import { builder } from '../builder';

export const FeedbackTypeEnum = builder.enumType('FeedbackType', {
  values: {
    BUG_REPORT: { description: 'Report a bug' },
    FEATURE_SUGGESTION: { description: 'Suggest a feature' },
    OTHER: { description: 'Other feedback' },
  },
});

export const FeedbackDto = builder.simpleObject('Feedback', {
  fields: (t) => ({
    type: t.field({
      type: FeedbackTypeEnum,
    }),
    message: t.string({ nullable: false }),
  }),
});
