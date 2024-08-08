import { type AError } from '@repo/utils';
import { type EmailType, LoginProviderEnum, type OrganizationRoleEnum } from '@repo/database';

export const authLoginEndpoint = '/auth/login/callback';

export const isLoginProviderEnum = (value: unknown): value is LoginProviderEnum =>
  Object.values(LoginProviderEnum).includes(value as LoginProviderEnum);

export interface LoginProviderUserData extends Omit<LoginDataProvider, 'organizationId' | 'userId'> {
  email: string;
}

export interface LoginData {
  firstName: string;
  lastName: string;
  organizationId: string;
  userId: string;
}
export interface EmailRole {
  email: string;
  emailType: EmailType;
  role: OrganizationRoleEnum;
}

export interface LoginDataProvider extends LoginData {
  providerId: string;
  providerType: LoginProviderEnum;
  photoUrl?: string;
}

export interface LoginDataPassword extends LoginData {
  password: string;
}
export interface SignupDataPassword extends Omit<LoginDataPassword, 'userId'>, EmailRole {}
export interface SignupDataProvider extends Omit<LoginDataProvider, 'userId'>, EmailRole {}

export interface LoginProviderInterface {
  generateAuthUrl: (state: string) => string;
  exchangeCodeForUserDate: (code: string) => Promise<LoginProviderUserData | AError>;
}
