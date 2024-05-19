import '@mantine/core/styles.css';
import { ColorSchemeScript, Flex, MantineProvider } from '@mantine/core';
import type { Metadata } from 'next';
import { LogoFull } from '@/components/misc/logo-full';

export const metadata: Metadata = {
  title: 'AdsViewer',
  description: 'Get granular insights into your ads performance',
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider>
          <Flex align="center" justify="center" my="xl">
            <LogoFull />
          </Flex>
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
