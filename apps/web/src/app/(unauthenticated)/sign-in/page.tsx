'use client';

import Link from 'next/link';
import { useForm, zodResolver } from '@mantine/form';
import { redirect, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Anchor, Box, Button, Container, Flex, Paper, PasswordInput, Text, TextInput, Title } from '@mantine/core';
import { logger } from '@repo/logger';
import { useTranslations } from 'next-intl';
import { useEffect, useState, useTransition } from 'react';
import { REFRESH_TOKEN_KEY, TOKEN_KEY } from '@repo/utils';
import { SignInSchema, type SignInSchemaType } from '@/util/schemas/login-schemas';
import { type LoginProvidersQuery } from '@/graphql/generated/schema-server';
import { addOrReplaceURLParams, urlKeys, type GenericRequestResponseBody } from '@/util/url-query-utils';
import { env } from '@/env.mjs';
import LottieAnimation from '@/components/misc/lottie-animation';
import { DEFAULT_HOME_PATH } from '@/middleware';
import LoginProviders from '../components/login-providers';
import analyticalPersonAnimation from '../../../../public/lotties/analytical-person.json';
import { getLoginProviders } from './actions';

export default function SignIn(): React.JSX.Element {
  const t = useTranslations('authentication');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [loginProviders, setLoginProviders] = useState<LoginProvidersQuery['loginProviders']>([]);
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      email: '',
      password: '',
    },
    validate: zodResolver(SignInSchema),
  });

  useEffect(() => {
    void getLoginProviders()
      .then((res) => {
        setLoginProviders(res.loginProviders);
      })
      .catch((error: unknown) => {
        logger.error(error);
      });
  }, []);

  const handleSubmit = (values: SignInSchemaType): void => {
    startTransition(() => {
      fetch('/api/auth/sign-in', {
        method: 'POST',
        body: JSON.stringify(values),
      })
        .then((response) => {
          return response.json();
        })
        .then((data: GenericRequestResponseBody & { token: string; refreshToken: string }) => {
          if (data.success) {
            startTransition(() => {
              const redirectUrl = searchParams.get('redirect');
              if (redirectUrl === env.NEXT_PUBLIC_BACKOFFICE_URL) {
                const redirectTo = `${env.NEXT_PUBLIC_BACKOFFICE_URL}/api/save-tokens?${TOKEN_KEY}=${data.token}&${REFRESH_TOKEN_KEY}=${data.refreshToken}`;
                return redirect(redirectTo);
              }
              router.push(redirectUrl ?? DEFAULT_HOME_PATH);
            });
            return null;
          }

          // Show errors
          const newURL = addOrReplaceURLParams(pathname, searchParams, urlKeys.error, data.error.message);
          router.replace(newURL);
        })
        .catch((error: unknown) => {
          logger.error(error);
        });
    });
  };

  return (
    <Container size={420} my={40}>
      <Box>
        <LottieAnimation
          animationData={analyticalPersonAnimation}
          speed={0.5}
          loop
          playAnimation
          allowOnMobile
          customStyles={{
            position: 'absolute',
            top: 0,
            right: 34,
            zIndex: -9999,
            width: '35rem',
            transform: 'rotate(-5deg)',
            opacity: 0.5,
          }}
        />
      </Box>

      {/* Layout */}
      <Paper withBorder shadow="sm" p={30} mt={30} radius="md">
        <Flex direction="column" align="center" justify="center" mb="xl">
          <Title ta="center">{t('signIn')}</Title>
          <Text c="dimmed" size="sm" ta="center" mt={5}>
            {t('noAccount')}{' '}
            <Anchor
              size="sm"
              component="button"
              onClick={() => {
                router.push('/sign-up');
              }}
            >
              {t('signUp')}!
            </Anchor>
          </Text>
        </Flex>

        <form
          onSubmit={form.onSubmit((values) => {
            handleSubmit(values);
          })}
        >
          <TextInput
            label="Email"
            placeholder="you@example.com"
            key={form.key('email')}
            {...form.getInputProps('email')}
            required
          />
          <PasswordInput
            label={t('password')}
            placeholder={t('yourPassword')}
            key={form.key('password')}
            {...form.getInputProps('password')}
            required
            mt="md"
          />
          <Button type="submit" fullWidth mt="xl" loading={isPending}>
            {t('signIn')}!
          </Button>
          <Flex justify="flex-end" mt="sm">
            <Anchor size="sm" component={Link} href="/forgot-password">
              {t('forgotPassword')}
            </Anchor>
          </Flex>
        </form>
      </Paper>

      <LoginProviders loginProviders={loginProviders} />
    </Container>
  );
}
