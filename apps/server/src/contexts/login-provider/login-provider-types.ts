import { type AError } from '@repo/utils';
import { LoginProviderEnum } from '@repo/database';

export const authLoginEndpoint = '/auth/login/callback';

export const isLoginProviderEnum = (value: unknown): value is LoginProviderEnum =>
  Object.values(LoginProviderEnum).includes(value as LoginProviderEnum);

export interface LoginProviderUserData {
  firstName: string;
  lastName: string;
  email: string;
  providerId: string;
  providerType: LoginProviderEnum;
  photoUrl?: string;
}

export interface LoginProviderInterface {
  generateAuthUrl: (state: string) => string;
  exchangeCodeForUserDate: (code: string) => Promise<LoginProviderUserData | AError>;
}
