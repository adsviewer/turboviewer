import { OrganizationRoleEnum, Tier, UserOrganizationStatus } from '@repo/database';
import { AError } from '@repo/utils';
import { builder } from '../builder';
import { ErrorInterface } from '../errors';

export const OrganizationDto = builder.prismaObject('Organization', {
  authScopes: (organization, ctx) => {
    if (ctx.organizationId && ctx.organizationId === organization.id) return true;
    if (ctx.isAdmin) return true;
    return {
      $granted: 'readOrganization',
    };
  },
  fields: (t) => ({
    id: t.exposeID('id', { nullable: false }),
    parentId: t.exposeString('parentId', { nullable: true }),
    name: t.exposeString('name', { nullable: false }),
    domain: t.exposeString('domain', { nullable: true }),
    createdAt: t.expose('createdAt', { type: 'Date', nullable: false }),
    updatedAt: t.expose('updatedAt', { type: 'Date', nullable: false }),
    userOrganizations: t.relation('users', { nullable: false }),
    integrations: t.relation('integrations', { nullable: false }),
    adAccounts: t.relation('adAccounts', { nullable: false }),
    tier: t.expose('tier', { type: TierEnum, nullable: false }),
    isRoot: t.boolean({
      nullable: false,
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

export const UserOrganizationDto = builder.prismaObject('UserOrganization', {
  fields: (t) => ({
    userId: t.exposeID('userId', { nullable: false }),
    organizationId: t.exposeString('organizationId', { nullable: false }),
    role: t.expose('role', { type: OrganizationRoleEnumDto, nullable: false }),
    status: t.expose('status', { type: UserOrganizationStatusDto, nullable: false }),
    user: t.relation('user', { nullable: false }),
    organization: t.relation('organization', { grantScopes: ['readOrganization'], nullable: false }),
  }),
});

export class InviteUsersErrors extends AError {
  error: { email: string; message: string }[];

  constructor(error: { email: string; message: string }[]) {
    super('Some users were not invited');
    this.error = error;
    this.name = 'InviteUsersErrors';
  }
}

export const InviteUsersErrorDto = builder.simpleObject('InviteUsersError', {
  fields: (t) => ({
    email: t.string({ nullable: false }),
    message: t.string({ nullable: false }),
  }),
});

export const InviteUsersErrorsDto = builder.objectType(InviteUsersErrors, {
  name: 'InviteUsersErrors',
  interfaces: [ErrorInterface],
  fields: (t) => ({
    error: t.expose('error', { type: [InviteUsersErrorDto], nullable: false }),
  }),
});

export const InviteLinkDto = builder.simpleObject('InviteLinks', {
  fields: (t) => ({
    url: t.string({ nullable: false }),
    role: t.field({ type: OrganizationRoleEnumDto, nullable: false }),
  }),
});

export const TierEnum = builder.enumType(Tier, { name: 'Tier' });
