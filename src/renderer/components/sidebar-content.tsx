import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
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
              <div className="text-center text-sm text-gray-500">No chats.</div>
            )}
            {data.map((item) => (
              <SidebarMenuItem key={item.id}>
                <NavLink to={`/c/${item.id}`}>
                  {({ isActive }) => {
                    return (
                      <SidebarMenuButton isActive={isActive} asChild>
                        <div className="flex">
                          <MessageCircle className="h-4 w-4" />
                          <span className="truncate">{item.title}</span>
                        </div>
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
            <div className="text-center text-sm text-gray-500">No prompts.</div>
          )}
          {data.map((item) => (
            <Collapsible key={item.title} className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton>
                    <Folder className="mr-2" />
                    <span className="truncate">{item.title}</span>
                    <Plus className="ml-auto group-data-[state=open]/collapsible:hidden" />
                    <Minus className="ml-auto group-data-[state=closed]/collapsible:hidden" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.length === 0 && (
                      <div className="text-center text-sm text-gray-500">
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
                                <span className="truncate">{item.title}</span>
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
