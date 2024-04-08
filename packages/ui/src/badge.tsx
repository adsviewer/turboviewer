'use client';

import { useRef, type HTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';
import { cx } from './tailwind-utils';

type Colors = 'primary' | 'success' | 'warning' | 'error' | 'inactive';
type BadgeType = 'badge-color' | 'badge-modern';

// badge-color
const textColor = {
  primary: 'text-primary-700',
  success: 'text-green-700',
  warning: 'text-orange-700',
  error: 'text-red-700',
  inactive: 'text-gray-700',
};
const borderColor = {
  primary: 'border-primary-200',
  success: 'border-green-200',
  warning: 'border-orange-200',
  error: 'border-red-200',
  inactive: 'border-gray-200',
};
const bgColor = {
  primary: 'bg-primary-50',
  success: 'bg-green-50',
  warning: 'bg-orange-50',
  error: 'bg-red-50',
  inactive: 'bg-gray-50',
};

// dot color
const dotColor = {
  primary: 'bg-primary-400',
  success: 'bg-green-400',
  warning: 'bg-orange-400',
  error: 'bg-red-400',
  inactive: 'bg-gray-400',
};
const dotBorder = {
  primary: 'border-primary-100',
  success: 'border-green-100',
  warning: 'border-orange-100',
  error: 'border-red-100',
  inactive: 'border-gray-100',
};

export function Badge({
  type = 'badge-color',
  color = 'inactive',
  hasDot = false,
  text,
  className,
  truncateClassName,
}: {
  type?: BadgeType;
  color?: Colors;
  hasDot?: boolean | 'outline';
  text: string | null | undefined;
  truncateClassName?: string;
} & HTMLAttributes<HTMLDivElement>): React.ReactElement | null {
  const ref = useRef<HTMLDivElement>(null);

  let truncated = false;
  if (ref.current) {
    truncated = ref.current.offsetWidth < ref.current.scrollWidth;
  }

  return (
    <div
      className={twMerge(
        cx(
          'flex items-center gap-1 whitespace-nowrap rounded border px-2 py-[2px] text-sm font-medium',
          type === 'badge-color' ? textColor[color] : 'text-gray-700',
          type === 'badge-color' ? borderColor[color] : 'border-gray-200',
          type === 'badge-color' ? bgColor[color] : 'bg-white',
          type === 'badge-modern' && 'shadow-sm',
        ),
        truncateClassName,
        className,
      )}
    >
      {hasDot ? <Dot color={color} hasOutline={hasDot === 'outline'} type={type} /> : null}
      <div ref={ref} className="max-w-full truncate cursor-default" title={truncated && text ? text : undefined}>
        {text}
      </div>
    </div>
  );
}

export function Dot({
  size = 'sm',
  type = 'badge-color',
  color,
  hasOutline = false,
}: {
  size?: 'sm' | 'md';
  type?: BadgeType;
  color: Colors;
  hasOutline?: boolean;
}): React.ReactElement | null {
  const handleColor = type === 'badge-color' ? bgColor[color] : 'border-white';
  return (
    <div
      className={cx(
        'rounded-full border-[3px]',
        size === 'sm' && 'h-3 w-3',
        size === 'md' && 'h-3.5 w-3.5',
        hasOutline ? dotBorder[color] : handleColor,
        dotColor[color],
      )}
    />
  );
}
