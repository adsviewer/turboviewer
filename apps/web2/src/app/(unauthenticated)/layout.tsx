import '@mantine/core/styles.css';
import React, { Suspense } from 'react';
import { ColorSchemeScript, Flex, MantineProvider, Loader } from '@mantine/core';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { LogoFull } from '@/components/misc/logo-full';

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
          <MantineProvider forceColorScheme="light">
            <Flex align="center" justify="center" my="xl">
              <LogoFull />
            </Flex>
            <Suspense fallback={<Loader />}>{children}</Suspense>
          </MantineProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
