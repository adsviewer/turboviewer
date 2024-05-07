import * as React from 'react';
import { cn } from './tailwind-utils';

const IFrame = React.forwardRef<HTMLIFrameElement, React.IframeHTMLAttributes<HTMLIFrameElement>>(
  ({ className, ...props }, ref) => {
    return <iframe title={props.title} className={cn('', className)} ref={ref} {...props} />;
  },
);
IFrame.displayName = 'IFrame';

export { IFrame };
