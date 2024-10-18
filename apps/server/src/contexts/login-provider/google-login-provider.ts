import { OAuth2Client } from 'google-auth-library';
import { logger } from '@repo/logger';
import { AError } from '@repo/utils';
import { decode, type JwtPayload } from 'jsonwebtoken';
import { LoginProviderEnum } from '@repo/database';
import { env } from '../../config';
import { authLoginEndpoint, type LoginProviderInterface, type LoginProviderUserData } from './login-provider-types';

interface GoogleJwtPayload extends JwtPayload {
  azp: string;
  email: string;
  email_verified: boolean;
  at_hash: string;
  name: string;
  picture: string;
  given_name: string | undefined;
  family_name: string | undefined;
}

const client = new OAuth2Client(
  env.GOOGLE_LOGIN_APPLICATION_ID,
  env.GOOGLE_LOGIN_APPLICATION_SECRET,
  `${env.API_ENDPOINT}${authLoginEndpoint}`,
);

export const googleLoginProvider: LoginProviderInterface = {
  generateAuthUrl: (state: string) =>
    client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'],
      state,
    }),
  exchangeCodeForUserDate: async (code: string): Promise<LoginProviderUserData | AError> => {
    try {
      const getTokenResponse = await client.getToken(code);
      if (!getTokenResponse.tokens.id_token) {
        return new AError('No id_token in response');
      }
      const decoded = decode(getTokenResponse.tokens.id_token) as GoogleJwtPayload | null;
      if (!decoded) {
        return new AError('Could not decode id_token');
      }
      return {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- We know it's there
        providerId: decoded.sub!,
        firstName: decoded.given_name ?? '',
        lastName: decoded.family_name ?? '',
        email: decoded.email,
        photoUrl: decoded.picture,
        providerType: LoginProviderEnum.GOOGLE,
      } satisfies LoginProviderUserData;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : JSON.stringify(e);
      logger.error(`Error retrieving user data: ${errorMessage}`);
      return e instanceof Error ? e : new AError(errorMessage);
    }
  },
};
