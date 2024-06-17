import { type YogaInitialContext } from 'graphql-yoga';
import { $Enums, OrganizationRoleEnum } from '@repo/database';
import { isAError } from '@repo/utils';
import { GraphQLError } from 'graphql/index';
import { decodeJwt } from './auth';
import { acceptedLanguage, type Language } from './language';
import RoleEnum = $Enums.RoleEnum;

export interface GraphQLContext {
  currentUserId: undefined | string;
  organizationId: undefined | string;
  acceptedLanguage: Language;
  isAdmin: boolean | undefined;
  isOrgAdmin: boolean | undefined;
  isInOrg: boolean | undefined;
  isRefreshToken: boolean | undefined;
  request: {
    operatingSystem: string;
    browserName: string;
  };
}

export const createContext = (initialContext: YogaInitialContext): GraphQLContext => {
  const token = decodeJwt(initialContext.request);
  if (isAError(token)) {
    throw new GraphQLError(token.message);
  }

  const userAgent = initialContext.request.headers.get('user-agent') ?? '';
  const operatingSystem = userAgent.split('(')[1]?.split(')')[0] || 'Unknown';
  const browserName = userAgent.split(') ')[1]?.split(' ')[0] || 'Unknown';

  return {
    currentUserId: token?.userId,
    organizationId: token?.organizationId,
    isAdmin: token?.roles?.includes(RoleEnum.ADMIN),
    isOrgAdmin: token?.roles?.includes(OrganizationRoleEnum.ORG_MEMBER),
    isInOrg: token?.roles?.some((r) =>
      [OrganizationRoleEnum.ORG_ADMIN, OrganizationRoleEnum.ORG_MEMBER].includes(r as OrganizationRoleEnum),
    ),
    acceptedLanguage: acceptedLanguage(initialContext.request),
    request: {
      operatingSystem,
      browserName,
    },
    isRefreshToken: token?.type === 'refresh',
  };
};
