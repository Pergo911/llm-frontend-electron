import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuAction,
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
  MoreHorizontal,
  Trash2,
  Edit2,
} from 'lucide-react';
import { ChatEntry, PromptEntry } from '@/common/types';
import { NavLink } from 'react-router-dom';
import { useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useRefresh } from '../hooks/use-refresh';
import { RenameModal, RenameModalRef } from './modal-rename';

const TOOLTIP_DELAY = 700;

export function ChatsSidebarContent({ data }: { data: ChatEntry[] }) {
  const refresh = useRefresh();
  const renameModalRef = useRef<RenameModalRef>(null);

  const handleDelete = useCallback(
    async (id: string) => {
      const { error } = await window.electron.fileOperations.remove('chat', id);

      if (error) {
        toast.error(`Error deleting chat: ${error}`);
      } else {
        refresh();
      }
    },
    [refresh],
  );

  const handleDeleteClick = useCallback(
    (id: string) => () => {
      handleDelete(id);
    },
    [handleDelete],
  );

  const handleRename = useCallback(
    async (id: string, title: string) => {
      if (!renameModalRef.current) {
        toast.error('Rename modal not found.');
        return;
      }

      const newName = await renameModalRef.current.promptUser('chat', title);

      if (!newName) {
        return;
      }

      const { chat, error } =
        await window.electron.fileOperations.getChatById(id);

      if (error || !chat) {
        toast.error(`Error getting chat: ${error}`);
        return;
      }

      chat.title = newName;

      const { error: writeError } =
        await window.electron.fileOperations.writeChat(chat);

      if (writeError) {
        toast.error(`Error writing chat: ${writeError}`);
      } else {
        refresh();
      }
    },
    [refresh],
  );

  const handleRenameClick = useCallback(
    (id: string, title: string) => () => {
      handleRename(id, title);
    },
    [handleRename],
  );

  return (
    <>
      <SidebarContent>
        <SidebarGroup>
          {/* <SidebarGroupLabel>All chats</SidebarGroupLabel> */}
          <SidebarGroupContent>
            <SidebarMenu>
              {data.length === 0 && (
                <div className="text-center text-sm text-gray-500">
                  No chats.
                </div>
              )}
              {data.map((item) => (
                <SidebarMenuItem
                  key={item.id}
                  className="group/sidebarmenuitem"
                >
                  <Tooltip delayDuration={TOOLTIP_DELAY}>
                    <TooltipTrigger asChild className="w-full">
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
                    </TooltipTrigger>
                    <TooltipContent side="right">{item.title}</TooltipContent>
                  </Tooltip>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuAction className="invisible group-focus-within/sidebarmenuitem:visible group-hover/sidebarmenuitem:visible">
                        <MoreHorizontal className="h-4 w-4" />
                      </SidebarMenuAction>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="start">
                      <DropdownMenuItem
                        onClick={handleRenameClick(item.id, item.title)}
                      >
                        <Edit2 className="mr-2 h-4 w-4" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-500 hover:bg-destructive hover:text-destructive-foreground focus:bg-destructive focus:text-destructive-foreground"
                        onClick={handleDeleteClick(item.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <RenameModal ref={renameModalRef} />
    </>
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
                <Tooltip delayDuration={TOOLTIP_DELAY}>
                  <TooltipTrigger className="w-full" asChild>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton>
                        <Folder className="mr-2" />
                        <span className="truncate">{item.title}</span>
                        <Plus className="ml-auto group-data-[state=open]/collapsible:hidden" />
                        <Minus className="ml-auto group-data-[state=closed]/collapsible:hidden" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.title}</TooltipContent>
                </Tooltip>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.length === 0 && (
                      <div className="text-center text-sm text-gray-500">
                        Empty group.
                      </div>
                    )}
                    {item.items.map((item) => (
                      <Tooltip key={item.id} delayDuration={TOOLTIP_DELAY}>
                        <TooltipTrigger className="w-full" asChild>
                          <NavLink to={`/p/${item.id}`}>
                            {({ isActive }) => {
                              return (
                                <SidebarMenuSubItem>
                                  <SidebarMenuSubButton isActive={isActive}>
                                    {item.type === 'user' ? (
                                      <Notebook className="mr-2" />
                                    ) : (
                                      <SquareTerminal className="mr-2" />
                                    )}
                                    <span className="truncate">
                                      {item.title}
                                    </span>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            }}
                          </NavLink>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          {item.title}
                        </TooltipContent>
                      </Tooltip>
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
