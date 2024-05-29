import { LoginProviderEnum } from '@repo/database';
import { builder } from '../builder';
import { generateAuthUrl } from '../../contexts/login-provider/login-provider-helper';
import { GenerateGoogleAuthUrlResponseDto } from './user-types';

builder.queryFields((t) => ({
  loginProviders: t.field({
    type: [GenerateGoogleAuthUrlResponseDto],
    resolve: (_root, _args, _ctx, _info) => {
      return Object.values(LoginProviderEnum).map((provider) => {
        return {
          url: generateAuthUrl(provider),
          name: provider,
        };
      });
    },
  }),
}));
