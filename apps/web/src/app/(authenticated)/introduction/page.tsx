'use client';

import { Flex, Grid } from '@mantine/core';
import React from 'react';
import { useTranslations } from 'next-intl';
import LottieAnimation from '@/components/misc/lottie-animation';
import wavingPeopleAnimation from '../../../../public/lotties/waving-people.json';
import VideoCard from './components/video-card';

export default function Introduction(): React.ReactNode {
  const tIntroduction = useTranslations('introduction');

  return (
    <Flex justify="center" align="center" gap="md">
      <LottieAnimation
        animationData={wavingPeopleAnimation}
        speed={0.5}
        loop
        playAnimation
        customStyles={{
          position: 'absolute',
          top: 320,
          left: 220,
          zIndex: -9999,
          width: '35rem',
          transform: 'rotate(-5deg)',
        }}
      />

      <Grid justify="center" align="center" gutter="lg">
        <Grid.Col span={{ base: 12, lg: 6 }}>
          <VideoCard
            title={tIntroduction('welcomeVideoTitle')}
            description={tIntroduction('welcomeVideoDescription')}
            videoSrc="/videos/onboarding-video.mp4"
          />
        </Grid.Col>
      </Grid>
    </Flex>
  );
}
