import { type Metadata } from 'next';
import { type ReactNode } from 'react';
import Hero from '@/components/Hero';
import Brands from '@/components/Brands';
import Feature from '@/components/Features';
import About from '@/components/About';
import FeaturesTab from '@/components/FeaturesTab';
import FunFact from '@/components/FunFact';
import Integration from '@/components/Integration';
import Cta from '@/components/CTA';
import Faq from '@/components/FAQ';
import Pricing from '@/components/Pricing';
import Contact from '@/components/Contact';
import Blog from '@/components/Blog';
import Testimonial from '@/components/Testimonial';

export const metadata: Metadata = {
  title: 'Next.js Starter Template for SaaS Startups - Solid SaaS Boilerplate',
  description: 'This is Home for Solid Pro',
  // other metadata
};

export default function Home(): ReactNode {
  return (
    <main>
      <Hero />
      <Brands />
      <Feature />
      <About />
      <FeaturesTab />
      <FunFact />
      <Integration />
      <Cta />
      <Faq />
      <Testimonial />
      <Pricing />
      <Contact />
      <Blog />
    </main>
  );
}
