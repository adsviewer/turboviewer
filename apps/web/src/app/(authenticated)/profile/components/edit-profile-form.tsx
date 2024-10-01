'use client';

import { Button, Flex, Group, PasswordInput, TextInput } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import React, { useEffect, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useSetAtom } from 'jotai';
import _ from 'lodash';
import { logger } from '@repo/logger';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { EditProfileSchema } from '@/util/schemas/profile-schemas';
import { type UpdateUserMutationVariables, type MeQuery } from '@/graphql/generated/schema-server';
import { initialUserDetails, userDetailsAtom } from '@/app/atoms/user-atoms';
import { addOrReplaceURLParams, urlKeys } from '@/util/url-query-utils';
import { updateUserDetails } from '../actions';

interface PropsType {
  userDetails: MeQuery['me'];
}

export default function EditProfileForm(props: PropsType): React.ReactNode {
  const t = useTranslations('profile');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const setUserDetails = useSetAtom(userDetailsAtom);
  const form = useForm({
    mode: 'controlled',
    initialValues: {
      firstName: props.userDetails.firstName,
      lastName: props.userDetails.lastName,
      email: props.userDetails.email,
      oldPassword: '',
      newPassword: '',
      repeatPassword: '',
    },
    validate: zodResolver(EditProfileSchema),
  });

  // Load fetched data onto the form
  useEffect(() => {
    // Ensure profile data has been fetched before initialization
    if (!_.isEqual(props.userDetails, initialUserDetails)) {
      form.initialize({
        firstName: props.userDetails.firstName,
        lastName: props.userDetails.lastName,
        email: props.userDetails.email,
        oldPassword: '',
        newPassword: '',
        repeatPassword: '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- works as intended - if the dependency is added it keeps calling it self infinitely, not sure if possible to fix this.
  }, [props.userDetails]);

  const handleSubmit = (values: UpdateUserMutationVariables): void => {
    // Set unused fields as undefined
    const data = { ...values };
    if (!data.newPassword || !data.oldPassword) {
      delete data.oldPassword;
      delete data.newPassword;
    }

    startTransition(() => {
      void updateUserDetails(data).then((res) => {
        if (!res.success) {
          logger.error(res.error);
          const newURL = addOrReplaceURLParams(pathname, searchParams, urlKeys.error, String(res.error));
          router.replace(newURL);
        } else {
          setUserDetails(res.data.updateUser);
          form.setValues({
            oldPassword: '',
            newPassword: '',
            repeatPassword: '',
          });
          form.resetDirty();
        }
      });
    });
  };

  return (
    <form
      onSubmit={form.onSubmit((values) => {
        handleSubmit(values);
      })}
    >
      <Flex w="50%" direction="column">
        <TextInput
          label={t('firstName')}
          {...form.getInputProps('firstName')}
          placeholder="John"
          key={form.key('firstName')}
          mb="md"
        />
        <TextInput
          label={t('lastName')}
          key={form.key('lastName')}
          {...form.getInputProps('lastName')}
          placeholder="Doe"
          mb="md"
        />
        <PasswordInput
          label={t('oldPassword')}
          key={form.key('oldPassword')}
          {...form.getInputProps('oldPassword')}
          placeholder={t('oldPassword')}
          type="password"
          mb="md"
        />
        <TextInput
          label="Email"
          {...form.getInputProps('email')}
          placeholder="you@example.com"
          key={form.key('email')}
          mb="md"
          autoComplete="username"
          style={{ display: 'none' }} // Is currently hidden so that browsers' password manager prompts for password update
        />
        <PasswordInput
          label={t('newPassword')}
          key={form.key('newPassword')}
          {...form.getInputProps('newPassword')}
          placeholder={t('newPassword')}
          type="password"
          mb="md"
          // the input field before the one whose id is "password" is used as the "username" for the password manager
          id="password"
        />
        <PasswordInput
          key={form.key('repeatPassword')}
          {...form.getInputProps('repeatPassword')}
          label={t('repeatPassword')}
          placeholder={t('repeatPassword')}
          type="password"
          mb="md"
        />
        <Group mt="md">
          <Button disabled={!form.isDirty()} loading={isPending} type="submit" w={200}>
            {t('submit')}
          </Button>
        </Group>
      </Flex>
    </form>
  );
}
