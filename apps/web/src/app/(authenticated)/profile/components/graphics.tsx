import React from 'react';
import LottieAnimation from '@/components/misc/lottie-animation';
import profileSettingsAnimation from '../../../../../public/lotties/profile-settings.json';

export default function Graphics(): React.ReactNode {
  return (
    <LottieAnimation
      animationData={profileSettingsAnimation}
      speed={0.5}
      loop
      playAnimation
      customStyles={{
        position: 'absolute',
        top: 50,
        right: 25,
        zIndex: -9999,
        width: '16rem',
        transform: 'rotate(3deg)',
        opacity: 0.2,
      }}
    />
  );
}
