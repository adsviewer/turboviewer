'use client';

import { Title, Text, Button, Container, Group } from '@mantine/core';
import { useTranslations } from 'next-intl';
// import { Illustration } from '@/components/misc/server-error-page/illustration';
import classes from './server-error-page.module.scss';

export default function ServerErrorPage(): React.ReactNode {
  const t = useTranslations('errors');
  return (
    <Container className={classes.root}>
      <div className={classes.inner}>
        {/*<Illustration className={classes.image} />*/}
        <div className={classes.content}>
          <Title className={classes.title}>{t('errorPageTitle')}</Title>
          <Text c="dimmed" size="lg" ta="center" className={classes.description}>
            {t('errorPageDescription')}
          </Text>
          <Group justify="center">
            <Button
              size="md"
              onClick={() => {
                window.location.reload();
              }}
            >
              {t('refreshHint')}
            </Button>
          </Group>
        </div>
      </div>
    </Container>
  );
}
