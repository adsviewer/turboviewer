import { type Metadata } from 'next';
import { type ReactNode } from 'react';
import Hero from '@/components/Hero';
import Brands from '@/components/Brands';
import Feature from '@/components/Features';
import FeaturesTab from '@/components/FeaturesTab';
import Integration from '@/components/Integration';
import Pricing from '@/components/Pricing';
import Contact from '@/components/Contact';

export const metadata: Metadata = {
  title: 'adsViewer.io - your central hub for viewing your ads online',
  description:
    'This website contains information about adsviewer, a platform used by small and large companies to view their digital advertisements and associated data in an automated way.',
  // other metadata
};

export default function Home(): ReactNode {
  return (
    <main>
      <Hero />
      <Brands />
      <Feature />
      {/* <About /> */}
      <FeaturesTab />
      {/* <FunFact /> */}
      <Integration />
      {/* <Cta /> */}
      {/* <Faq /> */}
      {/* <Testimonial /> */}
      <Pricing />
      <Contact />
      {/* <Blog /> */}
    </main>
  );
}
