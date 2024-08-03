import { ZodError } from 'zod';
import { Prisma } from '@repo/database';
import { AError } from '@repo/utils';
import { flattenErrors } from '../utils/error-utils';
import { builder } from './builder';

export const ErrorInterface = builder.interfaceRef<AError>('Error').implement({
  fields: (t) => ({
    message: t.exposeString('message', { nullable: false }),
  }),
});

builder.objectType(AError, {
  name: 'BaseError',
  interfaces: [ErrorInterface],
});

builder.objectType(Prisma.PrismaClientKnownRequestError, {
  name: 'PrismaClientKnownRequestError',
  interfaces: [ErrorInterface],
  fields: (t) => ({
    code: t.exposeString('code', { nullable: false }),
  }),
});

// A type for the individual validation issues
const ZodFieldError = builder
  .objectRef<{
    message: string;
    path: string[];
  }>('ZodFieldError')
  .implement({
    fields: (t) => ({
      message: t.exposeString('message', { nullable: false }),
      path: t.exposeStringList('path', { nullable: false }),
    }),
  });

// The actual error type
builder.objectType(ZodError, {
  name: 'ZodError',
  interfaces: [ErrorInterface],
  fields: (t) => ({
    fieldErrors: t.field({
      nullable: false,
      type: [ZodFieldError],
      resolve: (err) => flattenErrors(err.format(), []),
    }),
  }),
});
