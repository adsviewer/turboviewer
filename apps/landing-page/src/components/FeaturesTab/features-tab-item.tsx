import React, { type ReactNode } from 'react';
import Image from 'next/image';
import { type FeatureTab } from '@/types/feature-tab';

function FeaturesTabItem({ featureTab }: { featureTab: FeatureTab }): ReactNode {
  const { title, desc1, desc2, image, imageDark } = featureTab;

  return (
    <div className="flex items-center gap-8 lg:gap-19">
      <div className="md:w-1/2">
        <h2 className="mb-7 text-3xl font-bold text-black dark:text-white xl:text-sectiontitle2">{title}</h2>
        <p className="mb-5">{desc1}</p>
        <p className="w-11/12">{desc2}</p>
      </div>
      <div className="relative mx-auto hidden aspect-[562/366] max-w-[550px] md:block md:w-1/2">
        <Image
          src={image}
          alt={title}
          fill
          className="dark:hidden"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <Image
          src={imageDark}
          alt={title}
          fill
          className="hidden dark:block"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
    </div>
  );
}

export default FeaturesTabItem;
