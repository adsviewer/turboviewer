import 'dotenv/config';
import { printSchema } from 'graphql';
import type { CodegenConfig } from '@graphql-codegen/cli';
import { schema } from '.';

const config: CodegenConfig = {
  watch: false,
  schema: printSchema(schema),
  emitLegacyCommonJSImports: false,
  generates: {
    './src/schema/generated/schema.graphql': {
      plugins: ['schema-ast'],
    },
    '../web/src/graphql/generated/schema-server.ts': {
      plugins: ['typescript', 'typescript-operations', 'typescript-generic-sdk'],
      config: {
        nonOptionalTypename: true,
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
        nonOptionalTypename: true,
        withHooks: true,
        urqlImportFrom: '@urql/next',
        namingConvention: {
          enumValues: 'keep',
        },
      },
      documents: ['../web/src/graphql/*.graphql'],
    },
    '../backoffice/src/graphql/generated/schema-server.ts': {
      plugins: ['typescript', 'typescript-operations', 'typescript-generic-sdk'],
      config: {
        nonOptionalTypename: true,
        withHooks: true,
        namingConvention: {
          enumValues: 'keep',
        },
      },
      documents: ['../backoffice/src/graphql/*.graphql'],
    },
    '../web-old/src/graphql/generated/schema-server.ts': {
      plugins: ['typescript', 'typescript-operations', 'typescript-generic-sdk'],
      config: {
        withHooks: true,
        namingConvention: {
          enumValues: 'keep',
        },
      },
      documents: ['../web-old/src/graphql/*.graphql'],
    },
    '../web-old/src/graphql/generated/schema-client.ts': {
      plugins: ['typescript', 'typescript-operations', 'typescript-urql'],
      config: {
        withHooks: true,
        urqlImportFrom: '@urql/next',
        namingConvention: {
          enumValues: 'keep',
        },
      },
      documents: ['../web-old/src/graphql/*.graphql'],
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

// eslint-disable-next-line import/no-default-export -- This is needed  as per documentation: https://the-guild.dev/graphql/codegen/docs/getting-started/esm-typescript-usage#codegen-configuration
export default config;
