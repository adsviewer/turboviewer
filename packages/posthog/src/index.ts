import { PostHog } from 'posthog-node';
import { env } from './config';

const client = new PostHog(env.POSTHOG_API_KEY, { host: 'https://eu.i.posthog.com' });

export const isFeatureEnabled = async (key: string, distinctId?: string): Promise<boolean> =>
  Boolean(await client.isFeatureEnabled(key, distinctId ?? ''));
