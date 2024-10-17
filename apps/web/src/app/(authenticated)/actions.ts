'use server';

import {
  type SendFeedbackMutation,
  type SendFeedbackMutationVariables,
  type AdAccountsQuery,
  type MeQuery,
  type RefreshTokenQuery,
  type SearchQueryStringsQuery,
  type MutationUpsertSearchQueryStringArgs,
  type UpsertSearchQueryStringMutation,
  type MutationDeleteSearchQueryStringArgs,
  type DeleteSearchQueryStringMutation,
} from '@/graphql/generated/schema-server';
import { urqlClientSdk, urqlClientSdkRefresh } from '@/lib/urql/urql-client';
import { handleUrqlRequest, type UrqlResult } from '@/util/handle-urql-request';

export const getUserDetails = async (): Promise<MeQuery['me']> => (await urqlClientSdk().me()).me;

export default async function getAccounts(): Promise<AdAccountsQuery> {
  return await urqlClientSdk().adAccounts();
}

export const refreshJWTToken = async (): Promise<RefreshTokenQuery> => await urqlClientSdkRefresh().refreshToken();

export const sendFeedback = async (
  values: SendFeedbackMutationVariables,
): Promise<UrqlResult<SendFeedbackMutation, string>> => await handleUrqlRequest(urqlClientSdk().sendFeedback(values));

export const getSearchQueryStrings = async (): Promise<UrqlResult<SearchQueryStringsQuery>> => {
  return await handleUrqlRequest(urqlClientSdk().searchQueryStrings());
};

export const upsertSearchQueryString = async (
  values: MutationUpsertSearchQueryStringArgs,
): Promise<UrqlResult<UpsertSearchQueryStringMutation, string>> =>
  await handleUrqlRequest(urqlClientSdk().upsertSearchQueryString(values));

export const deleteSearchQueryString = async (
  values: MutationDeleteSearchQueryStringArgs,
): Promise<UrqlResult<DeleteSearchQueryStringMutation, string>> =>
  await handleUrqlRequest(urqlClientSdk().deleteSearchQueryString(values));
