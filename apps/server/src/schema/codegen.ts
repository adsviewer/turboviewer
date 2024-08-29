import 'dotenv/config';
import { printSchema } from 'graphql';
import type { CodegenConfig } from '@graphql-codegen/cli';
import { schema } from '.';

const serverConfig = {
  nonOptionalTypename: true,
  withHooks: true,
  namingConvention: {
    enumValues: 'keep',
  },
};

const clientConfig = {
  ...serverConfig,
  urqlImportFrom: '@urql/next',
};

const commonPlugins = ['typescript', 'typescript-operations'];
const serverPlugins = [...commonPlugins, 'typescript-generic-sdk'];
const clientPlugins = [...commonPlugins, 'typescript-urql'];

const config: CodegenConfig = {
  watch: false,
  schema: printSchema(schema),
  emitLegacyCommonJSImports: false,
  generates: {
    './src/schema/generated/schema.graphql': {
      plugins: ['schema-ast'],
    },
    '../web/src/graphql/generated/schema-server.ts': {
      plugins: serverPlugins,
      config: serverConfig,
      documents: ['../web/src/graphql/*.graphql'],
    },
    '../web/src/graphql/generated/schema-client.ts': {
      plugins: clientPlugins,
      config: clientConfig,
      documents: ['../web/src/graphql/*.graphql'],
    },
    '../backoffice/src/graphql/generated/schema-server.ts': {
      plugins: serverPlugins,
      config: serverConfig,
      documents: ['../backoffice/src/graphql/*.graphql'],
    },
  },
  config: {
    scalars: {
      Date: 'Date',
      BigInt: 'bigint',
      UUID: 'string',
    },
  },
  hooks: { afterAllFileWrite: ['prettier --write'] },
};

// eslint-disable-next-line import/no-default-export -- This is needed  as per documentation: https://the-guild.dev/graphql/codegen/docs/getting-started/esm-typescript-usage#codegen-configuration
export default config;
