'use client';

import Link from 'next/link';
import { useForm, zodResolver } from '@mantine/form';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Anchor,
  Button,
  Container,
  Flex,
  Paper,
  PasswordInput,
  Text,
  TextInput,
  Title,
  Transition,
} from '@mantine/core';
import { logger } from '@repo/logger';
import { useTranslations } from 'next-intl';
import { useEffect, useState, useTransition } from 'react';
import { REFRESH_TOKEN_KEY, TOKEN_KEY } from '@repo/utils';
import { SignInSchema, type SignInSchemaType } from '@/util/schemas/login-schemas';
import { type LoginProvidersQuery } from '@/graphql/generated/schema-server';
import { addOrReplaceURLParams, errorKey, type GenericRequestResponseBody } from '@/util/url-query-utils';
import { env } from '@/env.mjs';
import LoginProviders from '../components/login-providers';
import { getLoginProviders } from './actions';

export default function SignIn(): React.JSX.Element {
  const t = useTranslations('authentication');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [loginProviders, setLoginProviders] = useState<LoginProvidersQuery['loginProviders']>([]);
  const [isMounted, setIsMounted] = useState<boolean>(false);
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

    // Play animation
    setIsMounted(false);
    setTimeout(() => {
      setIsMounted(true);
    }, 0);
  }, []);

  const handleSubmit = (values: SignInSchemaType): void => {
    startTransition(() => {
      fetch('/api/auth/sign-in', {
        method: 'POST',
        body: JSON.stringify(values),
      })
        .then((response) => {
          logger.info(`Sign-in response: ${String(response.status)}. Is Ok: ${String(response.ok)}`);
          return response.json();
        })
        .then((data: GenericRequestResponseBody & { token: string; refreshToken: string }) => {
          logger.info(`Sign-in data: ${JSON.stringify(data)}`);
          if (data.success) {
            startTransition(() => {
              const redirectUrl = searchParams.get('redirect');
              logger.info(`Redirect after sign-in: ${String(redirectUrl)}`);

              if (redirectUrl === new URL(env.NEXT_PUBLIC_BACKOFFICE_URL).host) {
                router.push(
                  `${env.NEXT_PUBLIC_BACKOFFICE_URL}/api/save-tokens?${TOKEN_KEY}=${data.token}&${REFRESH_TOKEN_KEY}=${data.refreshToken}`,
                );
              } else {
                router.push(redirectUrl ?? '/insights');
              }
            });
            return null;
          }

          // Show errors
          const newURL = addOrReplaceURLParams(pathname, searchParams, errorKey, data.error.message);
          router.replace(newURL);
        })
        .catch((error: unknown) => {
          logger.error(error);
        });
    });
  };

  return (
    <Transition mounted={isMounted} transition="skew-up" duration={400} timingFunction="ease">
      {(styles) => (
        <div style={styles}>
          <Container size={420} my={40}>
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
                <Button type="submit" fullWidth mt="xl" disabled={isPending}>
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
        </div>
      )}
    </Transition>
  );
}
