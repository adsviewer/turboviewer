import React from 'react';
import LottieAnimation from '@/components/misc/lottie-animation';
import nodesGraphAnimation from '../../../../../public/lotties/nodes-graph.json';

export default function Graphics(): React.ReactNode {
  return (
    <>
      <LottieAnimation
        animationData={nodesGraphAnimation}
        speed={0.2}
        loop
        playAnimation
        customStyles={{
          position: 'absolute',
          top: -40,
          right: 34,
          zIndex: -9999,
          width: '18rem',
          opacity: 0.05,
        }}
      />
      <LottieAnimation
        animationData={nodesGraphAnimation}
        speed={0.3}
        loop
        playAnimation
        customStyles={{
          position: 'absolute',
          top: 0,
          right: 170,
          zIndex: -9999,
          width: '19rem',
          transform: 'rotate(-140deg)',
          opacity: 0.08,
        }}
      />
    </>
  );
}
