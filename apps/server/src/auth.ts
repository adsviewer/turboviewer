import { GraphQLError } from 'graphql';
import jwt, { type JsonWebTokenError, type JwtPayload } from 'jsonwebtoken';
import { $Enums } from '@repo/database';
import { logger } from '@repo/logger';
import { AUTH_SECRET } from './config';
import RoleEnum = $Enums.RoleEnum;

interface MJwtPayload extends JwtPayload {
  userId: string;
  roles: RoleEnum[];
  organizationId: string;
}

// eslint-disable-next-line import/no-named-as-default-member -- This is a false positive
const { sign, verify } = jwt;

export const createJwt = (userId: string, organizationId: string, roles: RoleEnum[]) =>
  sign({ userId, organizationId, roles }, AUTH_SECRET, { expiresIn: '30d' });

export const decodeJwt = (request: Request): MJwtPayload | null => {
  const header = request.headers.get('authorization');
  if (header !== null) {
    const token = header.split(' ')[1];
    try {
      return verify(token, AUTH_SECRET) as MJwtPayload;
    } catch (e) {
      logger.warn(`Error during JWT verification with header ${header}: ${JSON.stringify(e)}`);
      if (isJsonWebTokenError(e)) {
        throw new GraphQLError(`JsonWebTokenError: ${e.message}`);
      } else if (e instanceof Error) {
        throw new GraphQLError(e.message);
      } else {
        throw new GraphQLError(JSON.stringify(e));
      }
    }
  }

  return null;
};

const isJsonWebTokenError = (x: unknown): x is JsonWebTokenError =>
  Boolean(x) && x !== null && typeof x === 'object' && 'name' in x && x.name === 'JsonWebTokenError';
