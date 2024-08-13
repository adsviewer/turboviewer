import { Suspense } from 'react';
import { Flex } from '@mantine/core';
import LoaderCentered from '@/components/misc/loader-centered';
import { LogoSimple } from '@/components/misc/logo-simple';

export default function RootLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  return (
    <Suspense fallback={<LoaderCentered />}>
      <Flex justify="center" mt="xl">
        <LogoSimple />
      </Flex>
      {children}
    </Suspense>
  );
}
