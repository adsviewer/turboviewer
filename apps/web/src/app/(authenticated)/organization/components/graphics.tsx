import React from 'react';
import LottieAnimation from '@/components/misc/lottie-animation';
import peopleConnectedAnimation from '../../../../../public/lotties/people-connected.json';

export default function Graphics(): React.ReactNode {
  return (
    <LottieAnimation
      animationData={peopleConnectedAnimation}
      speed={1}
      loop={false}
      playAnimation
      customStyles={{
        position: 'absolute',
        top: 5,
        right: 20,
        zIndex: -9999,
        width: '20rem',
        transform: 'rotate(2deg)',
        opacity: 0.2,
      }}
    />
  );
}
