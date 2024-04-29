import { useTranslations } from 'next-intl';
import { type OrderType } from '@/app/[locale]/(logged-in)/insights/query-string-util';
import SearchParamsSelect from '@/components/filters/search-params-select';

export function Order({ order }: { order: OrderType }): React.ReactElement {
  const t = useTranslations('filters');
  const types: OrderType[] = ['asc', 'desc'];
  return (
    <SearchParamsSelect defaultValue={order} searchParamKey="order">
      {types.map((value) => (
        <option key={value} value={value}>
          {t('orderDropDown', { value })}
        </option>
      ))}
    </SearchParamsSelect>
  );
}
