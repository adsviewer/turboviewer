import { useFormatter } from 'next-intl';
import { HandCoins } from 'lucide-react';
import { type CurrencyEnum } from '@/graphql/generated/schema-server';

export default function Spend({ spend, currency }: { spend: number; currency: CurrencyEnum }): React.ReactElement {
  const format = useFormatter();
  return (
    <div className="flex flex-row">
      <HandCoins />
      {format.number(spend, { style: 'currency', currency })}
    </div>
  );
}
