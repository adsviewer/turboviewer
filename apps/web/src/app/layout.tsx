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
import { headers } from 'next/headers';
import NotificationsHandler from '@/components/misc/notifications-handler';

export const metadata: Metadata = {
  title: 'AdsViewer',
  description: 'Get granular insights into your ads performance',
};

export default async function RootLayout({ children }: { children: React.ReactNode }): Promise<React.ReactNode> {
  const headersList = headers();
  const acceptLanguageHeaderValue = headersList.get('accept-language');
  const preferredLocale = acceptLanguageHeaderValue ? acceptLanguageHeaderValue.split(',')[0] : 'en';
  const messages = await getMessages();

  return (
    <html lang={preferredLocale}>
      <body>
        <ColorSchemeScript />
        <NextIntlClientProvider messages={messages} locale={preferredLocale}>
          <MantineProvider defaultColorScheme="auto">
            <NotificationsHandler />
            {children}
            <Analytics />
            <SpeedInsights />
          </MantineProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
