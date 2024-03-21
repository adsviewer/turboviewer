import { GraphQLError } from 'graphql';
import { queryFromInfo } from '@pothos/plugin-prisma';
import { isMError } from '@repo/utils';
import { generateAuthUrl, googleLogin } from '../../google';
import { builder } from '../builder';
import { GenerateGoogleAuthUrlResponseDto, TokenUserDto } from './user-types';

builder.queryFields((t) => ({
  generateGoogleAuthUrl: t.field({
    args: {
      state: t.arg.string({ required: true }),
    },
    type: GenerateGoogleAuthUrlResponseDto,
    resolve: (_root, args, _ctx, _info) => ({
      url: generateAuthUrl(args.state),
    }),
  }),
}));

builder.mutationFields((t) => ({
  googleLoginSignup: t.field({
    args: {
      code: t.arg.string({ required: true }),
    },
    type: TokenUserDto,
    resolve: async (_root, args, ctx, info) => {
      const query = queryFromInfo({
        context: ctx,
        info,
        path: ['user'],
      });
      const googleUserToken = await googleLogin(args.code, query);
      if (isMError(googleUserToken)) {
        throw new GraphQLError(googleUserToken.message);
      }
      return googleUserToken;
    },
  }),
}));
