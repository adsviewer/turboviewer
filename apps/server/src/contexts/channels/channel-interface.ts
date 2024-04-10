import { type AError } from '@repo/utils';

export interface GenerateAuthUrlResp {
  url: string;
  state: string;
}

export interface TokensResponse {
  accessToken: string;
  refreshToken?: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt?: Date;
}

export interface ChannelInterface {
  generateAuthUrl: () => GenerateAuthUrlResp;
  exchangeCodeForTokens: (code: string) => Promise<TokensResponse | AError>;
}
