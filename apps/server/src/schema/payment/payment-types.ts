import { builder } from '../builder';

export const BillingPeriodEnum = builder.enumType('BillingPeriodEnum', {
  values: ['Monthly', 'Yearly'],
});
