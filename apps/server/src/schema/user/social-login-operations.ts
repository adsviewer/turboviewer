import { LoginProviderEnum } from '@repo/database';
import { camelCase } from 'change-case';
import { builder } from '../builder';
import { generateAuthUrl } from '../../contexts/login-provider/login-provider-helper';
import { GenerateGoogleAuthUrlResponseDto } from './user-types';

builder.queryFields((t) => ({
  loginProviders: t.field({
    type: [GenerateGoogleAuthUrlResponseDto],
    nullable: false,
    args: {
      inviteHash: t.arg.string({ required: false }),
    },
    resolve: (_root, args, _ctx, _info) => {
      return Object.values(LoginProviderEnum).map((provider) => {
        return {
          url: generateAuthUrl(provider, args.inviteHash),
          type: provider,
          name: camelCase(provider),
        };
      });
    },
  }),
}));
