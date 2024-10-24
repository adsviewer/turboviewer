import jwt, { type JsonWebTokenError, type NotBeforeError, type TokenExpiredError } from 'jsonwebtoken';
import { prisma, type RoleEnum } from '@repo/database';
import { AError } from '@repo/utils';
import { type AJwtPayload } from '@repo/shared-types';
import { Environment, MODE } from '@repo/mode';
import { env } from './config';
import { type UserWithRoles, userWithRoles } from './contexts/user/user-roles';

// eslint-disable-next-line import/no-named-as-default-member -- This is a false positive
const { sign, verify } = jwt;

const expiresIn = MODE === Environment.Local ? '365d' : '5m';

export interface TokensType {
  token: string;
  refreshToken: string;
}

export const createJwtsFromUserId = async (userId: string): Promise<TokensType & { user: UserWithRoles }> => {
  const user = await prisma.user.findUniqueOrThrow({ ...userWithRoles, where: { id: userId } });
  return { ...(await createJwts(user)), user };
};

export const createJwtsFromEmail = async (email: string): Promise<TokensType> => {
  const user = await prisma.user.findUniqueOrThrow({ ...userWithRoles, where: { email } });
  return createJwts(user);
};

export const createJwts = async ({
  currentOrganizationId: organizationId,
  roles: userRoles,
  id: userId,
  status,
  milestones,
}: UserWithRoles): Promise<TokensType> => {
  const roles = userRoles.map((r) => r.role);
  if (organizationId) {
    const { role } = await prisma.userOrganization.findUniqueOrThrow({
      select: { role: true },
      where: { userId_organizationId: { userId, organizationId } },
    });
    roles.push(role as RoleEnum);
  }
  return {
    token: sign(
      { userId, organizationId, roles, userStatus: status, milestones } satisfies AJwtPayload,
      env.AUTH_SECRET,
      {
        expiresIn,
      },
    ),
    refreshToken: sign(
      { userId, organizationId, userStatus: status, milestones, type: 'refresh' } satisfies AJwtPayload,
      env.REFRESH_SECRET,
      { expiresIn: '183d' },
    ),
  };
};

export const decodeJwt = (request: Request): AError | AJwtPayload | null => {
  const decode = safeDecode(request, env.AUTH_SECRET);
  if (!decode) return null;
  if (isGenericJsonWebTokenError(decode) && isJsonWebTokenError(decode)) {
    // Assume that this is a refresh token
    const refreshDecode = safeDecode(request, env.REFRESH_SECRET);
    if (!refreshDecode) return null;
    if (refreshDecode instanceof Error) {
      return new AError(refreshDecode.message);
    }
    return refreshDecode;
  }
  if (decode instanceof Error) {
    return new AError(decode.message);
  }
  return decode;
};

const safeDecode = (
  request: Request,
  secret: string,
): AJwtPayload | JsonWebTokenError | TokenExpiredError | NotBeforeError | Error | null | undefined => {
  const header = request.headers.get('authorization');

  if (header === null) return null;

  const token = header.split(' ')[1];
  try {
    return verify(token, secret) as AJwtPayload;
  } catch (e) {
    if (isGenericJsonWebTokenError(e)) {
      if (isTokenExpiredError(e)) return e;
      if (isNotBeforeError(e)) return e;
      if (isJsonWebTokenError(e)) return e;
    } else if (e instanceof Error) {
      return e;
    } else {
      return new Error(JSON.stringify(e));
    }
  }
};

interface GenericJsonWebTokenError extends Error {
  name: string;
}

export const isGenericJsonWebTokenError = (x: unknown): x is GenericJsonWebTokenError =>
  Boolean(x && typeof x === 'object' && 'name' in x);

const isJsonWebTokenError = (x: GenericJsonWebTokenError): x is JsonWebTokenError => x.name === 'JsonWebTokenError';

export const isTokenExpiredError = (x: GenericJsonWebTokenError): x is TokenExpiredError =>
  x.name === 'TokenExpiredError' && 'expiredAt' in x && x.expiredAt instanceof Date;

const isNotBeforeError = (x: GenericJsonWebTokenError): x is NotBeforeError =>
  x.name === 'NotBeforeError' && 'date' in x && x.date instanceof Date;
