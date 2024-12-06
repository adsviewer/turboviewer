import '@mantine/core/styles.css';
import '@mantine/charts/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import './globals.scss';
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { getMessages } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { GoogleAnalytics } from '@next/third-parties/google';
import { TOKEN_KEY } from '@repo/utils';
import React from 'react';
import { ModalsProvider } from '@mantine/modals';
import NotificationsHandler from '@/components/misc/notifications-handler';
import { env } from '@/env.mjs';
import { UrqlProvider } from '@/app/urql-provider';
import { Subscriptions } from './subscriptions';

export const metadata: Metadata = {
  title: 'AdsViewer',
  description: 'Get granular insights into your ads performance',
};

export default async function RootLayout({ children }: { children: React.ReactNode }): Promise<React.ReactNode> {
  const headersList = await headers();
  const acceptLanguageHeaderValue = headersList.get('accept-language');
  const preferredLocale = acceptLanguageHeaderValue ? acceptLanguageHeaderValue.split(',')[0] : 'en';
  const messages = await getMessages();
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_KEY)?.value;

  return (
    <html lang={preferredLocale}>
      <body>
        <GoogleAnalytics gaId={env.NEXT_PUBLIC_MEASUREMENT_ID} />
        <ColorSchemeScript />
        <NextIntlClientProvider messages={messages} locale={preferredLocale}>
          <MantineProvider defaultColorScheme="auto">
            <ModalsProvider>
              <NotificationsHandler />
              <UrqlProvider token={token} acceptLanguage={acceptLanguageHeaderValue}>
                <Subscriptions />
                {children}
              </UrqlProvider>
              <Analytics />
              <SpeedInsights />
            </ModalsProvider>
          </MantineProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
