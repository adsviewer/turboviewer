'use client';
import type { JSX } from 'react';
import { useMeQuery } from '@/graphql/generated/schema-client';

export function UserProfile(): JSX.Element {
  const [{ data, error }] = useMeQuery();
  if (error) {
    return <div>{error.message}</div>;
  }
  return (
    <main>
      <h2>This is rendered as part of SSR</h2>
      <ul>{data ? Object.entries(data.me).map(([key, value]) => <li key={key}>{value}</li>) : null}</ul>
    </main>
  );
}
