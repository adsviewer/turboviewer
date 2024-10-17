'use server';

import {
  type SendFeedbackMutation,
  type SendFeedbackMutationVariables,
  type AdAccountsQuery,
  type MeQuery,
  type RefreshTokenQuery,
  type RemoveUserMilestoneMutationVariables,
  type SearchQueryStringsQuery,
  type MutationUpsertSearchQueryStringArgs,
  type UpsertSearchQueryStringMutation,
} from '@/graphql/generated/schema-server';
import { urqlClientSdk, urqlClientSdkRefresh } from '@/lib/urql/urql-client';
import { handleUrqlRequest, type UrqlResult } from '@/util/handle-urql-request';
import { changeJWT } from '../(unauthenticated)/actions';

export const getUserDetails = async (): Promise<MeQuery['me']> => (await urqlClientSdk().me()).me;

export default async function getAccounts(): Promise<AdAccountsQuery> {
  return await urqlClientSdk().adAccounts();
}

export const refreshJWTToken = async (): Promise<RefreshTokenQuery> => await urqlClientSdkRefresh().refreshToken();

export const sendFeedback = async (
  values: SendFeedbackMutationVariables,
): Promise<UrqlResult<SendFeedbackMutation, string>> => await handleUrqlRequest(urqlClientSdk().sendFeedback(values));

export const removeUserMilestoneAndGetJWT = async (
  values: RemoveUserMilestoneMutationVariables,
): Promise<UrqlResult> => {
  try {
    const res = await handleUrqlRequest(urqlClientSdk().removeUserMilestone(values));
    if (!res.success) {
      return {
        success: false,
        error: res.error,
      };
    }
    await changeJWT(res.data.removeUserMilestone.token, res.data.removeUserMilestone.refreshToken);
    return {
      success: true,
      data: null,
    };
  } catch (error) {
    return {
      success: false,
      error,
    };
  }
};

export const getSearchQueryStrings = async (): Promise<UrqlResult<SearchQueryStringsQuery>> => {
  return await handleUrqlRequest(urqlClientSdk().searchQueryStrings());
};

export const upsertSearchQueryString = async (
  values: MutationUpsertSearchQueryStringArgs,
): Promise<UrqlResult<UpsertSearchQueryStringMutation, string>> =>
  await handleUrqlRequest(urqlClientSdk().upsertSearchQueryString(values));
