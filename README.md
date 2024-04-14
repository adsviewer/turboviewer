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
4. Add an empty .env file in the `apps/server` directory
5. Create a .env file in the `apps/server` directory with the following content:

```env
API_ENDPOINT=<VALUE from here: https://github.com/adsviewer/turboviewer/wiki/Create-a-https-publicaly-available-endpoint>
FB_APPLICATION_ID=<VALUE from here: https://github.com/adsviewer/turboviewer/wiki/Create-your-test-facebook-app>
FB_APPLICATION_SECRET=<VALUE from here: https://github.com/adsviewer/turboviewer/wiki/Create-your-test-facebook-app>
```

6. Run `pnpm i`
7. `pnpm run dev`
8. Open [http://localhost:3000](http://localhost:3000)
