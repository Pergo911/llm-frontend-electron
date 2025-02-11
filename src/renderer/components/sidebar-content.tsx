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
  Copy,
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
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useRefresh } from '../hooks/use-refresh';
import { RenameModal, RenameModalRef } from './modal-rename';
import { Button } from './ui/button';

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

  const handleCopyID = useCallback((id: string) => {
    navigator.clipboard.writeText(id);
  }, []);

  const handleCopyIDClick = useCallback(
    (id: string) => () => {
      handleCopyID(id);
    },
    [handleCopyID],
  );

  return (
    <>
      <SidebarContent>
        <SidebarGroup>
          {/* <SidebarGroupLabel>All chats</SidebarGroupLabel> */}
          <SidebarGroupContent>
            <SidebarMenu>
              {data.length === 0 && (
                <div className="text-center text-sm text-muted-foreground">
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
                      <DropdownMenuItem onClick={handleCopyIDClick(item.id)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy ID
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
  const refresh = useRefresh();
  const renameModalRef = useRef<RenameModalRef>(null);

  const handleDelete = useCallback(
    async (type: 'prompt' | 'folder', id: string) => {
      const { error } = await window.electron.fileOperations.remove(type, id);

      if (error) {
        toast.error(`Error deleting ${type}: ${error}`);
      } else {
        refresh();
      }
    },
    [refresh],
  );

  const handleDeleteClick = useCallback(
    (type: 'prompt' | 'folder', id: string) => () => {
      handleDelete(type, id);
    },
    [handleDelete],
  );

  const handleRename = useCallback(
    async (type: 'prompt' | 'folder', id: string, title: string) => {
      if (!renameModalRef.current) {
        toast.error('Rename modal not found.');
        return;
      }

      const newName = await renameModalRef.current.promptUser(type, title);

      if (!newName) {
        return;
      }

      if (type === 'prompt') {
        const { prompt, error } =
          await window.electron.fileOperations.getPromptById(id);

        if (error || !prompt) {
          toast.error(`Error getting prompt: ${error}`);
          return;
        }

        prompt.title = newName;

        const { error: writeError } =
          await window.electron.fileOperations.writePrompt(prompt);

        if (writeError) {
          toast.error(`Error writing prompt: ${writeError}`);
        } else {
          refresh();
        }
      } else {
        const { folder, error } =
          await window.electron.fileOperations.getFolderById(id);

        if (error || !folder) {
          toast.error(`Error getting folder: ${error}`);
          return;
        }

        folder.title = newName;

        const { error: writeError } =
          await window.electron.fileOperations.writeFolder(folder);

        if (writeError) {
          toast.error(`Error writing folder: ${writeError}`);
        } else {
          refresh();
        }
      }
    },
    [refresh],
  );

  const handleRenameClick = useCallback(
    (type: 'prompt' | 'folder', id: string, title: string) => () => {
      handleRename(type, id, title);
    },
    [handleRename],
  );

  const handleCopyID = useCallback((id: string) => {
    navigator.clipboard.writeText(id);
  }, []);

  const handleCopyIDClick = useCallback(
    (id: string) => () => {
      handleCopyID(id);
    },
    [handleCopyID],
  );

  return (
    <SidebarContent>
      <SidebarGroup>
        <SidebarMenu>
          {data.length === 0 && (
            <div className="text-center text-sm text-muted-foreground">
              No prompts.
            </div>
          )}
          {data.map((item) => (
            <Collapsible key={item.title} className="group/collapsible">
              <SidebarMenuItem className="group/sidebarmenuitem">
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
                      <div className="text-center text-sm text-muted-foreground">
                        Empty folder.
                      </div>
                    )}
                    {item.items.map((item) => (
                      <SidebarMenuSubItem
                        key={item.id}
                        className="group/sidebarmenusubitem relative"
                      >
                        <Tooltip delayDuration={TOOLTIP_DELAY}>
                          <TooltipTrigger className="w-full" asChild>
                            <NavLink to={`/p/${item.id}`}>
                              {({ isActive }) => {
                                return (
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
                                );
                              }}
                            </NavLink>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            {item.title}
                          </TooltipContent>
                        </Tooltip>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <SidebarMenuAction className="invisible group-focus-within/sidebarmenusubitem:visible group-hover/sidebarmenusubitem:visible">
                              <MoreHorizontal className="h-4 w-4" />
                            </SidebarMenuAction>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent side="right" align="start">
                            <DropdownMenuItem
                              onClick={handleRenameClick(
                                'prompt',
                                item.id,
                                item.title,
                              )}
                            >
                              <Edit2 className="mr-2 h-4 w-4" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={handleCopyIDClick(item.id)}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Copy ID
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-500 hover:bg-destructive hover:text-destructive-foreground focus:bg-destructive focus:text-destructive-foreground"
                              onClick={handleDeleteClick('prompt', item.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuAction className="invisible group-focus-within/sidebarmenuitem:visible group-hover/sidebarmenuitem:visible">
                      <MoreHorizontal className="h-4 w-4" />
                    </SidebarMenuAction>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="start">
                    <DropdownMenuItem
                      onClick={handleRenameClick('folder', item.id, item.title)}
                    >
                      <Edit2 className="mr-2 h-4 w-4" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCopyIDClick(item.id)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy ID
                    </DropdownMenuItem>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="data-[state=open]:bg-desctuctive text-red-500 hover:bg-destructive hover:text-destructive-foreground focus:bg-destructive focus:text-destructive-foreground data-[state=open]:text-destructive-foreground">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent className="w-72 text-xs">
                          <div>
                            <div className="text-lg font-bold">Delete?</div>
                            <div className="text-muted-foreground">
                              Removes all prompts in this folder.
                            </div>
                          </div>
                          <div className="h-4" />
                          <div className="flex w-full justify-end gap-2">
                            <Button
                              variant="destructive"
                              onClick={handleDeleteClick('folder', item.id)}
                            >
                              Confirm
                            </Button>
                          </div>
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </Collapsible>
          ))}
        </SidebarMenu>
      </SidebarGroup>
      <RenameModal ref={renameModalRef} />
    </SidebarContent>
  );
}
