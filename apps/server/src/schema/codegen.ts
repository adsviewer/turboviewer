import { printSchema } from 'graphql';
import type { CodegenConfig } from '@graphql-codegen/cli';
import { generate } from '@graphql-codegen/cli';
import { schema } from '.';

const config: CodegenConfig = {
  schema: printSchema(schema),
  emitLegacyCommonJSImports: false,
  generates: {
    './src/schema/generated/schema.graphql': {
      plugins: ['schema-ast'],
    },
    '../web/src/graphql/generated/schema-server.ts': {
      plugins: ['typescript', 'typescript-operations', 'typescript-generic-sdk'],
      config: {
        withHooks: true,
        namingConvention: {
          enumValues: 'keep',
        },
      },
      documents: ['../web/src/graphql/*.graphql'],
    },
    '../web/src/graphql/generated/schema-client.ts': {
      plugins: ['typescript', 'typescript-operations', 'typescript-urql'],
      config: {
        withHooks: true,
        urqlImportFrom: '@urql/next',
        namingConvention: {
          enumValues: 'keep',
        },
      },
      documents: ['../web/src/graphql/*.graphql'],
    },
    '../web2/src/graphql/generated/schema-server.ts': {
      plugins: ['typescript', 'typescript-operations', 'typescript-generic-sdk'],
      config: {
        withHooks: true,
        namingConvention: {
          enumValues: 'keep',
        },
      },
      documents: ['../web/src/graphql/*.graphql'],
    },
    '../web2/src/graphql/generated/schema-client.ts': {
      plugins: ['typescript', 'typescript-operations', 'typescript-urql'],
      config: {
        withHooks: true,
        urqlImportFrom: '@urql/next',
        namingConvention: {
          enumValues: 'keep',
        },
      },
      documents: ['../web/src/graphql/*.graphql'],
    },
  },
  config: {
    scalars: {
      Date: 'Date',
      UUID: 'string',
    },
  },
  hooks: { afterAllFileWrite: ['prettier --write'] },
};

await generate(config);

process.exit(0);
