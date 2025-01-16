import * as React from 'react';
import { ChevronsUpDown, MessageCircle, Notebook } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/renderer/components/ui/dropdown-menu';
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                {page === 'chat' ? <MessageCircle /> : <Notebook />}
              </div>
              <div className="grid flex-1 text-left text-lg font-bold leading-tight">
                {page === 'chat' ? 'Chats' : 'Prompts'}
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="end"
            side="right"
            sideOffset={4}
          >
            <DropdownMenuItem
              onClick={() => {
                callback('chat');
                setPage('chat');
              }}
              className="gap-2 p-2"
            >
              <MessageCircle />
              Chats
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                callback('prompt');
                setPage('prompt');
              }}
              className="gap-2 p-2"
            >
              <Notebook />
              Prompts
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
