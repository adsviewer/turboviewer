import React from 'react';
import LottieAnimation from '@/components/misc/lottie-animation';
import nodesGraphAnimation from '../../../../../public/lotties/nodes-graph.json';

export default function Graphics(): React.ReactNode {
  return (
    <>
      <LottieAnimation
        animationData={nodesGraphAnimation}
        speed={0.3}
        loop
        playAnimation
        customStyles={{
          position: 'absolute',
          top: 10,
          right: 200,
          zIndex: -9999,
          width: '18rem',
          transform: 'rotate(0deg)',
          opacity: 0.08,
        }}
      />
      <LottieAnimation
        animationData={nodesGraphAnimation}
        speed={0.3}
        loop
        playAnimation
        customStyles={{
          position: 'absolute',
          top: 550,
          right: 300,
          zIndex: -9999,
          width: '19rem',
          transform: 'rotate(-155deg)',
          opacity: 0.08,
        }}
      />
      <LottieAnimation
        animationData={nodesGraphAnimation}
        speed={0.3}
        loop
        playAnimation
        customStyles={{
          position: 'absolute',
          top: 750,
          right: 750,
          zIndex: -9999,
          width: '19rem',
          transform: 'rotate(-155deg)',
          opacity: 0.08,
        }}
      />
    </>
  );
}
