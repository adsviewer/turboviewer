import { LoginProviderEnum, type User } from '@repo/database';
import { builder } from '../builder';

export const UserDto = builder.prismaObject('User', {
  fields: (t) => ({
    id: t.exposeID('id'),
    firstName: t.exposeString('firstName'),
    lastName: t.exposeString('lastName'),
    email: t.exposeString('email'),
    photoUrl: t.exposeString('photoUrl', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'Date' }),
    updatedAt: t.expose('updatedAt', { type: 'Date' }),
    roles: t.stringList({
      select: (_args, _ctx, nestedSelection) => ({
        roles: {
          select: {
            role: nestedSelection(true),
          },
        },
      }),
      resolve: (user) => user.roles.map(({ role }) => role),
    }),
    organizationId: t.exposeID('organizationId'),
    organization: t.relation('organization'),
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

export const GenerateGoogleAuthUrlResponseDto = builder.simpleObject('GenerateGoogleAuthUrlResponse', {
  fields: (t) => ({
    url: t.string({ nullable: false }),
    name: t.field({ type: LoginProviderEnumDto, nullable: false }),
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
