import * as React from 'react';
import { ArrowUpDown, MessageCircle, Notebook } from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/renderer/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export function SidebarToggle({
  callback,
}: {
  callback: (page: 'chat' | 'prompt') => void;
}) {
  const [page, setPage] = React.useState<'chat' | 'prompt'>('chat');

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Tooltip delayDuration={700}>
          <TooltipTrigger asChild>
            <SidebarMenuButton
              aria-label="Swap pages"
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
              <ArrowUpDown className="ml-auto text-muted-foreground transition-transform duration-100 ease-in-out group-hover/button:scale-110 group-hover/button:text-secondary-foreground group-focus/button:text-secondary-foreground group-active/button:translate-y-1" />
            </SidebarMenuButton>
          </TooltipTrigger>
          <TooltipContent>
            Switch to {page === 'prompt' ? 'chats' : 'prompts'}
          </TooltipContent>
        </Tooltip>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
