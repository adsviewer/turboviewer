import { Flex } from '@mantine/core';
import React from 'react';
import VideoCard from './components/video-card';

export default function Introduction(): React.ReactNode {
  return (
    <Flex justify="center" align="center">
      <VideoCard />
    </Flex>
  );
}
