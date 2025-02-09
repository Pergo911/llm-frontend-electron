import {
  forwardRef,
  useState,
  useRef,
  useImperativeHandle,
  useEffect,
} from 'react';
import { ChevronsUpDown, Edit3, Notebook, TerminalSquare } from 'lucide-react';
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
  SelectTrigger,
  SelectValue,
} from './ui/select';

export interface NewModalRef {
  promptUser: (preset?: 'chat' | 'prompt' | undefined) => Promise<void>;
}

const NewModal = forwardRef<NewModalRef>((_, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'chat' | 'prompt'>('chat');
  const resolveRef = useRef<() => void>();

  // Chat tab
  const [chatName, setChatName] = useState('New chat');
  const chatNameInputRef = useRef<HTMLInputElement>(null);

  // Prompt tab
  const [promptName, setPromptName] = useState('New prompt');
  const [promptFolder, setPromptFolder] = useState('');
  const [promptType, setPromptType] = useState<'user' | 'system'>('user');
  const promptNameInputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    promptUser: (preset?: 'chat' | 'prompt' | undefined) => {
      setIsOpen(true);
      if (preset) {
        setSelectedTab(preset);
      }

      return new Promise<void>((resolve) => {
        resolveRef.current = resolve;
      });
    },
  }));

  const handleClose = () => {
    resolveRef.current?.();
    resolveRef.current = undefined;
    setIsOpen(false);
    setChatName('New chat');
    setPromptName('New prompt');
    setPromptFolder('');
    setPromptType('user');
    setSelectedTab('chat');
  };

  useEffect(() => {
    return () => {
      // Cleanup if component unmounts with pending promise
      resolveRef.current?.();
    };
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
          className="flex-1"
        >
          <TabsList className="w-full">
            <TabsTrigger value="chat" className="w-full">
              Chat
            </TabsTrigger>
            <TabsTrigger value="prompt" className="w-full">
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
            />
            <Label className="flex items-center">
              <ChevronsUpDown className="mr-2 h-4 w-4" />
              Folder
            </Label>
            <Input
              value={promptFolder}
              disabled={selectedTab === 'chat'}
              onChange={(e) => setPromptFolder(e.target.value)}
            />
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
          <Button onClick={() => handleClose()}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

NewModal.displayName = 'NewModal';

export { NewModal };
