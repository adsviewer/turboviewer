import { builder } from './builder';
import './errors';
import './integrations/integration-operations';
import './integrations/insights-operations';
import './landing-page/landing-page-operations';
import './organization/org-types';
import './organization/organization-operations';
import './user/social-login-operations';
import './user/invite-operations';
import './user/user-operations';
import './feedback/feedback-operation';

builder.queryType({
  fields: (_t) => ({}),
});

builder.mutationType({
  fields: (_t) => ({}),
});

builder.subscriptionType({
  fields: (_t) => ({}),
});

export const schema = builder.toSchema({});
