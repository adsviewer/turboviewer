import * as React from 'react';
import { cn } from './tailwind-utils';

const Embed = React.forwardRef<HTMLEmbedElement, React.EmbedHTMLAttributes<HTMLEmbedElement>>(
  ({ className, ...props }, ref) => {
    return <embed title={props.src} className={cn('', className)} ref={ref} {...props} />;
  },
);
Embed.displayName = 'Embed';

export { Embed };
