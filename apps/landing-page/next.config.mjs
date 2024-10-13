import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['pino'],
  },
  swcMinify: true,
  productionBrowserSourceMaps: true
};

export default withNextIntl(nextConfig);
