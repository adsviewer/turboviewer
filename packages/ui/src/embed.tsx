import React from 'react';
import { cn } from './tailwind-utils';

type EmbedProps = React.EmbedHTMLAttributes<HTMLEmbedElement>;

export default function Embed({ className, ...props }: EmbedProps): React.ReactElement {
  return <embed title={props.src} className={cn('', className)} {...props} />;
}

Embed.displayName = 'Embed';
