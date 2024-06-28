import { LoginProviderEnum, OrganizationRoleEnum, RoleEnum, type User, UserStatus } from '@repo/database';
import { builder } from '../builder';
import { OrganizationDto } from '../organization/org-types';

const AllRolesEnum = { ...RoleEnum, ...OrganizationRoleEnum };
const AllRolesDto = builder.enumType(AllRolesEnum, {
  name: 'AllRoles',
});

export const UserDto = builder.prismaObject('User', {
  fields: (t) => ({
    id: t.exposeID('id'),
    firstName: t.exposeString('firstName'),
    lastName: t.exposeString('lastName'),
    email: t.exposeString('email'),
    photoUrl: t.exposeString('photoUrl', { nullable: true }),
    status: t.expose('status', { type: UserStatusDto }),
    createdAt: t.expose('createdAt', { type: 'Date' }),
    updatedAt: t.expose('updatedAt', { type: 'Date' }),
    userRoles: t.stringList({
      select: (_args, _ctx, nestedSelection) => ({
        roles: {
          select: {
            role: nestedSelection(true),
            organizations: { select: { role: nestedSelection(true) } },
          },
        },
      }),
      resolve: (user) => user.roles.map(({ role }) => role),
    }),
    allRoles: t.field({
      type: [AllRolesDto],
      select: (_args, _ctx, nestedSelection) => ({
        roles: { select: { role: nestedSelection(true) } },
        organizations: { select: { role: nestedSelection(true) }, where: { organizationId: _ctx.organizationId } },
      }),
      resolve: (user) => {
        const userRoles = user.roles.map(({ role }) => role);
        const organizationRoles = user.organizations.map(({ role }) => role);
        return userRoles.concat(organizationRoles as unknown as RoleEnum[]);
      },
    }),
    organizations: t.relation('organizations'),
    currentOrganizationId: t.exposeString('currentOrganizationId', { nullable: true }),
    currentOrganization: t.relation('currentOrganization', { nullable: false, type: OrganizationDto }),
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
  }),
});

export type SignUpInput = typeof SignUpInputDto.$inferInput;
export const LoginProviderEnumDto = builder.enumType(LoginProviderEnum, { name: 'LoginProviderEnum' });

export const UserStatusDto = builder.enumType(UserStatus, { name: 'UserStatus' });
