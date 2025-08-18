/* eslint-disable no-nested-ternary */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { ResolvedFolder, SaveFileController } from '@/common/types';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { NewModal, NewModalRef } from './modal-new';
import { useSidebar } from './ui/sidebar';

const NewButton = ({
  registerShortcut,
  controller,
  folders,
  sidebarPage,
  disabled,
}: {
  registerShortcut?: boolean;
  controller: SaveFileController;
  folders: ResolvedFolder[];
  sidebarPage?: 'chat' | 'prompt';
  disabled?: boolean;
}) => {
  const newModalRef = useRef<NewModalRef>(null);
  const sidebarOpen = useSidebar().state === 'expanded';
  const navigate = useNavigate();

  const handleAdd = useCallback(async () => {
    if (disabled) return;
    if (sidebarPage === 'chat' && sidebarOpen) {
      const { error, newId } = controller.chats.add('New chat');
      if (error) {
        toast.error(`Error creating chat: ${error}`);
        return;
      }
      navigate(`/c/${newId}`);
    } else {
      newModalRef.current?.promptUser(sidebarPage, sidebarOpen);
    }
  }, [controller.chats, disabled, navigate, sidebarOpen, sidebarPage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleAdd();
      }
    };

    if (registerShortcut) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleAdd, registerShortcut]);

  if (sidebarOpen) {
    // New button in sidebar
    return (
      <>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="default"
              onClick={handleAdd}
              className="hover:bg-background-acrylic-hover h-12"
              disabled={disabled}
              aria-disabled={disabled}
            >
              <Plus className="h-4 w-4 flex-shrink-0" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {sidebarPage === 'chat' ? 'New Chat' : 'New Prompt'}
          </TooltipContent>
        </Tooltip>
        <NewModal ref={newModalRef} controller={controller} folders={folders} />
      </>
    );
  }

  // New button on top bar
  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAdd}
            disabled={disabled}
            aria-disabled={disabled}
            className="hover:bg-background-acrylic-hover"
          >
            <Plus className="h-4 w-4 flex-shrink-0" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>New</TooltipContent>
      </Tooltip>
      <NewModal ref={newModalRef} controller={controller} folders={folders} />
    </>
  );
};

export default NewButton;
