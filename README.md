# AdsViewer

A bunch of cool staff for viewing, optimizing and growing yor digital ad portfolio.

## Development Setup

### Prerequisites

- [postgres](https://www.postgresql.org/download/)
- [pnpm](https://pnpm.io/installation)
- [redis-cli](https://redis.io/docs/latest/operate/oss_and_stack/install/install-redis/)

### Setup

1. Clone the repo
2. Create a db named `adsviewer` in postgres
3. Create a .env file in the `packages/database` directory with the following content:
   ```env
   DATABASE_URL=postgresql://postgres@localhost:5432/adsviewer
   ```
4. Copy
   the [.env.server](https://eu-central-1.console.aws.amazon.com/s3/object/local-adsviewer?region=eu-central-1&bucketType=general&prefix=.env.server)
   in the `apps/server` directory. Look at [Configuring aws-cli](#configuring-aws-cli) if you don't have access.

5. Create a .env file in the `apps/web` directory with the following content:

   ```env
   NEXT_PUBLIC_REAL_GRAPHQL_ENDPOINT=http://localhost:4000/graphql
   ```

6. Run `pnpm i`
7. `pnpm run dev`
8. Open [http://localhost:3000](http://localhost:3000)
