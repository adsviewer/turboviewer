import { z } from 'zod';
import { createEnv } from '@t3-oss/env-nextjs';

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   *
   * Don't forget to expose this variables to the server-side runtime in amplify.yml:
   *  - env | grep -e EXAMPLE_1 -e EXAMPLE_2 >> apps/backoffice/.env.production
   */
  server: {
    AUTH_SECRET: z.string().min(1).default('something'),
    BACKOFFICE_URL: z.string().min(1).default('http://localhost:3001'),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string().min(1),
    // Add `.min(1) on these if you want to make sure they're not empty
    NEXT_WEBAPP_ENDPOINT: z.string().min(1).default('http://localhost:3000'),
    NEXT_PUBLIC_REAL_GRAPHQL_ENDPOINT: z.string().min(1).default('http://localhost:4000/graphql'),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    AUTH_SECRET: process.env.AUTH_SECRET,
    BACKOFFICE_URL: process.env.BACKOFFICE_URL,
    NEXT_WEBAPP_ENDPOINT: process.env.NEXT_WEBAPP_ENDPOINT,
    NEXT_PUBLIC_REAL_GRAPHQL_ENDPOINT: process.env.NEXT_PUBLIC_REAL_GRAPHQL_ENDPOINT,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
   * This is especially useful for Docker builds.
   */
  skipValidation: Boolean(process.env.SKIP_ENV_VALIDATION),
});

