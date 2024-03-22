import { builder } from './builder';
import './errors';
import './organization/org-types';
import './user/google-login-operations';
import './user/user-operations';

builder.queryType({
  fields: (_t) => ({}),
});

builder.mutationType({
  fields: (_t) => ({}),
});

// builder.subscriptionType({
//   fields: (_t) => ({}),
// });

export const schema = builder.toSchema({});
