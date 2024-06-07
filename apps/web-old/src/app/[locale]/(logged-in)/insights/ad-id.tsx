import React from 'react';
import { urqlClientSdk } from '@/lib/urql/urql-client';
import MultiFilter from '@/components/filters/multi-filter';

export default async function AdId(): Promise<React.ReactElement | null> {
  const ads = (await urqlClientSdk().lastThreeMonthsAds()).lastThreeMonthsAds;
  if (ads.length <= 1) return null;
  return <MultiFilter options={ads.map((a) => ({ value: a.id, label: a.name ?? a.id }))} groupKey="adId" />;
}
