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
import { Prompt, ResolvedFolder, SaveFileController } from '@/common/types';
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
import { cn, isInvalid } from '../utils/utils';

export interface NewModalRef {
  promptUser: (
    preset?: 'chat' | 'prompt' | undefined,
    hideChatTab?: boolean,
  ) => Promise<void>;
}

type NewModalProps = {
  folders: ResolvedFolder[];
  controller: SaveFileController;
};

const NewModal = forwardRef<NewModalRef, NewModalProps>(
  ({ folders, controller }, ref) => {
    // IS THIS NEEDED?
    // // Suppress ResizeObserver errors
    // const suppressResizeObserverErrors = () => {
    //   // eslint-disable-next-line no-console
    //   const consoleError = console.error;
    //   // eslint-disable-next-line no-console
    //   console.error = (...args: any[]) => {
    //     if (
    //       args.length > 0 &&
    //       typeof args[0] === 'string' &&
    //       args[0].includes('ResizeObserver')
    //     ) {
    //       return;
    //     }
    //     consoleError.apply(console, args);
    //   };

    //   return () => {
    //     // eslint-disable-next-line no-console
    //     console.error = consoleError;
    //   };
    // };

    // useEffect(() => {
    //   const cleanup = suppressResizeObserverErrors();
    //   return cleanup;
    // }, []);

    const navigate = useNavigate();

    const [isOpen, setIsOpen] = useState(false);
    const [selectedTab, setSelectedTab] = useState<'chat' | 'prompt'>('chat');
    const resolveRef = useRef<() => void>();
    const [hideChatTab, setHideChatTab] = useState(true);

    // Chat tab
    const [chatName, setChatName] = useState('New chat');
    const chatNameInputRef = useRef<HTMLInputElement>(null);

    // Prompt tab
    const [promptName, setPromptName] = useState('New prompt');
    const [promptType, setPromptType] = useState<Prompt['type']>('user-prompt');
    const promptNameInputRef = useRef<HTMLInputElement>(null);

    const [selectedFolderId, setSelectedFolderId] = useState<string>('');
    const [isNewFolder, setIsNewFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('New folder');
    const [canCancelNewFolder, setCanCancelNewFolder] = useState(true);
    const newFolderInputRef = useRef<HTMLInputElement>(null);

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
      setSelectedFolderId('');
      setIsNewFolder(false);
      setCanCancelNewFolder(true);
      setPromptType('user-prompt');
      setSelectedTab('chat');
      setHideChatTab(false);
    };

    useImperativeHandle(ref, () => ({
      promptUser: (
        preset?: 'chat' | 'prompt' | undefined,
        hideChatTab = false,
      ) => {
        reset();
        setIsOpen(true);
        if (preset) {
          setSelectedTab(preset);
        }

        if (hideChatTab) {
          setSelectedTab('prompt');
          setHideChatTab(true);
        }

        // If there are folders, select the first one
        // If there are no folders, make creating a new folder the only option
        if (folders.length > 0) setSelectedFolderId(folders[0].id);
        else {
          setSelectedFolderId('$new');
          setIsNewFolder(true);
          setCanCancelNewFolder(false);
        }

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
        setSelectedFolderId(value);
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
      },
      [handleClose, selectedTab, navigate],
    );

    const handleCreate = useCallback(() => {
      if (selectedTab === 'chat') {
        const { newId, error } = controller.chats.add(chatName);

        if (error || !newId) {
          toast.error(`Error creating chat: ${error}`);
          return;
        }

        handleSuccess(newId);
      } else {
        let folderId = selectedFolderId;

        if (isNewFolder) {
          const { newId, error } = controller.folders.add(newFolderName);

          if (error || !newId) {
            toast.error(`Error creating folder: ${error}`);
            return;
          }

          folderId = newId;
        }

        const { newId, error } = controller.prompts.add(
          promptName,
          folderId,
          promptType,
        );

        if (error || !newId) {
          toast.error(`Error creating prompt: ${error}`);
          return;
        }

        handleSuccess(newId);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      chatName,
      controller.chats.add,
      controller.folders.add,
      controller.prompts.add,
      handleSuccess,
      isNewFolder,
      newFolderName,
      promptName,
      promptType,
      selectedFolderId,
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
            <DialogTitle className="flex items-center">
              {hideChatTab ? 'Create new prompt' : 'Create new'}
            </DialogTitle>
          </DialogHeader>
          <Tabs
            value={selectedTab}
            onValueChange={(v) => setSelectedTab(v as 'chat' | 'prompt')}
            className="min-w-0 flex-1"
          >
            <TabsList className={cn(hideChatTab && 'hidden', 'w-full')}>
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
                <Select
                  value={selectedFolderId}
                  onValueChange={handleFolderChange}
                >
                  <SelectTrigger>
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

              <Label className="flex items-center">
                <ChevronsUpDown className="mr-2 h-4 w-4" />
                Type
              </Label>
              <Select
                value={promptType}
                onValueChange={(value) => {
                  setPromptType(value as 'user-prompt' | 'system-prompt');
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user-prompt">
                    <Notebook className="-mt-0.5 mr-2 inline h-4 w-4" />
                    User
                  </SelectItem>
                  <SelectItem value="system-prompt">
                    <TerminalSquare className="-mt-0.5 mr-2 inline h-4 w-4" />
                    System
                  </SelectItem>
                </SelectContent>
              </Select>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={() => handleClose()}>
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
  },
);

NewModal.displayName = 'NewModal';

export { NewModal };
