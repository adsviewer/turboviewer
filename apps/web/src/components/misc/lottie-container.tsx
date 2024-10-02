'use client';

import React from 'react';
import Lottie from 'lottie-react';
import { Container } from '@mantine/core';

interface PropsType {
  animationData: object;
  loop: boolean;
  fullscreen: boolean;
  playAnimation: boolean;
  onComplete: () => void;
}

export default function LottieContainer(props: PropsType): React.ReactNode {
  const fullscreenStyles = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: '100vw',
    height: '100vh',
    zIndex: 9999,
    pointerEvents: 'none' as const,
  };

  if (!props.playAnimation) return;
  return (
    <Container style={props.fullscreen ? fullscreenStyles : {}}>
      <Lottie
        animationData={props.animationData}
        loop={props.loop}
        onComplete={() => {
          props.onComplete();
        }}
      />
    </Container>
  );
}
