import { type DetailedHTMLProps, type InputHTMLAttributes } from 'react';
import { cx } from './tailwind-utils';

type Props = DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;

export default function Checkbox({ children, ...rest }: Props): React.ReactElement {
  return (
    <input type="checkbox" {...rest} className={cx('', rest.className)}>
      {children}
    </input>
  );
}
