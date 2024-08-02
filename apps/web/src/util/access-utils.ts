import { AllRoles, OrganizationRoleEnum } from '@/graphql/generated/schema-server';

type RoleType = AllRoles | OrganizationRoleEnum;

export const isAdmin = (roles: AllRoles[]): boolean => {
  return roles.includes(AllRoles.ADMIN);
};

export const isOrgAdmin = (roles: RoleType[]): boolean => {
  return roles.includes(OrganizationRoleEnum.ORG_ADMIN as OrganizationRoleEnum);
};

export const isMember = (roles: RoleType[]): boolean => {
  return roles.includes(OrganizationRoleEnum.ORG_MEMBER as OrganizationRoleEnum);
};

export const isOperator = (roles: RoleType[]): boolean => {
  return roles.includes(OrganizationRoleEnum.ORG_OPERATOR as OrganizationRoleEnum);
};
