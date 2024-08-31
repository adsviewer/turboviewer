'use client';
import { Toaster } from 'react-hot-toast';
import { type ReactNode } from 'react';

function ToasterContext(): ReactNode {
  return (
    <div>
      <Toaster position="top-center" reverseOrder={false} toastOptions={{ style: { margin: '60px' } }} />
    </div>
  );
}

export default ToasterContext;
