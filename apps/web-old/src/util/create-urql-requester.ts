/* eslint @typescript-eslint/unbound-method: 0 -- This is a function */
// copy of https://www.npmjs.com/package/urql-generic-requester, his npm package is packed wrong, import does not work?
import { type DocumentNode, Kind, OperationTypeNode } from 'graphql';
import { type Client, type OperationContext } from '@urql/core';

export const createUrqlRequester = <Context extends Partial<OperationContext>>(client: Client) => {
  return async <Result, Variables>(
    document: DocumentNode,
    parameters?: Variables,
    context?: Context,
  ): Promise<Result> => {
    let op = client.query;

    for (const def of document.definitions) {
      if (def.kind === Kind.OPERATION_DEFINITION && def.operation === OperationTypeNode.MUTATION) op = client.mutation;
      if (def.kind === Kind.OPERATION_DEFINITION && def.operation === OperationTypeNode.SUBSCRIPTION)
        op = client.subscription;
    }

    return op(document, parameters as Record<string, unknown>, context)
      .toPromise()
      .then((data) => {
        if (data.error) return Promise.reject(data.error);

        return data.data as Result;
      });
  };
};
