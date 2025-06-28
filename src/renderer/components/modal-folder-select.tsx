import {
  forwardRef,
  useState,
  useRef,
  useImperativeHandle,
  useEffect,
  useCallback,
} from 'react';
import { Folder, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { ResolvedFolder } from '@/common/types';
import { Button } from './ui/button';
import {
  DialogHeader,
  DialogFooter,
  DialogPortal,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from './ui/dialog';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { isInvalid } from '../utils/utils';

export interface FolderSelectModalRef {
  promptUser: (
    currentFolderId: string,
  ) => Promise<{ folderId: string } | { newFolderName: string } | null>;
}

type FolderSelectModalProps = {
  folders: ResolvedFolder[];
};

const FolderSelectModal = forwardRef<
  FolderSelectModalRef,
  FolderSelectModalProps
>(({ folders }, ref) => {
  const resolveRef =
    useRef<
      (
        returnValue: { folderId: string } | { newFolderName: string } | null,
      ) => void
    >();
  const [isOpen, setIsOpen] = useState(false);

  const [folderId, setFolderId] = useState<string>(''); // Selected folder ID
  const [isNewFolder, setIsNewFolder] = useState(false); // Flag for creating a new folder
  const [newFolderName, setNewFolderName] = useState('New folder'); // Name for the new folder
  const newFolderInputRef = useRef<HTMLInputElement>(null);
  const [newFolderNameInvalid, setNewFolderNameInvalid] = useState(false);

  useEffect(() => {
    setNewFolderNameInvalid(isInvalid(newFolderName));
  }, [newFolderName]);

  const reset = () => {
    setFolderId('');
    setIsNewFolder(false);
    setNewFolderName('New folder');
  };

  useImperativeHandle(ref, () => ({
    promptUser: (currentFolderId: string | null) => {
      reset();

      if (currentFolderId) {
        setFolderId(currentFolderId);
      } else {
        setFolderId(folders.length > 0 ? folders[0].id : '');
      }

      setIsOpen(true);

      return new Promise<
        { folderId: string } | { newFolderName: string } | null
      >((resolve) => {
        resolveRef.current = resolve;

        if (folders.length === 0) {
          setIsNewFolder(true);
          // Focus the new folder input on next render
          requestAnimationFrame(() => {
            newFolderInputRef.current?.focus();
            newFolderInputRef.current?.select();
          });
        }
      });
    },
  }));

  const handleClose = useCallback(() => {
    resolveRef.current?.(null);
    resolveRef.current = undefined;
    setIsOpen(false);
  }, []);

  const handleFolderChange = (value: string) => {
    if (value === '$new') {
      setIsNewFolder(true);
      // Focus the new folder input on next render
      requestAnimationFrame(() => {
        newFolderInputRef.current?.focus();
        newFolderInputRef.current?.select();
      });
    } else {
      setFolderId(value);
      setIsNewFolder(false);
    }
  };

  const handleConfirm = useCallback(() => {
    if (newFolderNameInvalid) return;

    if (isNewFolder) {
      resolveRef.current?.({ newFolderName });
    } else if (folderId) {
      resolveRef.current?.({ folderId });
    } else {
      toast.info('No folder selected. Nothing changed.');
      resolveRef.current?.(null);
    }

    resolveRef.current = undefined;
    setIsOpen(false);
  }, [folderId, isNewFolder, newFolderName, newFolderNameInvalid]);

  useEffect(() => {
    return () => {
      // Cleanup if component unmounts with pending promise
      resolveRef.current?.(null);
    };
  }, []);

  useEffect(() => {
    const handleEnter = (e: KeyboardEvent) => {
      if (
        resolveRef.current &&
        e.key === 'Enter' &&
        e.ctrlKey &&
        !newFolderNameInvalid
      ) {
        handleConfirm();
      }
    };

    window.addEventListener('keydown', handleEnter);

    return () => {
      window.removeEventListener('keydown', handleEnter);
    };
  }, [handleConfirm, newFolderNameInvalid]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogPortal forceMount />
      <DialogContent className="max-w-[350px] pt-4">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {isNewFolder ? 'Name new folder' : 'Select folder'}
          </DialogTitle>
        </DialogHeader>
        {isNewFolder ? (
          <div className="flex gap-2">
            <Input
              ref={newFolderInputRef}
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className={
                newFolderNameInvalid
                  ? 'border-red-500 focus-visible:ring-red-500'
                  : ''
              }
            />
            {folders.length > 0 && (
              <Button
                variant="secondary"
                size="icon"
                onClick={() => {
                  setIsNewFolder(false);
                  setNewFolderName('New folder');
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          <Select value={folderId} onValueChange={handleFolderChange}>
            <SelectTrigger className="truncate">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-w-[300px]">
              <div className="max-h-[200px] overflow-y-auto">
                {folders.map((folder) => (
                  <SelectItem
                    key={folder.id}
                    value={folder.id}
                    className="block"
                  >
                    <Folder className="-mt-0.5 mr-2 inline h-4 w-4" />
                    {folder.name}
                  </SelectItem>
                ))}
                <div className="h-1" />
              </div>
              <SelectSeparator className="mt-0" />
              <SelectItem value="$new">
                <Plus className="-mt-0.5 mr-2 inline h-4 w-4" />
                New folder
              </SelectItem>
            </SelectContent>
          </Select>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={() => handleClose()}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleConfirm} disabled={newFolderNameInvalid}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

FolderSelectModal.displayName = 'FolderSelectModal';

export { FolderSelectModal };
