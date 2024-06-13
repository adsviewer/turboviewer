import React from 'react';
import { Title, Text } from '@mantine/core';
import { getTranslations } from 'next-intl/server';
import { getUserDetails } from '../actions';
import UserSettings from './components/user-settings';

export default async function Profile(): Promise<React.ReactNode> {
  const t = await getTranslations('profile');
  const userDetails = await getUserDetails();

  return (
    <>
      <Title mb="md">{t('title')}</Title>
      <Text mb="xl">{t('description')}</Text>
      <UserSettings userDetails={userDetails} />
    </>
  );
}
