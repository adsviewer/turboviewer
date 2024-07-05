import { type NextFunction, type Request, type Response } from 'express';
import { redisExpire, redisIncr } from '@repo/redis';
import { authLoginEndpoint } from '../contexts/login-provider/login-provider-types';
import { authConfirmInvitedUserEndpoint, authConfirmUserEmailEndpoint } from '../contexts/user/user';

interface RateLimiterRule {
  endpoint: string;
  rateLimit: {
    time: number;
    limit: number;
  };
}

const signInProviderLimitRule: RateLimiterRule = {
  endpoint: `/api${authLoginEndpoint}`,
  rateLimit: {
    time: 60,
    limit: 20,
  },
};

const authConfirmUserEmailLimitRule: RateLimiterRule = {
  endpoint: `/api${authConfirmUserEmailEndpoint}`,
  rateLimit: {
    time: 60,
    limit: 20,
  },
};

const authConfirmInvitedUserLimitRule: RateLimiterRule = {
  endpoint: `/api${authConfirmInvitedUserEndpoint}`,
  rateLimit: {
    time: 60,
    limit: 20,
  },
};

const rateLimiter = (rule: RateLimiterRule) => {
  const { endpoint, rateLimit } = rule;
  return async (request: Request, response: Response, next: NextFunction) => {
    const ipAddress = request.ip;
    const redisId = `rate_limiter-${endpoint}/${String(ipAddress)}`;

    const requests = await redisIncr(redisId);

    if (requests === 1) {
      await redisExpire(redisId, rateLimit.time);
    }

    if (requests > rateLimit.limit) {
      return response.status(429).send({
        message: 'too many requests, please try again later',
      });
    }
    next();
  };
};

export const loginProviderRateLimiter = rateLimiter(signInProviderLimitRule);
export const authConfirmUserEmailRateLimiter = rateLimiter(authConfirmUserEmailLimitRule);
export const authConfirmInvitedUserRateLimiter = rateLimiter(authConfirmInvitedUserLimitRule);
