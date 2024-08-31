'use client';
import React, { type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import SectionHeader from '../Common/section-header';
import featuresData from './features-data';
import SingleFeature from './single-feature';

function Feature(): ReactNode {
  const t = useTranslations('features');
  return (
    <>
      {/* <!-- ===== Features Start ===== --> */}
      <section id="features" className="pt-20 lg:pt-25 xl:pt-30">
        <div className="mx-auto max-w-c-1315 px-4 md:px-8 xl:px-0">
          {/* <!-- Section Title Start --> */}
          <SectionHeader
            headerInfo={{
              title: t('title'),
              subtitle: t('subtitle'),
              description: t('description'),
            }}
          />
          {/* <!-- Section Title End --> */}

          <div className="mt-12.5 grid grid-cols-1 gap-7.5 md:grid-cols-2 lg:mt-15 lg:grid-cols-3 xl:mt-20 xl:gap-12.5">
            {/* <!-- Features item Start --> */}

            {featuresData.map((feature) => (
              <SingleFeature feature={feature} key={feature.id} />
            ))}
            {/* <!-- Features item End --> */}
          </div>
        </div>
      </section>

      {/* <!-- ===== Features End ===== --> */}
    </>
  );
}

export default Feature;
