import { GraphQLError } from 'graphql';
import { DateTimeResolver, JSONResolver } from 'graphql-scalars';
import SchemaBuilder from '@pothos/core';
import ErrorsPlugin from '@pothos/plugin-errors';
// eslint-disable-next-line import/no-named-as-default -- This is a false positive
import PrismaPlugin from '@pothos/plugin-prisma';
import type PrismaTypes from '@pothos/plugin-prisma/generated';
import RelayPlugin from '@pothos/plugin-relay';
import ScopeAuthPlugin from '@pothos/plugin-scope-auth';
import SimpleObjectsPlugin from '@pothos/plugin-simple-objects';
import ValidationPlugin from '@pothos/plugin-validation';
import { prisma, Prisma } from '@repo/database';
import { AError } from '@repo/utils';
import { type GraphQLContext } from '../context';
import JsonValue = Prisma.JsonValue;

export interface AuthenticatedContext extends GraphQLContext {
  currentUserId: NonNullable<GraphQLContext['currentUserId']>;
  organizationId: NonNullable<GraphQLContext['organizationId']>;
  isAdmin: NonNullable<GraphQLContext['isAdmin']>;
  isOrgAdmin: NonNullable<GraphQLContext['isOrgAdmin']>;
  isRefreshToken: NonNullable<GraphQLContext['isRefreshToken']>;
}

export interface RefreshContext extends GraphQLContext {
  currentUserId: NonNullable<GraphQLContext['currentUserId']>;
  organizationId: NonNullable<GraphQLContext['organizationId']>;
  isRefreshToken: NonNullable<GraphQLContext['isRefreshToken']>;
}

export const builder = new SchemaBuilder<{
  Context: GraphQLContext;
  Scalars: {
    Date: {
      Input: Date;
      Output: Date;
    };
    JSON: {
      Input: JsonValue;
      Output: JsonValue;
    };
  };
  PrismaTypes: PrismaTypes;
  AuthScopes: {
    authenticated: boolean;
    isAdmin: boolean;
    isOrgAdmin: boolean;
    refresh: boolean;
  };
  AuthContexts: {
    authenticated: AuthenticatedContext;
    isAdmin: AuthenticatedContext;
    isOrgAdmin: AuthenticatedContext;
    refresh: RefreshContext;
  };
}>({
  plugins: [ErrorsPlugin, RelayPlugin, ScopeAuthPlugin, PrismaPlugin, SimpleObjectsPlugin, ValidationPlugin],
  errorOptions: {
    defaultTypes: [AError],
  },
  relayOptions: {
    // These will become the defaults in the next major version
    clientMutationId: 'omit',
    cursorType: 'ID',
  },
  authScopes: (context) => ({
    authenticated: Boolean(context.currentUserId) && !context.isRefreshToken,
    isAdmin: Boolean(context.isAdmin) && !context.isRefreshToken,
    isOrgAdmin: Boolean(context.isOrgAdmin) && !context.isRefreshToken,
    refresh: Boolean(context.isRefreshToken),
  }),
  scopeAuthOptions: {
    // Recommended when using subscriptions
    // when this is not set, auth checks are run when event is resolved rather than when the subscription is created
    authorizeOnSubscribe: true,
    unauthorizedError: (_parent, _context, _info, _result) => new GraphQLError(`Not authorized`),
  },
  prisma: {
    client: prisma,
    // defaults to false, uses /// comments from prisma schema as descriptions
    // for object types, relations and exposed fields.
    // descriptions can be omitted by setting description to false
    // exposeDescriptions: boolean | { models: boolean, fields: boolean },
    // use where clause from prismaRelatedConnection for totalCount (will true by default in next major version)
    filterConnectionTotalCount: true,
  },
  validationOptions: {
    // optionally customize how errors are formatted
    validationError: (zodError, _args, _context, _info) => {
      // the default behavior is to just throw the zod error directly
      return new GraphQLError(zodError.issues.map((issue) => issue.message).join('\n'));
    },
  },
});

builder.addScalarType('Date', DateTimeResolver, {});
builder.addScalarType('JSON', JSONResolver, {});
