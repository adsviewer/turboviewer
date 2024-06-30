import { OrganizationRoleEnum, UserOrganizationStatus } from '@repo/database';
import { builder } from '../builder';

export const OrganizationDto = builder.prismaObject('Organization', {
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    domain: t.exposeString('domain', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'Date' }),
    updatedAt: t.expose('updatedAt', { type: 'Date' }),
    userOrganizations: t.relation('users'),
    integrations: t.relation('integrations'),
  }),
});

export const OrganizationRoleEnumDto = builder.enumType(OrganizationRoleEnum, { name: 'OrganizationRoleEnum' });
export const UserOrganizationStatusDto = builder.enumType(UserOrganizationStatus, { name: 'UserOrganizationStatus' });

export const UserOrganizationDto = builder.prismaObject('UserOrganization', {
  fields: (t) => ({
    userId: t.exposeID('userId'),
    organizationId: t.exposeString('organizationId'),
    role: t.expose('role', { type: OrganizationRoleEnumDto }),
    status: t.expose('status', { type: UserOrganizationStatusDto }),
    user: t.relation('user'),
    organization: t.relation('organization'),
  }),
});
