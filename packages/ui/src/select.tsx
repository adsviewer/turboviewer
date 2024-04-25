import { type SelectHTMLAttributes } from 'react';

type Props = SelectHTMLAttributes<HTMLSelectElement>;

export default function Select({ children, ...rest }: Props): React.ReactElement {
  return (
    <select
      className="bg-gray-100 dark:bg-menu-bg my-2 w-28 rounded-md border-gray-300 py-2 text-base text-faint disabled:opacity-50"
      {...rest}
    >
      {children}
    </select>
  );
}
