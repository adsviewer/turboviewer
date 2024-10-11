import { Flex } from '@mantine/core';
import React from 'react';
import LottieAnimation from '@/components/misc/lottie-animation';
import wavingPeopleAnimation from '../../../../public/lotties/waving-people.json';
import VideoCard from './components/video-card';

export default function Introduction(): React.ReactNode {
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
      <VideoCard />
    </Flex>
  );
}
