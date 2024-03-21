import { type User } from '@repo/database';
import { builder } from '../builder';

export const UserDto = builder.prismaObject('User', {
  fields: (t) => ({
    id: t.exposeID('id'),
    firstName: t.exposeString('firstName'),
    lastName: t.exposeString('lastName'),
    email: t.exposeString('email'),
    createdAt: t.expose('createdAt', { type: 'Date' }),
    updatedAt: t.expose('createdAt', { type: 'Date' }),
    roles: t.field({
      type: [RoleDto],
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
    user: User;
  }>('TokenDto')
  .implement({
    fields: (t) => ({
      token: t.string({ nullable: false, resolve: (result) => result.token }),
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
  }),
});

export const RoleDto = builder.prismaObject('Role', {
  select: { id: true },
  fields: (t) => ({
    name: t.exposeString('name'),
  }),
});
