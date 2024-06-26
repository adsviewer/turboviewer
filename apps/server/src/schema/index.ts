import { builder } from './builder';
import './errors';
import './integrations/integration-operations';
import './integrations/insights-operations';
import './organization/org-types';
import './user/organization-operations';
import './user/social-login-operations';
import './user/user-operations';

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
