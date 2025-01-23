import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SidebarTrigger } from './sidebar';
import { Button } from './button';

export default function TitleBar({
  children,
  ...props
}: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) {
  const navigation = useNavigate();
  const location = useLocation();

  return (
    <div
      className="draggable flex h-[64px] items-center gap-2 bg-sidebar p-2"
      {...props}
    >
      <SidebarTrigger className="my-auto" />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          navigation(-1);
        }}
        disabled={location.key === 'default'}
      >
        <ArrowLeft className="my-auto" />
      </Button>
      {children}
    </div>
  );
}
