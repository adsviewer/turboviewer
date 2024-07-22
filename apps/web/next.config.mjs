import {withSentryConfig} from '@sentry/nextjs';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const config = {
  transpilePackages: ['@repo/mode'],
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['pino'],
    optimizePackageImports: ['@mantine/core', '@mantine/hooks'],
  },
  rewrites: async () => {
    return {
      beforeFiles: [
        // These rewrites are checked after headers/redirects
        // and before all files including _next/public files which
        // allows overriding page files
        {
          source: '/graphql:path*',
          destination: process.env.NEXT_PUBLIC_REAL_GRAPHQL_ENDPOINT,
        },
      ],
      afterFiles: [
        // These rewrites are checked after pages/public files
        // are checked but before dynamic routes
        {
          source: '/graphql:path*',
          destination: process.env.NEXT_PUBLIC_REAL_GRAPHQL_ENDPOINT,
        },
      ],
      fallback: [
        // These rewrites are checked after both pages/public files
        // and dynamic routes are checked
        {
          source: '/graphql:path*',
          destination: process.env.NEXT_PUBLIC_REAL_GRAPHQL_ENDPOINT,
        },
      ],
    };
  },
};

const nextIntlConfig = withNextIntl(config);

const sentryConfig = (config) => withSentryConfig(nextIntlConfig, {
// For all available options, see:
// https://github.com/getsentry/sentry-webpack-plugin#options

  org: "adsviewer",
  project: "web",

// Only print logs for uploading source maps in CI
  silent: !process.env.CI,

// For all available options, see:
// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

// Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

// Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
// This can increase your server load as well as your hosting bill.
// Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
// side errors will fail.
  tunnelRoute: "/monitoring",

// Hides source maps from generated client bundles
  hideSourceMaps: true,

// Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

// Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
// See the following for more information:
// https://docs.sentry.io/product/crons/
// https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
});

export default sentryConfig(nextIntlConfig);
