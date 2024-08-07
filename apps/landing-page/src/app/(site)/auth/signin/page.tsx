import { type Metadata } from 'next';
import { type ReactNode } from 'react';
import Signin from '../../../../components/Auth/signin';

export const metadata: Metadata = {
  title: 'Login Page - Solid SaaS Boilerplate',
  description: 'This is Login page for Startup Pro',
  // other metadata
};

function SigninPage(): ReactNode {
  return <Signin />;
}

export default SigninPage;
