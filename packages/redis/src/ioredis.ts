import { Redis } from 'ioredis';
import { env } from './config';

export const ioredis = new Redis(env.REDIS_URL);
