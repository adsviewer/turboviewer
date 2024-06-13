import React from 'react';
import { Flex, Title, Text } from '@mantine/core';
import { getTranslations } from 'next-intl/server';
import { getUserDetails } from '../actions';
import { UserInfo } from './components/user-info/user-info';
import EditProfileForm from './components/edit-profile-form';

export default async function Profile(): Promise<React.ReactNode> {
  const t = await getTranslations('profile');
  const userDetails = await getUserDetails();

  return (
    <>
      <Title mb="md">{t('title')}</Title>
      <Text mb="xl">{t('description')}</Text>

      <Flex direction="column" gap="md" w="100%">
        <UserInfo userDetails={userDetails} />
        <EditProfileForm userDetails={userDetails} />
      </Flex>
    </>
  );
}
