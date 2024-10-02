'use client';

import React from 'react';
import Lottie from 'lottie-react';

interface PropsType {
  loop: boolean;
  autoplay: boolean;
  animationData: object;
}

export default function LottieContainer(props: PropsType): React.ReactNode {
  return <Lottie animationData={props.animationData} loop={props.loop} autoPlay={props.autoplay} />;
}
