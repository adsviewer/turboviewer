import React from 'react';
import LottieAnimation from '@/components/misc/lottie-animation';
import blocksAnimation from '../../../../../public/lotties/blocks.json';

export default function Graphics(): React.ReactNode {
  return (
    <LottieAnimation
      animationData={blocksAnimation}
      speed={0.5}
      loop
      playAnimation
      customStyles={{
        position: 'absolute',
        top: 20,
        right: 34,
        zIndex: -9999,
        width: '18rem',
        transform: 'rotate(-5deg)',
        opacity: 0.2,
      }}
    />
  );
}
