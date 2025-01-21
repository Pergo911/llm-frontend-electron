import React from 'react';
import { SidebarTrigger } from './sidebar';

export default function TitleBar({
  children,
  ...props
}: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className="h-[64px] p-2 bg-sidebar flex align-middle gap-2 draggable"
      {...props}
    >
      <SidebarTrigger className="my-auto" />
      {children}
    </div>
  );
}
