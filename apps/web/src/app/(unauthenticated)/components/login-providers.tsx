import { Flex, Button } from '@mantine/core';
import Link from 'next/link';
import React from 'react';
import { useTranslations } from 'next-intl';
import LoaderCentered from '@/components/misc/loader-centered';
import { type LoginProvidersQuery } from '@/graphql/generated/schema-server';
import GoogleIcon from '../sign-in/components/google-login-icon';

interface PropsType {
  loginProviders: LoginProvidersQuery['loginProviders'];
}

export default function LoginProviders(props: PropsType): React.ReactNode {
  const t = useTranslations('authentication');

  return (
    <Flex direction="column" justify="center" my="xl">
      {/* We'll be rendering using .map when more providers are implemented */}
      {props.loginProviders.length ? (
        <Button
          component={Link}
          href={props.loginProviders[0].url}
          w="100%"
          leftSection={<GoogleIcon />}
          variant="default"
        >
          {t('loginGoogle')}
        </Button>
      ) : (
        <LoaderCentered />
      )}
    </Flex>
  );
}
