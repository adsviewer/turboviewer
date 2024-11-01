import {withSentryConfig} from '@sentry/nextjs';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const config = {
  experimental: {
    optimizePackageImports: ['@mantine/core', '@mantine/hooks'],
  },
  reactStrictMode: true,
  serverExternalPackages: ['pino'],
  transpilePackages: ['@repo/mode'],
  rewrites: async () => {
    return {
      beforeFiles: [
        // These rewrites are checked after headers/redirects
        // and before all files including _next/public files which
        // allows overriding page files
        {
          source: '/graphql:path*',
          destination: process.env.GRAPHQL_ENDPOINT,
        },
      ],
      afterFiles: [
        // These rewrites are checked after pages/public files
        // are checked but before dynamic routes
        {
          source: '/graphql:path*',
          destination: process.env.GRAPHQL_ENDPOINT,
        },
      ],
      fallback: [
        // These rewrites are checked after both pages/public files
        // and dynamic routes are checked
        {
          source: '/graphql:path*',
          destination: process.env.GRAPHQL_ENDPOINT,
        },
      ],
    };
  },
};

const nextIntlConfig = withNextIntl(config);

const sentryConfig = (_config) => withSentryConfig(nextIntlConfig, {
// For all available options, see:
// https://github.com/getsentry/sentry-webpack-plugin#options

  org: "adsviewer",
  project: "backoffice",

// Only print logs for uploading source maps in CI
  silent: !process.env.CI,
});

const conditionalConfig = process.env.CI ? sentryConfig(nextIntlConfig) : nextIntlConfig;

export default conditionalConfig;
