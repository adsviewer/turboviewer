/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  rewrites: async () => {
    return {
      beforeFiles: [
        // These rewrites are checked after headers/redirects
        // and before all files including _next/public files which
        // allows overriding page files
        // {
        //   source: '/graphql:path*',
        //   destination: process.env.NEXT_PUBLIC_REAL_GRAPHQL_ENDPOINT,
        // },
      ],
      afterFiles: [
        // These rewrites are checked after pages/public files
        // are checked but before dynamic routes
        // {
        //   source: '/graphql:path*',
        //   destination: process.env.NEXT_PUBLIC_REAL_GRAPHQL_ENDPOINT,
        // },
      ],
      fallback: [
        // These rewrites are checked after both pages/public files
        // and dynamic routes are checked
        {
          source: '/graphql:path*',
          destination: process.env.NEXT_PUBLIC_REAL_GRAPHQL_ENDPOINT,
        },
      ],
    }
  },
};

export default config;
