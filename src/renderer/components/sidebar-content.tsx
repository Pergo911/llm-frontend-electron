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
import { NavLink } from 'react-router-dom';
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
            {data.length === 0 && (
              <div className="text-sm text-gray-500 text-center">No chats.</div>
            )}
            {data.map((item) => (
              <SidebarMenuItem key={item.id}>
                <NavLink to={`/c/${item.id}`}>
                  {({ isActive }) => {
                    return (
                      <SidebarMenuButton isActive={isActive}>
                        <MessageCircle className="mr-2" />
                        {item.title}
                      </SidebarMenuButton>
                    );
                  }}
                </NavLink>
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
          {data.length === 0 && (
            <div className="text-sm text-gray-500 text-center">No prompts.</div>
          )}
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
                    {item.items.length === 0 && (
                      <div className="text-sm text-gray-500 text-center">
                        Empty group.
                      </div>
                    )}
                    {item.items.map((item) => (
                      <NavLink key={item.id} to={`/p/${item.id}`}>
                        {({ isActive }) => {
                          return (
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton isActive={isActive}>
                                {item.type === 'user' ? (
                                  <Notebook className="mr-2" />
                                ) : (
                                  <SquareTerminal className="mr-2" />
                                )}
                                {item.title}
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        }}
                      </NavLink>
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
