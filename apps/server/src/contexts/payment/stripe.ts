import Stripe from 'stripe';
import { type CurrencyEnum, prisma, type Tier } from '@repo/database';
import { logger } from '@repo/logger';
import { redisGet, redisSet, redisSingletonExists } from '@repo/redis';
import { Consumer } from 'sqs-consumer';
import { MODE } from '@repo/mode';
import { type Message } from '@aws-sdk/client-sqs';
import { switchTierHelper } from '@repo/backend-shared';
import { env } from '../../config';
import { stripeWebhookSchema } from './stripe-webhook-types';

export const stripe = new Stripe(env.STRIPE_SECRET_KEY);

interface StripeSubscription {
  organizationId: string;
  tier: Tier;
  numberOfSeats: number;
}

const checkoutKey = (sessionId: string) => `stripe:checkout:${sessionId}`;

export const getStripePriceId = async (
  tier: Tier,
  billingPeriod: 'Monthly' | 'Yearly',
  currency: CurrencyEnum,
): Promise<string | null> => {
  const prices = await stripe.prices.search({
    query: `lookup_key:"${tier}-${billingPeriod}-${currency}"`,
  });
  if (prices.data.length === 0) {
    return null;
  }
  return prices.data[0].id;
};

export const creteStripeCheckoutSession = async (
  priceId: string,
  numberOfSeats: number,
  organizationId: string,
  tier: Tier,
): Promise<string | null> => {
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price: priceId,
        quantity: numberOfSeats,
      },
    ],
    mode: 'subscription',
    success_url: `${env.PUBLIC_URL}/payment/success`,
    cancel_url: `${env.PUBLIC_URL}/payment/cancel`,
  });

  await redisSet(
    checkoutKey(session.id),
    { organizationId, tier, numberOfSeats } satisfies StripeSubscription,
    3600 * 24,
  );
  logger.info(`Stripe checkout session created: ${JSON.stringify(session)}`);
  return session.url;
};

export const commonConsumerInit = (consumer: Consumer): void => {
  consumer.on('error', (err) => {
    logger.warn('SQS Consumer Error:', err.message);
    logger.warn(err);
  });

  consumer.on('processing_error', (err) => {
    logger.warn('SQS Processing Error:', err.message);
    logger.warn(err);
  });

  consumer.on('message_received', (message) => {
    logger.debug(`Message received ${String(message.MessageId)}`);
  });

  consumer.on('message_processed', (message) => {
    logger.debug(`Message processed ${String(message.MessageId)}`);
  });

  consumer.on('stopped', () => {
    logger.warn('SQS Consumer stopped.');
  });

  consumer.start();
  logger.debug('SQS Listener initialized successfully.');
};

const consumer = Consumer.create({
  queueUrl: `https://sqs.${env.AWS_REGION}.amazonaws.com/${env.AWS_ACCOUNT_ID}/${MODE}-${env.AWS_USERNAME ? `${env.AWS_USERNAME}-` : ''}stripe`,
  region: env.AWS_REGION,
  handleMessage: async (message: Message) => {
    if (await redisSingletonExists(checkoutKey(String(message.MessageId)), 60)) return;
    if (!message.Body) return;
    const parsed = stripeWebhookSchema.safeParse(JSON.parse(message.Body));
    if (!parsed.success) {
      logger.warn(parsed.error, 'Error parsing stripe webhook');
      return;
    }
    const subscription = await redisGet<StripeSubscription>(`stripe:checkout:${parsed.data.detail.data.object.id}`);
    if (!subscription) {
      logger.warn('Subscription not found');
      return;
    }
    await prisma.organization.update({
      where: { id: subscription.organizationId },
      data: {
        paymentProviderCustomerId: parsed.data.detail.data.object.customer,
        paymentProviderSubscriptionId: parsed.data.detail.data.object.subscription,
      },
    });

    await switchTierHelper(subscription.organizationId, subscription.tier, {});
  },
});

commonConsumerInit(consumer);
