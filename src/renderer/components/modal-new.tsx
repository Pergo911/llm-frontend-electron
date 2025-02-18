import {
  forwardRef,
  useState,
  useRef,
  useImperativeHandle,
  useEffect,
  useCallback,
} from 'react';
import {
  ChevronsUpDown,
  Edit3,
  Folder,
  FolderPlus,
  Notebook,
  Plus,
  TerminalSquare,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Separator } from './ui/separator';
import { useRefresh } from '../hooks/use-refresh';
import { isInvalid } from '../utils/utils';

export interface NewModalRef {
  promptUser: (preset?: 'chat' | 'prompt' | undefined) => Promise<void>;
}

const NewModal = forwardRef<NewModalRef>((_, ref) => {
  // Suppress ResizeObserver errors
  const suppressResizeObserverErrors = () => {
    // eslint-disable-next-line no-console
    const consoleError = console.error;
    // eslint-disable-next-line no-console
    console.error = (...args: any[]) => {
      if (
        args.length > 0 &&
        typeof args[0] === 'string' &&
        args[0].includes('ResizeObserver')
      ) {
        return;
      }
      consoleError.apply(console, args);
    };

    return () => {
      // eslint-disable-next-line no-console
      console.error = consoleError;
    };
  };

  // Add this effect in your NewModal component
  useEffect(() => {
    const cleanup = suppressResizeObserverErrors();
    return cleanup;
  }, []);

  const navigate = useNavigate();
  const refresh = useRefresh();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'chat' | 'prompt'>('chat');
  const resolveRef = useRef<() => void>();

  // Chat tab
  const [chatName, setChatName] = useState('New chat');
  const chatNameInputRef = useRef<HTMLInputElement>(null);

  // Prompt tab
  const [promptName, setPromptName] = useState('New prompt');
  const [availableFolders, setAvailableFolders] = useState<
    Array<{ id: string; title: string }>
  >([]);
  const [promptFolder, setPromptFolder] = useState<string>('');
  const [isNewFolder, setIsNewFolder] = useState(false);
  const [canCancelNewFolder, setCanCancelNewFolder] = useState(true);
  const [newFolderName, setNewFolderName] = useState('New folder');
  const newFolderInputRef = useRef<HTMLInputElement>(null);
  const [promptType, setPromptType] = useState<'user' | 'system'>('user');
  const promptNameInputRef = useRef<HTMLInputElement>(null);

  const [chatNameInvalid, setChatNameInvalid] = useState(false);
  const [promptNameInvalid, setPromptNameInvalid] = useState(false);
  const [newFolderNameInvalid, setNewFolderNameInvalid] = useState(false);

  useEffect(() => {
    setChatNameInvalid(isInvalid(chatName));
  }, [chatName]);

  useEffect(() => {
    setPromptNameInvalid(isInvalid(promptName));
  }, [promptName]);

  useEffect(() => {
    setNewFolderNameInvalid(isInvalid(newFolderName));
  }, [newFolderName]);

  const invalid =
    selectedTab === 'chat'
      ? chatNameInvalid
      : promptNameInvalid || newFolderNameInvalid;

  const reset = () => {
    setChatName('New chat');
    setPromptName('New prompt');
    setNewFolderName('New folder');
    setAvailableFolders([]);
    setPromptFolder('');
    setIsNewFolder(false);
    setCanCancelNewFolder(true);
    setPromptType('user');
    setSelectedTab('chat');
  };

  const getFolders = async () => {
    const { promptEntries, error } =
      await window.electron.fileOperations.getEntries();

    if (error) {
      toast.error(`Error loading prompts: ${error}`);
      setAvailableFolders([]);
      return;
    }

    const folders = promptEntries.map((entry) => ({
      id: entry.id,
      title: entry.title,
    }));
    setAvailableFolders(folders);

    if (folders.length === 0) {
      setIsNewFolder(true);
      setCanCancelNewFolder(false);
      return;
    }

    if (promptEntries.length > 0) {
      setPromptFolder(promptEntries[0].id);
    }
  };

  useImperativeHandle(ref, () => ({
    promptUser: (preset?: 'chat' | 'prompt' | undefined) => {
      reset();
      setIsOpen(true);
      if (preset) {
        setSelectedTab(preset);
      }

      getFolders();

      return new Promise<void>((resolve) => {
        resolveRef.current = resolve;
      });
    },
  }));

  const handleClose = useCallback(() => {
    resolveRef.current?.();
    resolveRef.current = undefined;
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!resolveRef.current) return; // Most reliable way to check if the modal is open

    requestAnimationFrame(() => {
      if (selectedTab === 'chat') {
        chatNameInputRef.current?.focus();
        chatNameInputRef.current?.select();
      } else {
        promptNameInputRef.current?.focus();
        promptNameInputRef.current?.select();
      }
    });
  }, [selectedTab, isOpen]);

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

  const handleSuccess = useCallback(
    (id: string) => {
      handleClose();

      if (selectedTab === 'chat') {
        navigate(`/c/${id}`);
      } else {
        navigate(`/p/${id}`);
      }

      refresh();
    },
    [handleClose, selectedTab, navigate, refresh],
  );

  const handleCreate = useCallback(async () => {
    if (selectedTab === 'chat') {
      const { id, error } = await window.electron.fileOperations.create(
        'chat',
        chatName,
      );

      if (error || !id) {
        toast.error(`Error creating chat: ${error}`);
        return;
      }

      handleSuccess(id);
    } else {
      let folderId = promptFolder;

      if (isNewFolder) {
        const { id, error } = await window.electron.fileOperations.create(
          'folder',
          newFolderName,
        );

        if (error || !id) {
          toast.error(`Error creating folder: ${error}`);
          return;
        }

        folderId = id;
      }

      const { id, error } = await window.electron.fileOperations.create(
        'prompt',
        promptName,
        folderId,
        promptType,
      );

      if (error || !id) {
        toast.error(`Error creating prompt: ${error}`);
        return;
      }

      handleSuccess(id);
    }
  }, [
    // Chunky ahh dependecy array
    chatName,
    handleSuccess,
    isNewFolder,
    newFolderName,
    promptFolder,
    promptName,
    promptType,
    selectedTab,
  ]);

  useEffect(() => {
    return () => {
      // Cleanup if component unmounts with pending promise
      resolveRef.current?.();
    };
  }, []);

  useEffect(() => {
    const handleEnter = (e: KeyboardEvent) => {
      if (resolveRef.current && e.key === 'Enter' && !invalid) {
        handleCreate();
      }
    };

    window.addEventListener('keydown', handleEnter);

    return () => {
      window.removeEventListener('keydown', handleEnter);
    };
  }, [handleCreate, invalid]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogPortal forceMount />
      <DialogContent className="max-w-[350px] pt-4">
        <DialogHeader>
          <DialogTitle className="flex items-center">Create new</DialogTitle>
        </DialogHeader>
        <Tabs
          value={selectedTab}
          onValueChange={(v) => setSelectedTab(v as 'chat' | 'prompt')}
          className="min-w-0 flex-1"
        >
          <TabsList className="w-full">
            <TabsTrigger value="chat" className="w-full transition-none">
              Chat
            </TabsTrigger>
            <TabsTrigger value="prompt" className="w-full transition-none">
              Prompt
            </TabsTrigger>
          </TabsList>

          {/* NEW CHAT */}
          <TabsContent value="chat" className="mt-4 flex flex-col gap-4">
            <Label className="flex items-center">
              <Edit3 className="mr-2 h-4 w-4" />
              Name
            </Label>
            <Input
              value={chatName}
              ref={chatNameInputRef}
              onChange={(e) => setChatName(e.target.value)}
              className={
                chatNameInvalid
                  ? 'border-red-500 focus-visible:ring-red-500'
                  : ''
              }
            />
          </TabsContent>

          {/* NEW PROMPT */}
          <TabsContent value="prompt" className="flex flex-col gap-4">
            <Label className="flex items-center">
              <Edit3 className="mr-2 h-4 w-4" />
              Name
            </Label>
            <Input
              value={promptName}
              ref={promptNameInputRef}
              onChange={(e) => setPromptName(e.target.value)}
              className={
                promptNameInvalid
                  ? 'border-red-500 focus-visible:ring-red-500'
                  : ''
              }
            />
            <Label className="flex items-center">
              <ChevronsUpDown className="mr-2 h-4 w-4" />
              Folder
            </Label>
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
                {canCancelNewFolder && (
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
              <Select value={promptFolder} onValueChange={handleFolderChange}>
                <SelectTrigger>
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

            <Label className="flex items-center">
              <ChevronsUpDown className="mr-2 h-4 w-4" />
              Type
            </Label>
            <Select
              value={promptType}
              onValueChange={(value) => {
                setPromptType(value as 'user' | 'system');
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">
                  <Notebook className="-mt-0.5 mr-2 inline h-4 w-4" />
                  User
                </SelectItem>
                <SelectItem value="system">
                  <TerminalSquare className="-mt-0.5 mr-2 inline h-4 w-4" />
                  System
                </SelectItem>
              </SelectContent>
            </Select>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" onClick={() => handleClose()}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleCreate} disabled={invalid}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

NewModal.displayName = 'NewModal';

export { NewModal };
