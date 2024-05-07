import Spinner from './spinner';
import { cx } from './tailwind-utils';

export function Fallback({
  height,
  spinnerHeight,
  className,
}: {
  height: number;
  spinnerHeight?: number;
  className?: string;
}): React.ReactNode | null {
  return (
    <div className={cx('flex items-center justify-center', className)} style={{ height: `${String(height)}px` }}>
      <Spinner height={spinnerHeight} />
    </div>
  );
}
