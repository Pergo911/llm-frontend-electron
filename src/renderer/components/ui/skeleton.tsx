import React from 'react';
import { cn } from '@/renderer/utils/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-xl bg-primary/10', className)}
      {...props}
    />
  );
}

export { Skeleton };
