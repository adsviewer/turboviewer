import { handleUrqlRequest, type UrqlErrorResult, type UrqlSuccessResult } from '@/util/handle-urql-request';
import { urqlClientSdk } from '@/lib/urql/urql-client';
import { type MeQuery } from '@/graphql/generated/schema-server';

export const getUser = async (): Promise<UrqlSuccessResult<MeQuery> | UrqlErrorResult<string>> =>
  await handleUrqlRequest(urqlClientSdk().me());
