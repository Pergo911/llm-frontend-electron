import {
  forwardRef,
  useState,
  useRef,
  useImperativeHandle,
  useEffect,
} from 'react';
import {
  ChevronsUpDown,
  Edit3,
  Folder,
  MessageCircle,
  Notebook,
  TerminalSquare,
} from 'lucide-react';
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
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { cn } from '../utils/utils';
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

  const [primaryNameValue, setPrimaryNameValue] = useState('');
  const [secondaryNameValue, setSecondaryNameValue] = useState('');
  const [typeValue, setTypeValue] = useState<'user' | 'system'>('user');

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
    setIsOpen(false);
    resolveRef.current = undefined;
  };

  useEffect(() => {
    return () => {
      // Cleanup if component unmounts with pending promise
      resolveRef.current?.();
    };
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogPortal forceMount />
      <DialogContent className="pt-4">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <div className="leading-none">Create new</div>
            <div className="w-4" />
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
            </Tabs>
            <div className="w-6" />
          </DialogTitle>
        </DialogHeader>
        <Label className="flex items-center">
          <Edit3 className="mr-2 h-4 w-4" />
          Name
        </Label>
        <Input
          value={primaryNameValue}
          onChange={(e) => setPrimaryNameValue(e.target.value)}
        />
        <div
          className={cn(
            'flex gap-4 transition-opacity',
            selectedTab === 'chat' && 'opacity-50',
          )}
        >
          <div className="flex w-full flex-col space-y-2">
            <Label className="flex items-center">
              <ChevronsUpDown className="mr-2 h-4 w-4" />
              Folder
            </Label>
            <Input
              value={secondaryNameValue}
              disabled={selectedTab === 'chat'}
              onChange={(e) => setSecondaryNameValue(e.target.value)}
            />
          </div>
          <div className="flex w-full flex-col space-y-2">
            <Label className="flex items-center">
              <ChevronsUpDown className="mr-2 h-4 w-4" />
              Type
            </Label>
            <Select
              value={typeValue}
              onValueChange={(value) => {
                setTypeValue(value as 'user' | 'system');
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
          </div>
        </div>

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
