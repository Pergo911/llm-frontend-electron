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
  promptUser: (currentFolderId: string) => Promise<string | null>;
}

const FolderSelectModal = forwardRef<FolderSelectModalRef>((_, ref) => {
  const resolveRef = useRef<(value: string | null) => void>();
  const [isOpen, setIsOpen] = useState(false);

  const [availableFolders, setAvailableFolders] = useState<
    Array<{ id: string; title: string }>
  >([]);
  const [promptFolder, setPromptFolder] = useState<string>('');
  const [isNewFolder, setIsNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('New folder');
  const newFolderInputRef = useRef<HTMLInputElement>(null);
  const [newFolderNameInvalid, setNewFolderNameInvalid] = useState(false);

  useEffect(() => {
    setNewFolderNameInvalid(isInvalid(newFolderName));
  }, [newFolderName]);

  const reset = () => {
    setNewFolderName('New folder');
    setAvailableFolders([]);
    setIsNewFolder(false);
  };

  const getFolders = async () => {
    const { promptEntries, error } =
      await window.electron.fileOperations.getEntries();

    if (error) {
      toast.error(`Error loading prompts: ${error}`);
      setAvailableFolders([]);
      return;
    }

    setAvailableFolders(
      promptEntries.map((entry) => ({ id: entry.id, title: entry.title })),
    );
  };

  useImperativeHandle(ref, () => ({
    promptUser: (currentFolderId: string) => {
      reset();
      setPromptFolder(currentFolderId);
      setIsOpen(true);
      getFolders();

      return new Promise<string | null>((resolve) => {
        resolveRef.current = resolve;
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
      setPromptFolder(value);
      setIsNewFolder(false);
    }
  };

  const handleConfirm = useCallback(async () => {
    let newFolderId = promptFolder;

    if (isNewFolder) {
      if (newFolderNameInvalid) {
        return;
      }

      const { id, error } = await window.electron.fileOperations.create(
        'folder',
        newFolderName,
      );

      if (error || !id) {
        toast.error(`Error creating folder: ${error}`);
        return;
      }

      newFolderId = id;
    }

    resolveRef.current?.(newFolderId);
    resolveRef.current = undefined;
    setIsOpen(false);
  }, [isNewFolder, newFolderName, newFolderNameInvalid, promptFolder]);

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
          <DialogTitle className="flex items-center">Select folder</DialogTitle>
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
          </div>
        ) : (
          <Select value={promptFolder} onValueChange={handleFolderChange}>
            <SelectTrigger className="truncate">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-w-[300px]">
              <div className="max-h-[200px] overflow-y-auto">
                {availableFolders.map((folder) => (
                  <SelectItem
                    key={folder.id}
                    value={folder.id}
                    className="block"
                  >
                    <Folder className="-mt-0.5 mr-2 inline h-4 w-4" />
                    {folder.title}
                  </SelectItem>
                ))}
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
            <Button variant="secondary" onClick={() => handleClose()}>
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
