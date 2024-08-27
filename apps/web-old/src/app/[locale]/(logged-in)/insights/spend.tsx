import { useFormatter } from 'next-intl';
import { HandCoins, View } from 'lucide-react';
import { type CurrencyEnum } from '@/graphql/generated/schema-server';

export function Spend({ spend, currency }: { spend: bigint; currency: CurrencyEnum }): React.ReactElement {
  const format = useFormatter();
  return (
    <div className="flex flex-row">
      <HandCoins />
      {format.number(BigInt(Number(spend) / 100), { style: 'currency', currency })}
    </div>
  );
}

export function Cpm({ spend, currency }: { spend: bigint; currency: CurrencyEnum }): React.ReactElement {
  const format = useFormatter();
  return (
    <div className="flex flex-row">
      <View />
      {format.number(BigInt(Number(spend) / 100), { style: 'currency', currency })}
    </div>
  );
}
