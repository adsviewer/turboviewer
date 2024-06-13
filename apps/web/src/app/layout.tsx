import '@mantine/core/styles.css';
import '@mantine/charts/styles.css';
import '@mantine/notifications/styles.css';
import './globals.scss';
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

export const metadata: Metadata = {
  title: 'AdsViewer',
  description: 'Get granular insights into your ads performance',
};

export default async function RootLayout({ children }: { children: React.ReactNode }): Promise<React.ReactNode> {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <ColorSchemeScript />
        <NextIntlClientProvider messages={messages}>
          <MantineProvider>
            <Notifications />
            {children}
          </MantineProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
