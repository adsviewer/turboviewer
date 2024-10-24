'use client';

import { Flex, Grid } from '@mantine/core';
import React, { useEffect } from 'react';
import { logger } from '@repo/logger';
import LottieAnimation from '@/components/misc/lottie-animation';
import { Milestones } from '@/graphql/generated/schema-server';
import wavingPeopleAnimation from '../../../../public/lotties/waving-people.json';
import { removeUserMilestoneAndGetJWT } from '../actions';
import VideoCard from './components/video-card';

export default function Introduction(): React.ReactNode {
  useEffect(() => {
    // On page load, remove the onboarding milestone from the user
    // so that they can navigate the rest of the app
    void removeUserMilestoneAndGetJWT({
      milestone: Milestones.Onboarding,
    })
      .then((res) => {
        if (!res.success) {
          logger.error(res.error);
        }
      })
      .catch((err: unknown) => {
        logger.error(err);
      });
  }, []);

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
            title="Welcome to AdsViewer!"
            description="In order to use AdsViewer you need to set up your integrations and set up your organization."
            videoSrc="/videos/onboarding-video.mp4"
          />
        </Grid.Col>
      </Grid>
    </Flex>
  );
}
