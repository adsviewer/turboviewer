import { CalendarDays, Eye } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { IFrame } from '@repo/ui/iframe';
import type { UnwrapArray } from '@/util/types';
import { CurrencyEnum, type InsightsQuery } from '@/graphql/generated/schema-server';
import Spend from '@/app/[locale]/(logged-in)/insights/spend';
import Device from '@/app/[locale]/(logged-in)/insights/device';
import Publisher from '@/app/[locale]/(logged-in)/insights/publisher';
import Position from '@/app/[locale]/(logged-in)/insights/position';
import AdName from '@/app/[locale]/(logged-in)/insights/ad-name';

export default function Insight({
  spend,
  date,
  device,
  position,
  publisher,
  impressions,
  adName,
  currency,
  iFrame,
}: UnwrapArray<InsightsQuery['insights']['edges']>): React.ReactElement | null {
  const format = useFormatter();
  const t = useTranslations('insights');
  return (
    <div className="flex flex-col rounded-[12px] border border-gray-600">
      <div className="flex grow gap-2 border-b border-gray-400 p-6">{iFrame ? <IFrame {...iFrame} /> : null}</div>
      <div className="flex flex-row">
        <Spend spend={spend} currency={currency ?? CurrencyEnum.USD} />
        <Eye />
        <div>{format.number(impressions, { style: 'decimal' })}</div>
        {date ? (
          <div className="flex flex-row">
            <CalendarDays />
            <div>{format.dateTime(new Date(date), { month: 'numeric', day: 'numeric' })}</div>
          </div>
        ) : null}
        <Device device={device} />
        <Publisher publisher={publisher} />
      </div>
      <AdName adName={adName} />
      <Position position={position} tooltipPosition={t('tooltipPosition')} />
    </div>
  );
}
