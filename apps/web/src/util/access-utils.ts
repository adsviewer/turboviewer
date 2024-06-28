import { AllRoles } from '@/graphql/generated/schema-server';

export const isOrgAdmin = (roles: AllRoles[]): boolean => {
  return roles.includes(AllRoles.ORG_ADMIN);
};

export const isAdmin = (roles: AllRoles[]): boolean => {
  return roles.includes(AllRoles.ADMIN);
};

export const isMember = (roles: AllRoles[]): boolean => {
  return roles.includes(AllRoles.ORG_MEMBER) || roles.includes(AllRoles.USER);
};
