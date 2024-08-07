import { type Metadata } from 'next';
import { type ReactNode } from 'react';
import Signup from '@/components/Auth/signup';

export const metadata: Metadata = {
  title: 'Sign Up Page - Solid SaaS Boilerplate',
  description: 'This is Sign Up page for Startup Pro',
  // other metadata
};

export default function Register(): ReactNode {
  return <Signup />;
}
