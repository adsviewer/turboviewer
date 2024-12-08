import { GraphQLError } from 'graphql';
import { builder } from '../builder';
import { TierEnum } from '../organization/org-types';
import { creteStripeCheckoutSession, getStripePriceId } from '../../contexts/payment/stripe';
import { CurrencyEnumDto } from '../integrations/integration-types';
import { BillingPeriodEnum } from './payment-types';

builder.mutationFields((t) => ({
  createCheckoutSession: t.withAuth({ isRootOrg: true }).string({
    args: {
      billingPeriod: t.arg({ type: BillingPeriodEnum, required: true }),
      currency: t.arg({ type: CurrencyEnumDto, required: true }),
      tier: t.arg({ type: TierEnum, required: true }),
      numberOfSeats: t.arg.int({ required: true }),
    },
    resolve: async (_root, args, ctx, _info) => {
      const priceId = await getStripePriceId(args.tier, args.billingPeriod, args.currency);
      if (!priceId) {
        throw new GraphQLError('Price not found');
      }
      const sessionUrl = await creteStripeCheckoutSession(priceId, args.numberOfSeats, ctx.organizationId, args.tier);
      if (!sessionUrl) {
        throw new GraphQLError('Failed to create session');
      }
      return sessionUrl;
    },
  }),
}));
