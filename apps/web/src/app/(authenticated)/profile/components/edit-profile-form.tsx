'use client';

import { Button, Flex, Group, PasswordInput, TextInput } from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import React, { useEffect, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useSetAtom } from 'jotai';
import { EditProfileSchema } from '@/util/schemas/profile-schemas';
import { type UpdateUserMutationVariables, type MeQuery } from '@/graphql/generated/schema-server';
import { userDetailsAtom } from '@/app/atoms/user-atoms';
import { updateUserDetails } from '../actions';

interface PropsType {
  userDetails: MeQuery['me'];
}

export default function EditProfileForm(props: PropsType): React.ReactNode {
  const t = useTranslations('profile');
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
    if (props.userDetails.firstName) {
      form.initialize({
        firstName: props.userDetails.firstName,
        lastName: props.userDetails.lastName,
        email: props.userDetails.email,
        oldPassword: '',
        newPassword: '',
        repeatPassword: '',
      });
    }
  }, [form, props.userDetails]);

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
          form.setFieldError('oldPassword', res.error);
        } else {
          setUserDetails({
            id: res.data.updateUser.id,
            firstName: res.data.updateUser.firstName,
            lastName: res.data.updateUser.lastName,
            email: res.data.updateUser.email,
            photoUrl: res.data.updateUser.photoUrl,
            allRoles: res.data.updateUser.allRoles,
            currentOrganization: res.data.updateUser.currentOrganization,
          });
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
          <Button disabled={isPending || !form.isDirty()} type="submit" w={200}>
            {t('submit')}
          </Button>
        </Group>
      </Flex>
    </form>
  );
}
