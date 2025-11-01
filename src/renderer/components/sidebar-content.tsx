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
  Layers2,
  Tag,
} from 'lucide-react';
import {
  Chat,
  ResolvedChat,
  Folder as FolderType,
  ResolvedFolder,
  SaveFileController,
} from '@/common/types';
import { NavLink, useNavigate } from 'react-router-dom';
import React, { useCallback, useRef } from 'react';
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
import { RenameModal, RenameModalRef } from './modal-rename';
import { Button } from './ui/button';
import { DeleteModal, DeleteModalRef } from './modal-delete';
import { cn } from '../utils/utils';

const TOOLTIP_DELAY = 700;

export function ChatsSidebarContent({
  chats,
  controller,
  disabled,
}: {
  chats: ResolvedChat[];
  controller: SaveFileController;
  disabled?: boolean;
}) {
  const navigate = useNavigate();
  const handleNavClick = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) {
        e.preventDefault();
        e.stopPropagation();
        toast.warning("Can't navigate while generating.");
      }
    },
    [disabled],
  );
  const renameModalRef = useRef<RenameModalRef>(null);
  const deleteModalRef = useRef<DeleteModalRef>(null);

  const handleDelete = useCallback(
    async (id: string) => {
      if (disabled) return;
      if (!deleteModalRef.current) {
        toast.error('Delete modal not found.');
        return;
      }

      const confirmed = await deleteModalRef.current.promptUser();

      if (!confirmed) {
        return;
      }

      const { error } = controller.chats.delete(id);
      if (error) toast.error(error);
    },
    [controller.chats, disabled],
  );

  const handleDeleteClick = useCallback(
    (id: string) => () => {
      handleDelete(id);
    },
    [handleDelete],
  );

  const handleRename = useCallback(
    async (id: string, title: string) => {
      if (disabled) return;
      if (!renameModalRef.current) {
        toast.error('Rename modal not found.');
        return;
      }

      const newName = await renameModalRef.current.promptUser('chat', title);

      if (!newName) {
        return;
      }

      const { error } = controller.chats.rename(id, newName);
      if (error) toast.error(error);
    },
    [controller.chats, disabled],
  );

  const handleRenameClick = useCallback(
    (id: string, title: string) => () => {
      handleRename(id, title);
    },
    [handleRename],
  );

  const handleCopyID = useCallback(
    (id: string) => {
      if (disabled) return;
      navigator.clipboard.writeText(id);
      toast.success('ID copied');
    },
    [disabled],
  );

  const handleCopyIDClick = useCallback(
    (id: string) => () => {
      handleCopyID(id);
    },
    [handleCopyID],
  );

  const handleDuplicate = useCallback(
    (id: string) => {
      if (disabled) return;
      const { error, newId } = controller.chats.duplicate(id);

      if (error) {
        toast.error(`Error duplicating chat: ${error}`);
      } else {
        navigate(`/c/${newId}`);
      }
    },
    [controller.chats, navigate, disabled],
  );

  const handleDuplicateClick = useCallback(
    (id: string) => () => {
      handleDuplicate(id);
    },
    [handleDuplicate],
  );

  return (
    <>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {chats.length === 0 && (
                <div className="text-center text-sm text-muted-foreground">
                  No chats.
                </div>
              )}
              {chats.map((item) => (
                <SidebarMenuItem
                  key={item.id}
                  className="group/sidebarmenuitem"
                >
                  <Tooltip delayDuration={TOOLTIP_DELAY}>
                    <TooltipTrigger asChild className="w-full">
                      <NavLink to={`/c/${item.id}`} onClick={handleNavClick}>
                        {({ isActive }) => {
                          return (
                            <SidebarMenuButton isActive={isActive} asChild>
                              <div className="flex">
                                {/* <MessageCircle className="h-4 w-4" /> */}
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
                      <SidebarMenuAction
                        className={cn(
                          'invisible group-focus-within/sidebarmenuitem:visible group-hover/sidebarmenuitem:visible',
                          disabled && 'pointer-events-none hidden',
                        )}
                        disabled={disabled}
                        aria-disabled={disabled}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </SidebarMenuAction>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="start">
                      <DropdownMenuItem
                        onClick={handleRenameClick(item.id, item.title)}
                        disabled={disabled}
                      >
                        <Edit2 className="mr-2 h-4 w-4" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleDuplicateClick(item.id)}
                        disabled={disabled}
                      >
                        <Layers2 className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleCopyIDClick(item.id)}
                        disabled={disabled}
                      >
                        <Tag className="mr-2 h-4 w-4" />
                        Copy ID
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-500 hover:bg-destructive hover:text-destructive-foreground focus:bg-destructive focus:text-destructive-foreground"
                        onClick={handleDeleteClick(item.id)}
                        disabled={disabled}
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
      <DeleteModal ref={deleteModalRef} />
    </>
  );
}

export function PromptsSidebarContent({
  folders,
  controller,
  disabled,
}: {
  folders: ResolvedFolder[];
  controller: SaveFileController;
  disabled?: boolean;
}) {
  const navigate = useNavigate();
  const handleNavClick = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) {
        e.preventDefault();
        e.stopPropagation();
        toast.warning("Can't navigate while generating.");
      }
    },
    [disabled],
  );
  const renameModalRef = useRef<RenameModalRef>(null);
  const deleteModalRef = useRef<DeleteModalRef>(null);

  const handleDelete = useCallback(
    async (type: 'prompt' | 'folder', id: string) => {
      if (disabled) return;
      if (!deleteModalRef.current) {
        toast.error('Delete modal not found.');
        return;
      }

      const confirmed = await deleteModalRef.current.promptUser();

      if (!confirmed) {
        return;
      }

      if (type === 'prompt') {
        const { error } = controller.prompts.delete(id);
        if (error) toast.error(error);
      } else {
        const { error } = controller.folders.delete(id);
        if (error) toast.error(error);
      }
    },
    [controller.folders, controller.prompts, disabled],
  );

  const handleDeleteClick = useCallback(
    (type: 'prompt' | 'folder', id: string) => () => {
      handleDelete(type, id);
    },
    [handleDelete],
  );

  const handleRename = useCallback(
    async (type: 'prompt' | 'folder', id: string, title: string) => {
      if (disabled) return;
      if (!renameModalRef.current) {
        toast.error('Rename modal not found.');
        return;
      }

      const newName = await renameModalRef.current.promptUser(type, title);

      if (!newName) {
        return;
      }

      if (type === 'prompt') {
        const { error } = controller.prompts.rename(id, newName);
        if (error) toast.error(error);
      } else {
        const { error } = controller.folders.rename(id, newName);
        if (error) toast.error(error);
      }
    },
    [controller.folders, controller.prompts, disabled],
  );

  const handleRenameClick = useCallback(
    (type: 'prompt' | 'folder', id: string, title: string) => () => {
      handleRename(type, id, title);
    },
    [handleRename],
  );

  const handleCopyID = useCallback(
    (id: string) => {
      if (disabled) return;
      navigator.clipboard.writeText(id);
      toast.success('ID copied');
    },
    [disabled],
  );

  const handleCopyIDClick = useCallback(
    (id: string) => () => {
      handleCopyID(id);
    },
    [handleCopyID],
  );

  const handleDuplicate = useCallback(
    (id: string) => {
      if (disabled) return;
      const { error, newId } = controller.prompts.duplicate(id);

      if (error) {
        toast.error(`Error duplicating prompt: ${error}`);
      } else {
        navigate(`/p/${newId}`);
      }
    },
    [controller.prompts, navigate, disabled],
  );

  const handleDuplicateClick = useCallback(
    (id: string) => () => {
      handleDuplicate(id);
    },
    [handleDuplicate],
  );

  return (
    <SidebarContent>
      <SidebarGroup>
        <SidebarMenu>
          {folders.length === 0 && (
            <div className="text-center text-sm text-muted-foreground">
              No prompts.
            </div>
          )}
          {folders.map((folder) => (
            <Collapsible key={folder.name} className="group/collapsible">
              <SidebarMenuItem className="group/sidebarmenuitem">
                <Tooltip delayDuration={TOOLTIP_DELAY}>
                  <TooltipTrigger className="w-full" asChild>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton>
                        <Folder className="mr-2" />
                        <span className="truncate">{folder.name}</span>
                        <Plus className="ml-auto group-data-[state=open]/collapsible:hidden" />
                        <Minus className="ml-auto group-data-[state=closed]/collapsible:hidden" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="right">{folder.name}</TooltipContent>
                </Tooltip>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {folder.items.length === 0 && (
                      <div className="text-center text-sm text-muted-foreground">
                        Empty folder.
                      </div>
                    )}
                    {folder.items.map((prompt) => (
                      <SidebarMenuSubItem
                        key={prompt.id}
                        className="group/sidebarmenusubitem relative"
                      >
                        <Tooltip delayDuration={TOOLTIP_DELAY}>
                          <TooltipTrigger className="w-full" asChild>
                            <NavLink
                              to={`/p/${prompt.id}`}
                              onClick={handleNavClick}
                            >
                              {({ isActive }) => {
                                return (
                                  <SidebarMenuSubButton isActive={isActive}>
                                    {prompt.type === 'user-prompt' ? (
                                      <Notebook className="mr-2" />
                                    ) : (
                                      <SquareTerminal className="mr-2" />
                                    )}
                                    <span className="mr-4 truncate">
                                      {prompt.title}
                                    </span>
                                  </SidebarMenuSubButton>
                                );
                              }}
                            </NavLink>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            {prompt.title}
                          </TooltipContent>
                        </Tooltip>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <SidebarMenuAction
                              className={cn(
                                'invisible group-focus-within/sidebarmenusubitem:visible group-hover/sidebarmenusubitem:visible',
                                disabled && 'pointer-events-none hidden',
                              )}
                              disabled={disabled}
                              aria-disabled={disabled}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </SidebarMenuAction>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent side="right" align="start">
                            <DropdownMenuItem
                              onClick={handleRenameClick(
                                'prompt',
                                prompt.id,
                                prompt.title,
                              )}
                              disabled={disabled}
                            >
                              <Edit2 className="mr-2 h-4 w-4" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={handleDuplicateClick(prompt.id)}
                              disabled={disabled}
                            >
                              <Layers2 className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={handleCopyIDClick(prompt.id)}
                              disabled={disabled}
                            >
                              <Tag className="mr-2 h-4 w-4" />
                              Copy ID
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-500 hover:bg-destructive hover:text-destructive-foreground focus:bg-destructive focus:text-destructive-foreground"
                              onClick={handleDeleteClick('prompt', prompt.id)}
                              disabled={disabled}
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
                    <SidebarMenuAction
                      className={cn(
                        'invisible group-focus-within/sidebarmenuitem:visible group-hover/sidebarmenuitem:visible',
                        disabled && 'pointer-events-none hidden',
                      )}
                      disabled={disabled}
                      aria-disabled={disabled}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </SidebarMenuAction>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="start">
                    <DropdownMenuItem
                      onClick={handleRenameClick(
                        'folder',
                        folder.id,
                        folder.name,
                      )}
                      disabled={disabled}
                    >
                      <Edit2 className="mr-2 h-4 w-4" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleCopyIDClick(folder.id)}
                      disabled={disabled}
                    >
                      <Tag className="mr-2 h-4 w-4" />
                      Copy ID
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-500 hover:bg-destructive hover:text-destructive-foreground focus:bg-destructive focus:text-destructive-foreground"
                      onClick={handleDeleteClick('folder', folder.id)}
                      disabled={disabled}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </Collapsible>
          ))}
        </SidebarMenu>
      </SidebarGroup>
      <RenameModal ref={renameModalRef} />
      <DeleteModal ref={deleteModalRef} />
    </SidebarContent>
  );
}
