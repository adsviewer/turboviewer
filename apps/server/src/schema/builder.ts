import { GraphQLError } from 'graphql';
import { BigIntResolver, DateTimeResolver, JSONResolver } from 'graphql-scalars';
import SchemaBuilder from '@pothos/core';
import ErrorsPlugin from '@pothos/plugin-errors';
import PrismaPlugin from '@pothos/plugin-prisma';
import type PrismaTypes from '@pothos/plugin-prisma/generated';
import RelayPlugin from '@pothos/plugin-relay';
import ScopeAuthPlugin from '@pothos/plugin-scope-auth';
import SimpleObjectsPlugin from '@pothos/plugin-simple-objects';
import ZodPlugin from '@pothos/plugin-zod';
import { prisma, Prisma } from '@repo/database';
import { Environment, MODE } from '@repo/mode';
import { type GraphQLContext } from '../context';
import { getRootOrganizationId } from '../contexts/organization';
import JsonValue = Prisma.JsonValue;

export interface AuthenticatedContext extends GraphQLContext {
  currentUserId: NonNullable<GraphQLContext['currentUserId']>;
}

export interface InOrganizationContext extends GraphQLContext {
  currentUserId: NonNullable<GraphQLContext['currentUserId']>;
  organizationId: NonNullable<GraphQLContext['organizationId']>;
  isAdmin: NonNullable<GraphQLContext['isAdmin']>;
  isOrgAdmin: NonNullable<GraphQLContext['isOrgAdmin']>;
  isOrgOperator: NonNullable<GraphQLContext['isOrgOperator']>;
  isOrgMember: NonNullable<GraphQLContext['isOrgMember']>;
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
    BigInt: {
      Input: bigint;
      Output: bigint;
    };
  };
  PrismaTypes: PrismaTypes;
  AuthScopes: {
    authenticated: boolean;
    isAdmin: boolean;
    isOrgAdmin: boolean;
    isOrgOperator: boolean;
    isOrgMember: boolean;
    isRootOrg: boolean;
    isInOrg: boolean;
    refresh: boolean;
    emailUnconfirmed: boolean;
  };
  AuthContexts: {
    authenticated: AuthenticatedContext;
    isAdmin: AuthenticatedContext;
    isOrgAdmin: InOrganizationContext;
    isOrgOperator: InOrganizationContext;
    isOrgMember: InOrganizationContext;
    isInOrg: InOrganizationContext;
    refresh: RefreshContext;
    emailUnconfirmed: InOrganizationContext;
  };
}>({
  plugins: [ErrorsPlugin, RelayPlugin, ScopeAuthPlugin, PrismaPlugin, SimpleObjectsPlugin, ZodPlugin],
  scopeAuth: {
    // Recommended when using subscriptions
    // when this is not set, auth checks are run when event is resolved rather than when the subscription is created
    authorizeOnSubscribe: true,
    unauthorizedError: (_parent, _context, _info, _result) => new GraphQLError(`Not authorized`),
    authScopes: (context) => ({
      authenticated: Boolean(context.currentUserId) && !context.isRefreshToken && !context.emailUnconfirmed,
      isAdmin: Boolean(context.isAdmin) && !context.isRefreshToken && !context.emailUnconfirmed,
      isOrgAdmin: Boolean(context.isOrgAdmin) && !context.isRefreshToken && !context.emailUnconfirmed,
      isOrgOperator: Boolean(context.isOrgOperator) && !context.isRefreshToken && !context.emailUnconfirmed,
      isOrgMember: Boolean(context.isOrgMember) && !context.isRefreshToken && !context.emailUnconfirmed,
      isRootOrg: async () =>
        Boolean(
          context.organizationId && context.organizationId === (await getRootOrganizationId(context.organizationId)),
        ),
      isInOrg: Boolean(context.isInOrg) && !context.isRefreshToken && !context.emailUnconfirmed,
      refresh: Boolean(context.isRefreshToken),
      emailUnconfirmed: Boolean(context.emailUnconfirmed),
    }),
  },
  prisma: {
    client: prisma,
    // defaults to false, uses /// comments from prisma schema as descriptions
    // for object types, relations and exposed fields.
    // descriptions can be omitted by setting description to false
    exposeDescriptions: true,
    // use where clause from prismaRelatedConnection for totalCount (defaults to true)
    filterConnectionTotalCount: true,
    // warn when not using a query parameter correctly
    onUnusedQuery: MODE === Environment.Production ? null : 'warn',
  },
  zod: {
    // optionally customize how errors are formatted
    validationError: (zodError, _args, _context, _info) => {
      // the default behavior is to just throw the zod error directly
      return new GraphQLError(zodError.issues.map((issue) => issue.message).join('\n'));
    },
  },
});

builder.addScalarType('Date', DateTimeResolver, {});
builder.addScalarType('JSON', JSONResolver, {});
builder.addScalarType('BigInt', BigIntResolver, {});
