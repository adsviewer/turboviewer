import '@mantine/core/styles.css';
import '@mantine/charts/styles.css';
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { Suspense } from 'react';
import { MainAppShell } from '@/components/shells/main-shell/main-shell';
import LoaderCentered from '@/components/misc/loader-centered';

export const metadata: Metadata = {
  title: 'AdsViewer',
  description: 'Get granular insights into your ads performance',
};

export default async function RootLayout({ children }: { children: React.ReactNode }): Promise<React.ReactNode> {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          <MantineProvider>
            <MainAppShell>
              <Suspense fallback={<LoaderCentered />}>{children}</Suspense>
            </MainAppShell>
          </MantineProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
