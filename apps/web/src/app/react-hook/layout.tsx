import { type JSX } from 'react';

export default function ReactHookLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return <div>{children}</div>;
}
