import Spinner from './spinner';

export function Fallback({ height }: { height: number }): React.ReactNode | null {
  return (
    <div className="flex items-center justify-center" style={{ height: `${String(height)}px` }}>
      <Spinner />
    </div>
  );
}
