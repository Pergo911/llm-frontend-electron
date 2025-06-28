import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { ResolvedFolder, SaveFileController } from '@/common/types';
import { Button } from './ui/button';
import { cn } from '../utils/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { NewModal, NewModalRef } from './modal-new';
import { useSidebar } from './ui/sidebar';

const NewButton = ({
  registerShortcut,
  controller,
  folders,
}: {
  registerShortcut?: boolean;
  controller: SaveFileController;
  folders: ResolvedFolder[];
}) => {
  const newModalRef = useRef<NewModalRef>(null);
  const sidebarOpen = useSidebar().state === 'expanded';
  const [tooltipOpen, setTooptipOpen] = useState<boolean>(false);

  const handleAdd = useCallback(() => {
    newModalRef.current?.promptUser();
  }, []);

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

  return (
    <>
      <Tooltip
        open={tooltipOpen}
        onOpenChange={(v) => {
          if (sidebarOpen) return;
          setTooptipOpen(v);
        }}
      >
        <TooltipTrigger asChild>
          <Button
            variant={
              cn(sidebarOpen ? 'default' : 'ghost') as 'default' | 'ghost'
            }
            size="sm"
            onClick={handleAdd}
          >
            <Plus className="h-4 w-4 flex-shrink-0" />
            {sidebarOpen && 'New'}
          </Button>
        </TooltipTrigger>
        <TooltipContent>New</TooltipContent>
      </Tooltip>
      <NewModal ref={newModalRef} controller={controller} folders={folders} />
    </>
  );
};

export default NewButton;
