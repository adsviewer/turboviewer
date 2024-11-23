import { Flex } from '@mantine/core';
import { LogoSimple } from '@/components/misc/logo-simple';

export default function RootLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  return (
    <>
      <Flex justify="center" mt="xl">
        <LogoSimple />
      </Flex>
      {children}
    </>
  );
}
