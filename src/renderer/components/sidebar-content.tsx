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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';

export type ChatsSidebarContent = Array<{
  title: string;
  id: string;
  isActive: boolean;
}>;

export type PromptsSidebarContent = Array<{
  folderName: string;
  isSystemFolder: boolean;
  items: Array<{
    title: string;
    id: string;
    isActive: boolean;
    type: 'user' | 'system';
  }>;
}>;

export function ChatsSidebarContent({ data }: { data: ChatsSidebarContent }) {
  return (
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>All chats</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {data.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton isActive={item.isActive}>
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

export function PromptsSidebarContent({
  data,
}: {
  data: PromptsSidebarContent;
}) {
  return (
    <SidebarContent>
      <SidebarGroup>
        <SidebarMenu>
          {data.map((item) => (
            <Collapsible key={item.folderName} className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton>
                    {item.isSystemFolder ? (
                      <FolderCog className="mr-2" />
                    ) : (
                      <Folder className="mr-2" />
                    )}
                    {item.folderName}
                    <Plus className="ml-auto group-data-[state=open]/collapsible:hidden" />
                    <Minus className="ml-auto group-data-[state=closed]/collapsible:hidden" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((item) => (
                      <SidebarMenuSubItem key={item.id}>
                        <SidebarMenuSubButton isActive={item.isActive}>
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
