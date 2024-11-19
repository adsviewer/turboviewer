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
  type MutationDeleteSearchQueryStringArgs,
  type DeleteSearchQueryStringMutation,
  type CommentsQuery,
  type CommentsQueryVariables,
  type MutationUpsertCommentArgs,
  type UpsertCommentMutation,
  type MutationDeleteCommentArgs,
  type DeleteCommentMutation,
} from '@/graphql/generated/schema-server';
import { urqlClientSdk, urqlClientSdkRefresh } from '@/lib/urql/urql-client';
import { handleUrqlRequest, type UrqlResult } from '@/util/handle-urql-request';
import { changeJWT } from '../(unauthenticated)/actions';

export const getUserDetails = async (): Promise<MeQuery['me']> => (await (await urqlClientSdk()).me()).me;

export default async function getAccounts(): Promise<AdAccountsQuery> {
  return await (await urqlClientSdk()).adAccounts();
}

export const refreshJWTToken = async (): Promise<RefreshTokenQuery> =>
  await (await urqlClientSdkRefresh()).refreshToken();

export const sendFeedback = async (
  values: SendFeedbackMutationVariables,
): Promise<UrqlResult<SendFeedbackMutation, string>> =>
  await handleUrqlRequest((await urqlClientSdk()).sendFeedback(values));

export const removeUserMilestoneAndGetJWT = async (
  values: RemoveUserMilestoneMutationVariables,
): Promise<UrqlResult> => {
  try {
    const res = await handleUrqlRequest((await urqlClientSdk()).removeUserMilestone(values));
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

// Search
export const getSearchQueryStrings = async (): Promise<UrqlResult<SearchQueryStringsQuery>> => {
  return await handleUrqlRequest((await urqlClientSdk()).searchQueryStrings());
};

export const upsertSearchQueryString = async (
  values: MutationUpsertSearchQueryStringArgs,
): Promise<UrqlResult<UpsertSearchQueryStringMutation, string>> =>
  await handleUrqlRequest((await urqlClientSdk()).upsertSearchQueryString(values));

export const deleteSearchQueryString = async (
  values: MutationDeleteSearchQueryStringArgs,
): Promise<UrqlResult<DeleteSearchQueryStringMutation, string>> =>
  await handleUrqlRequest((await urqlClientSdk()).deleteSearchQueryString(values));

// Comments
export const getComments = async (values: CommentsQueryVariables): Promise<UrqlResult<CommentsQuery>> => {
  return await handleUrqlRequest((await urqlClientSdk()).comments(values));
};

export const upsertComment = async (
  values: MutationUpsertCommentArgs,
): Promise<UrqlResult<UpsertCommentMutation, string>> =>
  await handleUrqlRequest((await urqlClientSdk()).upsertComment(values));

export const deleteComment = async (
  values: MutationDeleteCommentArgs,
): Promise<UrqlResult<DeleteCommentMutation, string>> =>
  await handleUrqlRequest((await urqlClientSdk()).deleteComment(values));
