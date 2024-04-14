# AdsViewer

A bunch of cool staff for viewing, optimizing and growing yor digital ad portfolio.

## Development Setup

### Prerequisites

- [postgres](https://www.postgresql.org/download/)
- [pnpm](https://pnpm.io/installation)
- [redis-clis](https://redis.io/docs/latest/operate/oss_and_stack/install/install-redis/)

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
FB_APPLICATION_ID=<VALUE here: https://developers.facebook.com/apps/387623786246176/settings/basic/?business_id=748522962930698>
FB_APPLICATION_SECRET=<VALUE here: https://developers.facebook.com/apps/387623786246176/settings/basic/?business_id=748522962930698>
```

5. Run `pnpm i`
6. `pnpm run dev`
7. Open [http://localhost:3000](http://localhost:3000)

## Developer Onboarding

Welcome to the team! This page will try to provide the resources that you will need to have a smooth onboarding
experience

### Things you should have access to

- email: should be yourNick@adsviewer.io.
- [slack](https://adsviewer.slack.com/): this is where we communicate.
- [aws](https://d-9067fd5baf.awsapps.com/start/#/?tab=accounts): this is where we host our infrastructure.
- [gitHub](https://github.com/adsviewer/): this is where we host our code.
- [facebook](https://developers.facebook.com/apps/?show_reminder=true): One of the channels we are working with.
- [figma](https://www.figma.com/files/project/221242948/adsviewer-project?fuid=1358021073244020634): this is where we
  design our products.
- [bitwarden](https://vault.bitwarden.com/#/login): this is where we store our secrets.
- [terraform](https://app.terraform.io/app/adsviewer/workspaces): this is where we manage our infrastructure.
- [loom](https://www.loom.com/looms/videos): this is where we record our videos.

If you don’t have access to any of these, message giorgos on Slack or [email](mailto:giorgos@adsviewer.io). Please make sure
that while you are signing up for
all the services above you take the time to upload your picture to all of them. It does not need to be your picture
per se, just something that you identify with/like.

#### Google two-factor authentication (2FA)

You have a
few days that you are allowed to access your email without enabling 2FA. To avoid any interruptions
please [look into it](https://myaccount.google.com/u/2/signinoptions/two-step-verification) as soon as
possible.

#### Setting up your local environment

Most of us are using the same github account. You can create a routing in order to receive notification regarding magpie
to your work email.

1. Add your work email in [github](https://github.com/settings/emails)
2. Create a custom [route](https://github.com/settings/notifications/custom_routing) by picking `adsviewer` from the
   left dropdown list and your work email on the right dropdown list.
