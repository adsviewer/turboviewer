'use server';

import {
  type SendFeedbackMutation,
  type SendFeedbackMutationVariables,
  type AdAccountsQuery,
  type MeQuery,
  type RefreshTokenQuery,
} from '@/graphql/generated/schema-server';
import { urqlClientSdk, urqlClientSdkRefresh } from '@/lib/urql/urql-client';
import { handleUrqlRequest, type UrqlResult } from '@/util/handle-urql-request';

export async function getUserDetails(): Promise<MeQuery['me']> {
  return (await urqlClientSdk().me()).me;
}

export default async function getAccounts(): Promise<AdAccountsQuery> {
  return await urqlClientSdk().adAccounts();
}

export async function refreshJWTToken(): Promise<RefreshTokenQuery> {
  return await urqlClientSdkRefresh().refreshToken();
}

export async function sendFeedback(
  values: SendFeedbackMutationVariables,
): Promise<UrqlResult<SendFeedbackMutation, string>> {
  return await handleUrqlRequest(urqlClientSdk().sendFeedback(values));
}
