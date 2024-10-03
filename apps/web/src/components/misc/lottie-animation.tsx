'use client';

import React, { useEffect, useRef } from 'react';
import Lottie, { type LottieRefCurrentProps } from 'lottie-react';
import { Container, em } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';

interface PropsType {
  playAnimation: boolean;
  animationData: object;
  loop: boolean;
  speed?: number;
  allowOnMobile?: boolean;
  customStyles?: object;
  fullscreen?: boolean;
  onComplete?: () => void;
}

export default function LottieAnimation(props: PropsType): React.ReactNode {
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const isMobile = useMediaQuery(`(max-width: ${em(750)})`);
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

  useEffect(() => {
    // Set animation speed
    if (lottieRef.current && props.speed) lottieRef.current.setSpeed(props.speed);
  }, [props.speed]);

  if (!props.playAnimation || (!props.allowOnMobile && isMobile)) return;
  return (
    <Container style={props.fullscreen ? fullscreenStyles : (props.customStyles ?? {})}>
      <Lottie
        lottieRef={lottieRef}
        animationData={props.animationData}
        loop={props.loop}
        onComplete={() => {
          if (props.onComplete) props.onComplete();
        }}
      />
    </Container>
  );
}
