import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/renderer/components/ui/sidebar';
import {
  Minus,
  Plus,
  MessageCircle,
  Notebook,
  Folder,
  SquareTerminal,
  FolderCog,
} from 'lucide-react';
import { ChatEntry, PromptEntry } from '@/common/types';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';

export function ChatsSidebarContent({ data }: { data: ChatEntry[] }) {
  return (
    <SidebarContent>
      <SidebarGroup>
        {/* <SidebarGroupLabel>All chats</SidebarGroupLabel> */}
        <SidebarGroupContent>
          <SidebarMenu>
            {data.map((item) => (
              <SidebarMenuItem key={item.id}>
                {/* TODO: Add active state */}
                <SidebarMenuButton isActive={false}>
                  <MessageCircle className="mr-2" />
                  {item.title}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  );
}

export function PromptsSidebarContent({ data }: { data: PromptEntry[] }) {
  return (
    <SidebarContent>
      <SidebarGroup>
        <SidebarMenu>
          {data.map((item) => (
            <Collapsible key={item.title} className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton>
                    <Folder className="mr-2" />
                    {item.title}
                    <Plus className="ml-auto group-data-[state=open]/collapsible:hidden" />
                    <Minus className="ml-auto group-data-[state=closed]/collapsible:hidden" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((item) => (
                      <SidebarMenuSubItem key={item.id}>
                        {/* TODO: Add active state */}
                        <SidebarMenuSubButton isActive={false}>
                          {item.type === 'user' ? (
                            <Notebook className="mr-2" />
                          ) : (
                            <SquareTerminal className="mr-2" />
                          )}
                          {item.title}
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ))}
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  );
}
