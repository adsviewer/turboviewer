import { type SelectHTMLAttributes } from 'react';
import { cx } from './tailwind-utils';

type Props = SelectHTMLAttributes<HTMLSelectElement>;

export default function Select({ children, ...rest }: Props): React.ReactElement {
  return (
    <select
      {...rest}
      className={cx(
        'bg-gray-100 dark:bg-menu-bg mr-3 rounded-md border-gray-300 py-1.5 text-base text-faint disabled:opacity-50',
        rest.className,
      )}
    >
      {children}
    </select>
  );
}
