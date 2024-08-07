import React, { type ReactNode } from 'react';
import { type Metadata } from 'next';
import Contact from '@/components/Contact';

export const metadata: Metadata = {
  title: 'Support Page - Solid SaaS Boilerplate',
  description: 'This is Support page for Solid Pro',
  // other metadata
};

function SupportPage(): ReactNode {
  return (
    <div className="pb-20 pt-40">
      <Contact />
    </div>
  );
}

export default SupportPage;
