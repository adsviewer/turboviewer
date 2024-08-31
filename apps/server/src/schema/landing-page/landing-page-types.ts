import { builder } from '../builder';

export const LandingPageSupportMessageInput = builder.inputType('LandingPageSupportMessageInput', {
  fields: (t) => ({
    email: t.string({ required: true, validate: { email: true } }),
    fullName: t.string({ required: true }),
    phone: t.string({ required: false, defaultValue: undefined }),
    subject: t.string({ required: true }),
    message: t.string({ required: true }),
  }),
});
export type LandingPageSupportMessageInputType = typeof LandingPageSupportMessageInput.$inferInput;

export const LandingPageSupportMessageDto = builder.prismaObject('LandingPageSupportMessage', {
  fields: (t) => ({
    id: t.exposeID('id', { nullable: false }),
    email: t.exposeString('email', { nullable: false }),
    fullName: t.exposeString('fullName', { nullable: false }),
    phone: t.exposeString('phone', { nullable: true }),
    subject: t.exposeString('subject', { nullable: false }),
    message: t.exposeString('message', { nullable: false }),
  }),
});

export const NewsletterSubscriptionDto = builder.prismaObject('NewsletterSubscription', {
  fields: (t) => ({
    id: t.exposeID('id', { nullable: false }),
    email: t.exposeString('email', { nullable: false }),
  }),
});
