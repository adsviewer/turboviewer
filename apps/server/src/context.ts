import { type YogaInitialContext } from 'graphql-yoga';
import { $Enums, OrganizationRoleEnum, UserStatus } from '@repo/database';
import { isAError } from '@repo/utils';
import { GraphQLError } from 'graphql/index';
import { setContext, setUser } from '@sentry/node';
import { decodeJwt } from './auth';
import { acceptedLanguage, type Language } from './language';
import RoleEnum = $Enums.RoleEnum;

export interface GraphQLContext {
  currentUserId: undefined | string;
  organizationId: undefined | string | null;
  acceptedLanguage: Language;
  isAdmin: boolean | undefined;
  isOrgAdmin: boolean | undefined;
  isOrgOperator: boolean | undefined;
  isInOrg: boolean | undefined;
  isRefreshToken: boolean | undefined;
  request: {
    operatingSystem: string;
    browserName: string;
  };
  emailUnconfirmed: boolean | undefined;
}

export const createContext = (initialContext: YogaInitialContext): GraphQLContext => {
  const token = decodeJwt(initialContext.request);
  if (isAError(token)) {
    throw new GraphQLError(token.message);
  }
  setUser({ id: token?.userId });
  setContext('user', { organizationId: token?.organizationId });

  const userAgent = initialContext.request.headers.get('user-agent') ?? '';
  const operatingSystem = userAgent.split('(')[1]?.split(')')[0] || 'Unknown';
  const browserName = userAgent.split(') ')[1]?.split(' ')[0] || 'Unknown';

  return {
    currentUserId: token?.userId,
    organizationId: token?.organizationId,
    isAdmin: token?.roles?.includes(RoleEnum.ADMIN),
    isOrgAdmin: token?.roles?.includes(OrganizationRoleEnum.ORG_ADMIN),
    isOrgOperator: token?.roles?.includes(OrganizationRoleEnum.ORG_OPERATOR),
    isInOrg: token?.roles?.some((r) =>
      [OrganizationRoleEnum.ORG_ADMIN, OrganizationRoleEnum.ORG_MEMBER, OrganizationRoleEnum.ORG_OPERATOR].includes(
        r as OrganizationRoleEnum,
      ),
    ),
    acceptedLanguage: acceptedLanguage(initialContext.request),
    request: {
      operatingSystem,
      browserName,
    },
    isRefreshToken: token?.type === 'refresh',
    emailUnconfirmed: token?.userStatus === UserStatus.EMAIL_UNCONFIRMED,
  };
};
