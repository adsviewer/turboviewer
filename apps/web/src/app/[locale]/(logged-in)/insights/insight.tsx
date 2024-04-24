import { CalendarDays, Eye } from 'lucide-react';
import type { UnwrapArray } from '@/util/types';
import type { AdAccountsQuery, InsightsQuery } from '@/graphql/generated/schema-server';
import Spend from '@/app/[locale]/(logged-in)/insights/spend';

export default function Insight({
  spend,
  date,
  device,
  position,
  publisher,
  impressions,
  account,
}: UnwrapArray<InsightsQuery['insights']['edges']> & {
  account: UnwrapArray<UnwrapArray<AdAccountsQuery['integrations']>['adAccounts']>;
}): React.ReactElement | null {
  return (
    <div className="flex flex-col rounded-[12px] border border-gray-600">
      <div className="flex grow gap-2 border-b border-gray-400 p-6">iFrame Placeholder</div>
      <div className="flex flex-row">
        <Spend spend={spend} currency={account.currency} />
        <Eye />
        <div>{impressions}</div>
        {date ? (
          <div className="flex flex-row">
            <CalendarDays />
            <div>{String(date)}</div>
          </div>
        ) : null}
      </div>
      {device ? ` device: ${device}.` : ''}
      {position ? ` position: ${position}.` : ''}
      {publisher ? ` publisher: ${publisher}.` : ''}
    </div>
  );
}
