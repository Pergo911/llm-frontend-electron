import * as React from 'react';
import { ArrowRightLeft, MessageCircle, Notebook } from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/renderer/components/ui/sidebar';

export function SidebarToggle({
  callback,
}: {
  callback: (page: 'chat' | 'prompt') => void;
}) {
  const [page, setPage] = React.useState<'chat' | 'prompt'>('chat');

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          aria-label="Swap pages"
          title="Swap pages"
          className="group/button"
          size="lg"
          onClick={() => {
            const p = page === 'chat' ? 'prompt' : 'chat';
            setPage(p);
            callback(p);
          }}
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            {page === 'chat' ? <MessageCircle /> : <Notebook />}
          </div>
          <div className="grid flex-1 text-left text-lg font-bold leading-tight">
            {page === 'chat' ? 'Chats' : 'Prompts'}
          </div>
          <ArrowRightLeft className="ml-auto text-muted-foreground transition-transform duration-100 ease-in-out group-hover/button:-translate-x-1 group-hover/button:text-secondary-foreground group-focus/button:text-secondary-foreground group-active/button:translate-x-1" />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
