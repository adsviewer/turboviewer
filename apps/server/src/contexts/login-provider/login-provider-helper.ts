import { randomUUID } from 'node:crypto';
import { AError, FireAndForget, isAError, isMode, MODE, REFRESH_TOKEN_KEY, TOKEN_KEY } from '@repo/utils';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { logger } from '@repo/logger';
import type QueryString from 'qs';
import { LoginProviderEnum, prisma, UserOrganizationStatus, UserStatus } from '@repo/database';
import { redisDel, redisExists, redisGet, redisSet } from '@repo/redis';
import { env } from '../../config';
import { createJwts } from '../../auth';
import {
  type ConfirmInvitedUser,
  confirmInvitedUserPrefix,
  confirmInvitedUserRedisKey,
  createLoginProviderUser,
} from '../user/user';
import { userWithRoles } from '../user/user-roles';
import { handleInvite, invitationLinkTokenPrefix, redisGetInvitationLink } from '../user/user-invite';
import { googleLoginProvider } from './google-login-provider';
import { isLoginProviderEnum, type LoginProviderInterface } from './login-provider-types';

const fireAndForget = new FireAndForget();

export const getLoginProvider = (provider: LoginProviderEnum): LoginProviderInterface => {
  switch (provider) {
    case LoginProviderEnum.GOOGLE:
      return googleLoginProvider;
    default:
      throw new AError('Login provider not found');
  }
};

export const generateAuthUrl = (providerType: LoginProviderEnum, token: string | undefined | null): string => {
  const provider = getLoginProvider(providerType);
  const state = `${MODE}_${providerType}_${randomUUID()}_${token ?? ''}`;
  fireAndForget.add(() => saveState(state));
  return provider.generateAuthUrl(state);
};

export const authLoginCallback = (req: ExpressRequest, res: ExpressResponse): void => {
  const {
    code,
    state: stateArg,
    error_description: errorDescription,
    error: providerError,
    prompt: _prompt,
    scope: _scope,
    authuser: _authUser,
  } = req.query;

  const error = providerError ?? errorDescription;

  completeSocialLogin(code, stateArg, error)
    .then((loginProviderResult) => {
      if (isAError(loginProviderResult)) {
        logger.error('Failed to complete social login %s:', loginProviderResult.message);
        res.redirect(`${env.PUBLIC_URL}/sign-in?error=${loginProviderResult.message}`);
      } else {
        res.redirect(
          `${env.PUBLIC_URL}?${TOKEN_KEY}=${loginProviderResult.token}&${REFRESH_TOKEN_KEY}=${loginProviderResult.refreshToken}`,
        );
      }
    })
    .catch((e: unknown) => {
      logger.error(e, 'Failed to complete social login');
      res.redirect(`${env.PUBLIC_URL}/sign-in?error=unknown_error`);
    });
};

const handleInvitedUserCase = async (
  token: string,
  email: string,
  providerId: string,
  providerType: LoginProviderEnum,
): Promise<AError | { provider: LoginProviderEnum; token: string; refreshToken: string }> => {
  const key = confirmInvitedUserRedisKey(token);
  const redisVal = await redisGet<ConfirmInvitedUser>(key);
  if (!redisVal) {
    return new AError('User invitation expired');
  }
  const { userId, organizationId } = redisVal;
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    return new AError('User not found');
  }
  if (email !== user.email) {
    return new AError('User email does not match invitation email');
  }

  const [updatedUser] = await Promise.all([
    prisma.user.update({
      ...userWithRoles,
      where: { id: user.id },
      data: {
        status: UserStatus.EMAIL_CONFIRMED,
        loginProviders: {
          create: {
            externalId: providerId,
            provider: providerType,
          },
        },
      },
    }),
    prisma.userOrganization.update({
      where: { userId_organizationId: { userId: user.id, organizationId } },
      data: { status: UserOrganizationStatus.ACTIVE },
    }),
    redisDel(confirmInvitedUserRedisKey(token)),
  ]);

  const { token: jwtToken, refreshToken } = await createJwts(updatedUser);
  return {
    token: jwtToken,
    refreshToken,
    provider: providerType,
  };
};

const completeSocialLogin = async (
  code: string | string[] | QueryString.ParsedQs | QueryString.ParsedQs[] | undefined,
  stateArg: string | string[] | QueryString.ParsedQs | QueryString.ParsedQs[] | undefined,
  errorDescription: string | string[] | QueryString.ParsedQs | QueryString.ParsedQs[] | undefined,
): Promise<AError | { provider: LoginProviderEnum; token: string; refreshToken: string }> => {
  if (typeof errorDescription === 'string') {
    return new AError(errorDescription);
  }

  if (typeof code !== 'string' || typeof stateArg !== 'string') {
    return new AError('invalid_code');
  }

  const [mode, providerType, state, inviteToken] = stateArg.split('_');

  // mode should only be uuid
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(state)) {
    return new AError('invalid_state');
  }

  if (!isMode(mode)) {
    return new AError('invalid_mode');
  }

  if (!isLoginProviderEnum(providerType)) {
    return new AError('invalid_provider');
  }

  const redisResp = await loginStateExists(stateArg);
  if (!redisResp) {
    return new AError('nonexistent_state');
  }

  const provider = getLoginProvider(providerType);
  const userdata = await provider.exchangeCodeForUserDate(code);
  if (isAError(userdata)) return userdata;

  if (inviteToken !== '' && inviteToken.startsWith(confirmInvitedUserPrefix))
    return await handleInvitedUserCase(inviteToken, userdata.email, userdata.providerId, providerType);

  const { organizationId, role } = await (async () => {
    if (inviteToken !== '' && inviteToken.startsWith(invitationLinkTokenPrefix)) {
      const redisVal = await redisGetInvitationLink(inviteToken);
      return redisVal ?? { organizationId: undefined, role: undefined };
    }
    return { organizationId: undefined, role: undefined };
  })();

  const providerUser = await prisma.loginProviderUser
    .findUnique({
      include: {
        user: { ...userWithRoles },
      },
      where: {
        externalId_provider: {
          externalId: userdata.providerId,
          provider: providerType,
        },
      },
    })
    .then((u) => u?.user);

  if (providerUser) {
    if (organizationId) {
      const jwts = await handleInvite(providerUser.id, organizationId, role);
      if (!isAError(jwts)) return { ...jwts, provider: providerType };
    }
    const { token, refreshToken } = await createJwts(providerUser);
    return { token, refreshToken, provider: providerType };
  }

  const emailUser = await prisma.user.findUnique({
    ...userWithRoles,
    where: { email: userdata.email },
  });

  if (emailUser) {
    if (organizationId) {
      const jwts = await handleInvite(emailUser.id, organizationId, role);
      if (!isAError(jwts)) return { ...jwts, provider: providerType };
    }
    const { token, refreshToken } = await createJwts(emailUser);
    return { token, refreshToken, provider: providerType };
  }

  const user = await createLoginProviderUser(userdata, inviteToken);
  if (isAError(user)) return user;

  const { token, refreshToken } = await createJwts(user);
  return {
    provider: providerType,
    token,
    refreshToken,
  };
};

const loginStateKey = (state: string): string => `login-state:${state}`;
export const saveState = async (state: string): Promise<void> => {
  await redisSet(loginStateKey(state), 1, 12 * 60 * 60);
};
const loginStateExists = async (state: string): Promise<boolean> => {
  return await redisExists(loginStateKey(state));
};
