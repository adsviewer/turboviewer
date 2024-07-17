import { EmailType, OrganizationRoleEnum, UserOrganizationStatus } from '@repo/database';
import { builder } from '../builder';

export const OrganizationDto = builder.prismaObject('Organization', {
  authScopes: (_organization, _ctx) => {
    // if (ctx.organizationId && ctx.organizationId === organization.id) return true;
    // if (ctx.isAdmin) return true;
    // if (!ctx.organizationId) return false;
    return true;
  },
  fields: (t) => ({
    id: t.exposeID('id'),
    parentId: t.exposeString('parentId', { nullable: true }),
    name: t.exposeString('name'),
    domain: t.exposeString('domain', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'Date' }),
    updatedAt: t.expose('updatedAt', { type: 'Date' }),
    userOrganizations: t.relation('users'),
    integrations: t.relation('integrations'),
    adAccounts: t.relation('adAccounts'),
    isRoot: t.boolean({
      resolve: (root, _args, _ctx) => root.parentId === null,
    }),
  }),
});

const orgRoleDescriptionMap = new Map<OrganizationRoleEnum, string>([
  [OrganizationRoleEnum.ORG_ADMIN, 'Ability to manage organization settings, integrations and members'],
  [OrganizationRoleEnum.ORG_MEMBER, 'Does not have any special permissions'],
  [OrganizationRoleEnum.ORG_OPERATOR, 'Ability to manage organization settings and members.'],
]);

export const OrganizationRoleEnumDto = builder.enumType('OrganizationRoleEnum', {
  values: Object.fromEntries(
    Object.entries(OrganizationRoleEnum).map(([name, value]) => [
      name,
      { value, description: orgRoleDescriptionMap.get(value) },
    ]),
  ),
});
export const UserOrganizationStatusDto = builder.enumType(UserOrganizationStatus, { name: 'UserOrganizationStatus' });

export const UserOrganizationStatusNotInvitedDto = builder.enumType('UserOrganizationStatusNotInvited', {
  values: Object.fromEntries(
    Object.entries(UserOrganizationStatus)
      .filter(([_, value]) => value !== UserOrganizationStatus.INVITED)
      .map(([name, value]) => [name, { value }]),
  ),
});

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

export const InviteUsersDto = builder.inputType('InviteUsers', {
  fields: (t) => ({
    email: t.string({ required: true, validate: { email: true } }),
    emailType: t.field({ type: EmailTypeDto, required: true }),
    firstName: t.string({ required: true }),
    lastName: t.string({ required: true }),
  }),
});

export const EmailTypeDto = builder.enumType(EmailType, { name: 'EmailType' });

export type InviteUserInput = typeof InviteUsersDto.$inferInput;

export const inviteLinkDto = builder.simpleObject('InviteLinks', {
  fields: (t) => ({
    url: t.string({ nullable: false }),
    role: t.field({ type: OrganizationRoleEnumDto, nullable: false }),
  }),
});
