import { DocumentNode } from 'graphql';
import gql from 'graphql-tag';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  Date: { input: Date; output: Date };
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: { input: any; output: any };
};

export type BaseError = Error & {
  __typename?: 'BaseError';
  message: Scalars['String']['output'];
};

export type ChannelInitialProgressPayload = {
  __typename?: 'ChannelInitialProgressPayload';
  channel: IntegrationType;
  progress: Scalars['Float']['output'];
};

export type Error = {
  message: Scalars['String']['output'];
};

export type FacebookError = Error & {
  __typename?: 'FacebookError';
  code: Scalars['Int']['output'];
  errorSubCode: Scalars['Int']['output'];
  fbTraceId: Scalars['String']['output'];
  message: Scalars['String']['output'];
};

export type GenerateGoogleAuthUrlResponse = {
  __typename?: 'GenerateGoogleAuthUrlResponse';
  url: Scalars['String']['output'];
};

export type Integration = {
  __typename?: 'Integration';
  accessToken: Scalars['String']['output'];
  accessTokenExpiresAt?: Maybe<Scalars['Date']['output']>;
  externalId?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  organization: Organization;
  organizationId: Scalars['String']['output'];
  refreshToken?: Maybe<Scalars['String']['output']>;
  refreshTokenExpiresAt?: Maybe<Scalars['Date']['output']>;
  type: IntegrationType;
};

export type IntegrationListItem = {
  __typename?: 'IntegrationListItem';
  authUrl?: Maybe<Scalars['String']['output']>;
  status: IntegrationStatus;
  type: IntegrationType;
};

export enum IntegrationStatus {
  ComingSoon = 'ComingSoon',
  NotConnected = 'NotConnected',
  Expired = 'Expired',
  Connected = 'Connected',
  Revoked = 'Revoked',
}

export enum IntegrationType {
  FACEBOOK = 'FACEBOOK',
  TIKTOK = 'TIKTOK',
  LINKEDIN = 'LINKEDIN',
}

export type Mutation = {
  __typename?: 'Mutation';
  deAuthIntegration: MutationDeAuthIntegrationResult;
  forgetPassword: Scalars['Boolean']['output'];
  googleLoginSignup: TokenDto;
  login: TokenDto;
  /** Uses the refresh token to generate a new token */
  refreshToken: Scalars['String']['output'];
  resetPassword: TokenDto;
  signup: TokenDto;
  updateUser: User;
};

export type MutationDeAuthIntegrationArgs = {
  type: IntegrationType;
};

export type MutationForgetPasswordArgs = {
  email: Scalars['String']['input'];
};

export type MutationGoogleLoginSignupArgs = {
  code: Scalars['String']['input'];
};

export type MutationLoginArgs = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type MutationResetPasswordArgs = {
  password?: InputMaybe<Scalars['String']['input']>;
  token: Scalars['String']['input'];
};

export type MutationSignupArgs = {
  email: Scalars['String']['input'];
  firstName: Scalars['String']['input'];
  lastName: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type MutationUpdateUserArgs = {
  firstName?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  newPassword?: InputMaybe<Scalars['String']['input']>;
  oldPassword?: InputMaybe<Scalars['String']['input']>;
};

export type MutationDeAuthIntegrationResult = BaseError | FacebookError | MutationDeAuthIntegrationSuccess;

export type MutationDeAuthIntegrationSuccess = {
  __typename?: 'MutationDeAuthIntegrationSuccess';
  data: Scalars['String']['output'];
};

export type Organization = {
  __typename?: 'Organization';
  createdAt: Scalars['Date']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  updatedAt: Scalars['Date']['output'];
  users: Array<User>;
};

export type PrismaClientKnownRequestError = Error & {
  __typename?: 'PrismaClientKnownRequestError';
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
};

export type Query = {
  __typename?: 'Query';
  generateGoogleAuthUrl: GenerateGoogleAuthUrlResponse;
  integrations: Array<IntegrationListItem>;
  me: User;
};

export type QueryGenerateGoogleAuthUrlArgs = {
  state: Scalars['String']['input'];
};

export type Role = {
  __typename?: 'Role';
  name: Scalars['String']['output'];
};

export type Subscription = {
  __typename?: 'Subscription';
  channelInitialSetupProgress: ChannelInitialProgressPayload;
};

export type TokenDto = {
  __typename?: 'TokenDto';
  refreshToken: Scalars['String']['output'];
  token: Scalars['String']['output'];
  user: User;
};

export type User = {
  __typename?: 'User';
  createdAt: Scalars['Date']['output'];
  email: Scalars['String']['output'];
  firstName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lastName: Scalars['String']['output'];
  organization: Organization;
  organizationId: Scalars['ID']['output'];
  roles: Array<Role>;
  updatedAt: Scalars['Date']['output'];
};

export type ZodError = Error & {
  __typename?: 'ZodError';
  fieldErrors: Array<ZodFieldError>;
  message: Scalars['String']['output'];
};

export type ZodFieldError = {
  __typename?: 'ZodFieldError';
  message: Scalars['String']['output'];
  path: Array<Scalars['String']['output']>;
};

export type IntegrationsQueryVariables = Exact<{ [key: string]: never }>;

export type IntegrationsQuery = {
  __typename?: 'Query';
  integrations: Array<{
    __typename?: 'IntegrationListItem';
    type: IntegrationType;
    status: IntegrationStatus;
    authUrl?: string | null;
  }>;
};

export type DeAuthIntegrationMutationVariables = Exact<{
  type: IntegrationType;
}>;

export type DeAuthIntegrationMutation = {
  __typename?: 'Mutation';
  deAuthIntegration:
    | { __typename?: 'BaseError'; message: string }
    | { __typename?: 'FacebookError'; message: string }
    | { __typename?: 'MutationDeAuthIntegrationSuccess'; data: string };
};

export type ChannelInitialSetupProgressSubscriptionVariables = Exact<{ [key: string]: never }>;

export type ChannelInitialSetupProgressSubscription = {
  __typename?: 'Subscription';
  channelInitialSetupProgress: {
    __typename?: 'ChannelInitialProgressPayload';
    progress: number;
    channel: IntegrationType;
  };
};

export type LoginMutationVariables = Exact<{
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
}>;

export type LoginMutation = {
  __typename?: 'Mutation';
  login: {
    __typename?: 'TokenDto';
    token: string;
    refreshToken: string;
    user: {
      __typename?: 'User';
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      organizationId: string;
      roles: Array<{ __typename?: 'Role'; name: string }>;
    };
  };
};

export type SignupMutationVariables = Exact<{
  email: Scalars['String']['input'];
  firstName: Scalars['String']['input'];
  lastName: Scalars['String']['input'];
  password: Scalars['String']['input'];
}>;

export type SignupMutation = {
  __typename?: 'Mutation';
  signup: {
    __typename?: 'TokenDto';
    token: string;
    refreshToken: string;
    user: {
      __typename?: 'User';
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      organizationId: string;
      roles: Array<{ __typename?: 'Role'; name: string }>;
    };
  };
};

export type ForgetPasswordMutationVariables = Exact<{
  email: Scalars['String']['input'];
}>;

export type ForgetPasswordMutation = { __typename?: 'Mutation'; forgetPassword: boolean };

export type ResetPasswordMutationVariables = Exact<{
  token: Scalars['String']['input'];
  password: Scalars['String']['input'];
}>;

export type ResetPasswordMutation = {
  __typename?: 'Mutation';
  resetPassword: {
    __typename?: 'TokenDto';
    token: string;
    refreshToken: string;
    user: {
      __typename?: 'User';
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      organizationId: string;
      roles: Array<{ __typename?: 'Role'; name: string }>;
    };
  };
};

export type RefreshTokenMutationVariables = Exact<{ [key: string]: never }>;

export type RefreshTokenMutation = { __typename?: 'Mutation'; refreshToken: string };

export type MeQueryVariables = Exact<{ [key: string]: never }>;

export type MeQuery = {
  __typename?: 'Query';
  me: { __typename?: 'User'; firstName: string; lastName: string; email: string };
};

export type UserFieldsFragment = {
  __typename?: 'User';
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  organizationId: string;
  roles: Array<{ __typename?: 'Role'; name: string }>;
};

export const UserFieldsFragmentDoc = gql`
  fragment UserFields on User {
    id
    firstName
    lastName
    email
    roles {
      name
    }
    organizationId
  }
`;
export const IntegrationsDocument = gql`
  query integrations {
    integrations {
      type
      status
      authUrl
    }
  }
`;
export const DeAuthIntegrationDocument = gql`
  mutation deAuthIntegration($type: IntegrationType!) {
    deAuthIntegration(type: $type) {
      ... on BaseError {
        message
      }
      ... on FacebookError {
        message
      }
      ... on MutationDeAuthIntegrationSuccess {
        data
      }
    }
  }
`;
export const ChannelInitialSetupProgressDocument = gql`
  subscription channelInitialSetupProgress {
    channelInitialSetupProgress {
      progress
      channel
    }
  }
`;
export const LoginDocument = gql`
  mutation login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      refreshToken
      user {
        ...UserFields
      }
    }
  }
  ${UserFieldsFragmentDoc}
`;
export const SignupDocument = gql`
  mutation signup($email: String!, $firstName: String!, $lastName: String!, $password: String!) {
    signup(email: $email, firstName: $firstName, lastName: $lastName, password: $password) {
      token
      refreshToken
      user {
        ...UserFields
      }
    }
  }
  ${UserFieldsFragmentDoc}
`;
export const ForgetPasswordDocument = gql`
  mutation forgetPassword($email: String!) {
    forgetPassword(email: $email)
  }
`;
export const ResetPasswordDocument = gql`
  mutation resetPassword($token: String!, $password: String!) {
    resetPassword(token: $token, password: $password) {
      token
      refreshToken
      user {
        ...UserFields
      }
    }
  }
  ${UserFieldsFragmentDoc}
`;
export const RefreshTokenDocument = gql`
  mutation refreshToken {
    refreshToken
  }
`;
export const MeDocument = gql`
  query me {
    me {
      firstName
      lastName
      email
    }
  }
`;
export type Requester<C = {}> = <R, V>(doc: DocumentNode, vars?: V, options?: C) => Promise<R> | AsyncIterable<R>;
export function getSdk<C>(requester: Requester<C>) {
  return {
    integrations(variables?: IntegrationsQueryVariables, options?: C): Promise<IntegrationsQuery> {
      return requester<IntegrationsQuery, IntegrationsQueryVariables>(
        IntegrationsDocument,
        variables,
        options,
      ) as Promise<IntegrationsQuery>;
    },
    deAuthIntegration(variables: DeAuthIntegrationMutationVariables, options?: C): Promise<DeAuthIntegrationMutation> {
      return requester<DeAuthIntegrationMutation, DeAuthIntegrationMutationVariables>(
        DeAuthIntegrationDocument,
        variables,
        options,
      ) as Promise<DeAuthIntegrationMutation>;
    },
    channelInitialSetupProgress(
      variables?: ChannelInitialSetupProgressSubscriptionVariables,
      options?: C,
    ): AsyncIterable<ChannelInitialSetupProgressSubscription> {
      return requester<ChannelInitialSetupProgressSubscription, ChannelInitialSetupProgressSubscriptionVariables>(
        ChannelInitialSetupProgressDocument,
        variables,
        options,
      ) as AsyncIterable<ChannelInitialSetupProgressSubscription>;
    },
    login(variables: LoginMutationVariables, options?: C): Promise<LoginMutation> {
      return requester<LoginMutation, LoginMutationVariables>(
        LoginDocument,
        variables,
        options,
      ) as Promise<LoginMutation>;
    },
    signup(variables: SignupMutationVariables, options?: C): Promise<SignupMutation> {
      return requester<SignupMutation, SignupMutationVariables>(
        SignupDocument,
        variables,
        options,
      ) as Promise<SignupMutation>;
    },
    forgetPassword(variables: ForgetPasswordMutationVariables, options?: C): Promise<ForgetPasswordMutation> {
      return requester<ForgetPasswordMutation, ForgetPasswordMutationVariables>(
        ForgetPasswordDocument,
        variables,
        options,
      ) as Promise<ForgetPasswordMutation>;
    },
    resetPassword(variables: ResetPasswordMutationVariables, options?: C): Promise<ResetPasswordMutation> {
      return requester<ResetPasswordMutation, ResetPasswordMutationVariables>(
        ResetPasswordDocument,
        variables,
        options,
      ) as Promise<ResetPasswordMutation>;
    },
    refreshToken(variables?: RefreshTokenMutationVariables, options?: C): Promise<RefreshTokenMutation> {
      return requester<RefreshTokenMutation, RefreshTokenMutationVariables>(
        RefreshTokenDocument,
        variables,
        options,
      ) as Promise<RefreshTokenMutation>;
    },
    me(variables?: MeQueryVariables, options?: C): Promise<MeQuery> {
      return requester<MeQuery, MeQueryVariables>(MeDocument, variables, options) as Promise<MeQuery>;
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
