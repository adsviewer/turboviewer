import {
  LoginProviderEnum,
  MilestoneEnum,
  OrganizationRoleEnum,
  prisma,
  RoleEnum,
  type User,
  UserOrganizationStatus,
  UserStatus,
} from '@repo/database';
import { type InputShapeFromFields } from '@pothos/core';
import { builder } from '../builder';
import { OrganizationDto } from '../organization/org-types';
import { type GraphQLContext } from '../../context';

const AllRolesEnum = { ...RoleEnum, ...OrganizationRoleEnum };
const AllRolesDto = builder.enumType(AllRolesEnum, {
  name: 'AllRoles',
});

const baseUserDtoAuthScopes = (user: User, ctx: GraphQLContext): boolean | undefined => {
  if (ctx.currentUserId === user.id) return true;
  if (ctx.isAdmin) return true;
  if (!ctx.organizationId) return false;
  return undefined;
};

const commonOrgAuthScopes = async (user: User, ctx: GraphQLContext): Promise<boolean> => {
  const baseScopes = baseUserDtoAuthScopes(user, ctx);
  if (baseScopes !== undefined) return baseScopes;
  const commonOrg = await prisma.userOrganization.findUnique({
    where: {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- checked in baseScopes
      userId_organizationId: { userId: user.id, organizationId: ctx.organizationId! },
    },
  });
  return Boolean(commonOrg);
};

const commonOrgFieldProps = {
  skipTypeScopes: true,
  description: 'Caller is permitted to view this field if they are in a common organization',
  authScopes: (user: User, _args: InputShapeFromFields<NonNullable<unknown>>, ctx: GraphQLContext) =>
    commonOrgAuthScopes(user, ctx),
};

export const UserDto = builder.prismaObject('User', {
  authScopes: (user, ctx) => {
    const baseScopes = baseUserDtoAuthScopes(user, ctx);
    return baseScopes ?? false;
  },
  description:
    'Caller is permitted to view this type if is the user or an admin. Some fields are also permitted if the caller and the user are in a common organization',
  fields: (t) => ({
    id: t.exposeID('id', { nullable: false, ...commonOrgFieldProps }),
    firstName: t.exposeString('firstName', { nullable: false, ...commonOrgFieldProps }),
    lastName: t.exposeString('lastName', { nullable: false, ...commonOrgFieldProps }),
    email: t.exposeString('email', { nullable: false, ...commonOrgFieldProps }),
    photoUrl: t.exposeString('photoUrl', { nullable: true, ...commonOrgFieldProps }),
    status: t.expose('status', { type: UserStatusDto, nullable: false }),
    milestones: t.expose('milestones', { type: [MilestonesDto], nullable: false }),
    createdAt: t.expose('createdAt', { type: 'Date', nullable: false }),
    updatedAt: t.expose('updatedAt', { type: 'Date', nullable: false }),
    userRoles: t.stringList({
      nullable: false,
      select: (_args, _ctx, nestedSelection) => ({
        roles: {
          select: {
            role: nestedSelection(true),
          },
        },
      }),
      resolve: (user) => user.roles.map(({ role }) => role),
    }),
    allRoles: t.field({
      type: [AllRolesDto],
      nullable: false,
      select: (_args, ctx, nestedSelection) => ({
        roles: { select: { role: nestedSelection(true) } },
        ...(ctx.organizationId
          ? {
              organizations: {
                select: { role: nestedSelection(true) },
                where: { organizationId: ctx.organizationId },
              },
            }
          : {}),
      }),
      resolve: (user, _args, ctx) => {
        const userRoles = user.roles.map(({ role }) => role);
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- it can be null since we may not be selecting organizations on top
        const organizationRoles = ctx.organizationId ? user.organizations?.map(({ role }) => role) : [];
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- it can be null since we may not be selecting organizations on top
        return organizationRoles ? userRoles.concat(organizationRoles as unknown as RoleEnum[]) : userRoles;
      },
    }),
    organizations: t.relation('organizations', {
      nullable: false,
      query: { where: { status: UserOrganizationStatus.ACTIVE } },
    }),
    currentOrganizationId: t.exposeString('currentOrganizationId', { nullable: true }),
    currentOrganization: t.relation('currentOrganization', { nullable: true, type: OrganizationDto }),
  }),
});

export const TokenUserDto = builder
  .objectRef<{
    token: string;
    refreshToken: string;
    user: User;
  }>('TokenDto')
  .implement({
    fields: (t) => ({
      token: t.string({ nullable: false, resolve: (result) => result.token }),
      refreshToken: t.string({ nullable: false, resolve: (result) => result.refreshToken }),
      user: t.field({
        type: UserDto,
        nullable: false,
        resolve: (result) => result.user,
      }),
    }),
  });

export const TokensDto = builder.simpleObject('Tokens', {
  fields: (t) => ({
    token: t.string({ nullable: false }),
    refreshToken: t.string({ nullable: false }),
  }),
});

export const GenerateGoogleAuthUrlResponseDto = builder.simpleObject('GenerateGoogleAuthUrlResponse', {
  fields: (t) => ({
    url: t.string({ nullable: false }),
    type: t.field({ type: LoginProviderEnumDto, nullable: false }),
  }),
});

export const SignUpInputDto = builder.inputType('SignUpInput', {
  fields: (t) => ({
    email: t.string({ required: true }),
    password: t.string({ required: true }),
    firstName: t.string({ required: true }),
    lastName: t.string({ required: true }),
    inviteHash: t.string({ required: false }),
  }),
});

export type SignUpInput = typeof SignUpInputDto.$inferInput;
export const LoginProviderEnumDto = builder.enumType(LoginProviderEnum, { name: 'LoginProviderEnum' });

export const UserStatusDto = builder.enumType(UserStatus, { name: 'UserStatus' });
export const MilestonesDto = builder.enumType(MilestoneEnum, { name: 'Milestones' });
