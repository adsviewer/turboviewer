import { useTranslations } from 'next-intl';
import OrderSelect from '@/components/filters/order-select';
import { type OrderType } from '@/app/[locale]/(logged-in)/insights/query-string-util';

export function Order({ order }: { order: OrderType }): React.ReactElement {
  const t = useTranslations('filters');
  const types: OrderType[] = ['asc', 'desc'];
  return (
    <OrderSelect order={order}>
      {types.map((value) => (
        <option key={value} value={value}>
          {t('orderDropDown', { value })}
        </option>
      ))}
    </OrderSelect>
  );
}
