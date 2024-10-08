'use client';

import { useForm, zodResolver } from '@mantine/form';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  TextInput,
  PasswordInput,
  Checkbox,
  Anchor,
  Paper,
  Title,
  Text,
  Container,
  Group,
  Button,
  SimpleGrid,
  Flex,
} from '@mantine/core';
import { logger } from '@repo/logger';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { inviteHashLabel } from '@repo/utils';
import { SignUpSchema, type SignUpSchemaType } from '@/util/schemas/login-schemas';
import { type LoginProvidersQuery } from '@/graphql/generated/schema-server';
import { addOrReplaceURLParams, urlKeys, type GenericRequestResponseBody } from '@/util/url-query-utils';
import LottieAnimation from '@/components/misc/lottie-animation';
import LoginProviders from '../components/login-providers';
import { getLoginProviders } from '../sign-in/actions';
import wavingPeopleAnimation from '../../../../public/lotties/waving-people.json';

export default function SignUp(): React.JSX.Element {
  const t = useTranslations('authentication');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isPending, setIsPending] = useState<boolean>(false);
  const [loginProviders, setLoginProviders] = useState<LoginProvidersQuery['loginProviders']>([]);
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      firstName: '',
      lastName: '',
      email: searchParams.get(urlKeys.email) ?? '',
      password: '',
      inviteHash: searchParams.get(inviteHashLabel) ?? '',
    },
    validate: zodResolver(SignUpSchema),
  });

  useEffect(() => {
    const inviteHash = searchParams.get(inviteHashLabel);
    void getLoginProviders(inviteHash).then((res) => {
      setLoginProviders(res.loginProviders);
    });
  }, [searchParams]);

  const handleSubmit = (values: SignUpSchemaType): void => {
    setIsPending(true);
    fetch('/api/auth/sign-up', {
      method: 'POST',
      body: JSON.stringify(values),
    })
      .then((response) => {
        return response.json();
      })
      .then((data: GenericRequestResponseBody) => {
        if (data.success) {
          router.push('/');
          return null;
        }

        // Show errors
        const newURL = addOrReplaceURLParams(pathname, searchParams, urlKeys.error, data.error.message);
        router.replace(newURL);
      })
      .catch((error: unknown) => {
        logger.error(error);
      })
      .finally(() => {
        setIsPending(false);
      });
  };

  return (
    <Container size={420} my={40}>
      <LottieAnimation
        animationData={wavingPeopleAnimation}
        speed={0.5}
        loop
        playAnimation
        customStyles={{
          position: 'absolute',
          top: 320,
          left: 200,
          zIndex: -9999,
          width: '35rem',
          transform: 'rotate(-5deg)',
        }}
      />

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <Flex direction="column" align="center" justify="center" mb="xl">
          <Title ta="center">{t('signUp')}</Title>
          <Text c="dimmed" size="sm" ta="center" mt={5}>
            {t('alreadyHaveAccount')}{' '}
            <Anchor
              size="sm"
              component="button"
              onClick={() => {
                router.push('/sign-in');
              }}
            >
              {t('signInNow')}!
            </Anchor>
          </Text>
        </Flex>

        <form
          onSubmit={form.onSubmit((values) => {
            handleSubmit(values);
          })}
        >
          <SimpleGrid cols={2}>
            <TextInput
              label={t('firstName')}
              placeholder="John"
              key={form.key('firstName')}
              {...form.getInputProps('firstName')}
              required
            />
            <TextInput
              label={t('lastName')}
              placeholder="Doe"
              key={form.key('lastName')}
              {...form.getInputProps('lastName')}
              required
            />
          </SimpleGrid>
          <TextInput
            label="Email"
            placeholder="you@example.com"
            key={form.key('email')}
            {...form.getInputProps('email')}
            required
            mt="md"
            readOnly={searchParams.has(urlKeys.email)}
          />
          <PasswordInput
            label={t('password')}
            placeholder={t('yourPassword')}
            key={form.key('password')}
            {...form.getInputProps('password')}
            required
            mt="md"
          />
          <Group justify="space-between" mt="lg">
            <Checkbox
              label={
                <>
                  {t('agree')}{' '}
                  <Anchor size="sm" href="https://adsviewer.io/terms-and-conditions" target="_blank">
                    {t('termsAndConditions')}
                  </Anchor>
                </>
              }
              required
            />
          </Group>
          <Button type="submit" fullWidth mt="xl" loading={isPending}>
            {t('signUp')}!
          </Button>
        </form>
      </Paper>

      <LoginProviders loginProviders={loginProviders} />
    </Container>
  );
}
