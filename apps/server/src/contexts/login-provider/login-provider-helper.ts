import { randomUUID } from 'node:crypto';
import { AError, FireAndForget, isAError, isMode, MODE, REFRESH_TOKEN_KEY, TOKEN_KEY } from '@repo/utils';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { logger } from '@repo/logger';
import type QueryString from 'qs';
import { LoginProviderEnum, prisma } from '@repo/database';
import { redisExists, redisSet } from '@repo/redis';
import { env } from '../../config';
import { createJwts } from '../../auth';
import { createLoginProviderUser } from '../user';
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

export const generateAuthUrl = (providerType: LoginProviderEnum): string => {
  const provider = getLoginProvider(providerType);
  const state = `${MODE}_${providerType}_${randomUUID()}`;
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

  const [mode, providerType, state] = stateArg.split('_');

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
  if (isAError(userdata)) {
    return userdata;
  }

  const providerUser = await prisma.loginProviderUser
    .findUnique({
      include: {
        user: { include: { roles: { select: { role: true } } } },
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
    const { token, refreshToken } = createJwts(
      providerUser.id,
      providerUser.organizationId,
      providerUser.roles.map((r) => r.role),
    );
    return {
      token,
      refreshToken,
      provider: providerType,
    };
  }

  const emailUser = await prisma.user.findUnique({
    include: { roles: { select: { role: true } } },
    where: { email: userdata.email },
  });

  if (emailUser) {
    const { token, refreshToken } = createJwts(
      emailUser.id,
      emailUser.organizationId,
      emailUser.roles.map((r) => r.role),
    );
    return {
      token,
      refreshToken,
      provider: providerType,
    };
  }

  const user = await createLoginProviderUser(userdata);

  const { token, refreshToken } = createJwts(
    user.id,
    user.organizationId,
    user.roles.map((r) => r.role),
  );
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
