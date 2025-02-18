import React, { useCallback, useEffect, useRef } from 'react';
import { Loader2, Plus, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '../utils/utils';
// eslint-disable-next-line import/no-cycle
import { useRefresh } from '../hooks/use-refresh';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { NewModal, NewModalRef } from './modal-new';

const AddRefreshButtonGroup = ({
  registerShortcut,
}: {
  registerShortcut?: boolean;
}) => {
  const refresh = useRefresh();
  const newModalRef = useRef<NewModalRef>(null);

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
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" onClick={refresh}>
            <RefreshCw className="h-4 w-4 flex-shrink-0" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Refresh all</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" onClick={handleAdd}>
            <Plus className="h-4 w-4 flex-shrink-0" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>New</TooltipContent>
      </Tooltip>
      <NewModal ref={newModalRef} />
    </>
  );
};

export default AddRefreshButtonGroup;
