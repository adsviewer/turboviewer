import { prisma } from '@repo/database';
import { FireAndForget } from '@repo/utils';
import { builder } from '../builder';
import { sendNewLandingPageSupportMessageEmail } from '../../email';
import {
  LandingPageSupportMessageDto,
  LandingPageSupportMessageInput,
  NewsletterSubscriptionDto,
} from './landing-page-types';

const fireAndForget = new FireAndForget();

builder.mutationFields((t) => ({
  sendLandingPageSupportMessage: t.prismaField({
    type: LandingPageSupportMessageDto,
    nullable: false,
    args: {
      args: t.arg({ type: LandingPageSupportMessageInput, required: true }),
    },
    resolve: async (query, _root, args, _ctx) => {
      fireAndForget.add(() => sendNewLandingPageSupportMessageEmail(args.args));
      return prisma.landingPageSupportMessage.create({ ...query, data: args.args });
    },
  }),
  subscribeNewsletter: t.prismaField({
    type: NewsletterSubscriptionDto,
    nullable: false,
    args: {
      email: t.arg.string({ required: true, validate: { email: true } }),
    },
    resolve: async (query, _root, args, _ctx) =>
      prisma.newsletterSubscription.upsert({
        ...query,
        where: { email: args.email },
        update: {},
        create: { email: args.email },
      }),
  }),
}));
