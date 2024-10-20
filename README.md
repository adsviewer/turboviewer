# AdsViewer

A bunch of cool stuff for viewing, optimizing and growing your digital ad portfolio.

## Development Setup

### Prerequisites

- MacOS or Linux (Windows and/or WSL are **not** supported)
- [postgres](https://www.postgresql.org/download/)
- [pnpm](https://pnpm.io/installation)
- [redis](https://redis.io/docs/latest/operate/oss_and_stack/install/install-redis/)
- [enable meta integration](https://github.com/adsviewer/turboviewer/wiki/Enable-meta-integration). Soft requirement,
  you will not be able to use meta integration locally without this.

### Setup

1. Clone the repo
2. Create a db named `adsviewer` in postgres
3. Create a .env file in the `packages/database` directory with the following content:
   ```env
   DATABASE_URL=postgresql://postgres@localhost:5432/adsviewer
   ```
4. Login to [development account](https://d-9067fd5baf.awsapps.com/start/#/?tab=accounts) and copy
   the [.env](https://eu-central-1.console.aws.amazon.com/s3/object/local-adsviewer?region=eu-central-1&bucketType=general&prefix=server/.env)
   in the `apps/server` directory. Look at [Configuring aws-cli](#configuring-aws-cli) if you don't
   have access.

5. Create a .env file in the `apps/web`, `apps/backoffice` directory with the following content:

   ```env
   GRAPHQL_ENDPOINT=http://localhost:4000/graphql
   ```

6. Run `pnpm i`
7. `pnpm dev`
8. Open [http://localhost:3000](http://localhost:3000)

### Configuring aws-cli

#### Prerequisites

- [aws-cli](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)

#### Setup

There should be a `~/.aws/credentials` file, this will be used to authenticate with aws services. If it does not exist
create an empty one. In order to get credentials you visit
the [AWS access portal](https://d-9067fd5baf.awsapps.com/start/#/?tab=accounts) open the `development account` and click
on `Access keys`. Scroll down to Option 2 and click copy. Then paste the content in
the `~/.aws/credentials` file.

#### Everyday hustle

The credentials that you generated above will expire every 12 hours. In order to refresh them you need to repeat the
process. On the flip side, very few features require aws services to be run locally (sending emails on forget password
flow is an example).
