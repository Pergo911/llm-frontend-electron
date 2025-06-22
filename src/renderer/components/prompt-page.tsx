import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Prompt } from '@/common/types';
import {
  Check,
  CheckCheck,
  Copy,
  Edit3,
  Folder as FolderIcon,
  Notebook,
  SquareTerminal,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { PopoverClose } from '@radix-ui/react-popover';
import { formatTimestamp, setWindowTitle } from '../utils/utils';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useRefresh } from '../hooks/use-refresh';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { FolderSelectModal, FolderSelectModalRef } from './modal-folder-select';
import { RenameModal, RenameModalRef } from './modal-rename';
import { Textarea } from './ui/textarea';

export default function PromptPage() {
  const { id } = useParams();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const folderSelectModalRef = useRef<FolderSelectModalRef>(null);
  const renameModalRef = useRef<RenameModalRef>(null);
  const nav = useNavigate();
  const refresh = useRefresh();

  const [type, setType] = useState<'user' | 'system'>('user');
  const [folder, setFolder] = useState<string | null>(null);
  const [folderId, setFolderId] = useState<string | null>(null);

  const [content, setContent] = useState('');
  const [isSaved, setIsSaved] = useState(true);

  useEffect(() => {
    if (prompt) {
      setWindowTitle(prompt.title);
    }
  }, [prompt]);

  useEffect(() => {
    const getPrompt = async () => {
      if (!id) return;

      const { prompt, folder, error } =
        await window.electron.fileOperations.getPromptById(id);

      if (!prompt || !folder || error) {
        setError(error || 'Prompt not found.');
        nav('/');
        return;
      }

      setPrompt(prompt);
      setContent(prompt.content);
      setFolder(folder.title);
      setFolderId(folder.id);
      setType(prompt.type);
      setIsSaved(true);
    };

    getPrompt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleFolderSelect = useCallback(async () => {
    if (!folderSelectModalRef.current || !prompt || !folderId) return;

    const newId = await folderSelectModalRef.current.promptUser(folderId);

    if (!newId) return;

    const updatedPrompt = {
      ...prompt,
      folderId: newId,
    };

    const { error } =
      await window.electron.fileOperations.writePrompt(updatedPrompt);

    if (error) {
      setError(error);
      return;
    }

    refresh();
  }, [folderId, prompt, refresh]);

  const handleSetType = async (newType: 'user' | 'system') => {
    if (!prompt) return;

    const updatedPrompt = {
      ...prompt,
      type: newType,
    };

    const { error } =
      await window.electron.fileOperations.writePrompt(updatedPrompt);

    if (error) {
      setError(error);
      return;
    }

    refresh();
  };

  const handleDeletePrompt = async () => {
    if (!prompt) return;

    const { error } = await window.electron.fileOperations.remove(
      'prompt',
      prompt.id,
    );

    if (error) {
      setError(error);
      return;
    }

    toast.success('Deleted.');
    refresh(); // Handles nav to home
  };

  const handleRename = useCallback(async () => {
    if (!prompt) {
      toast.error('Prompt not found.');
      return;
    }

    if (!renameModalRef.current) {
      toast.error('Rename modal not found.');
      return;
    }

    const newName = await renameModalRef.current.promptUser(
      'prompt',
      prompt.title,
    );

    if (!newName) {
      return;
    }

    const updatedPrompt = {
      ...prompt,
      title: newName,
    };

    const { error } =
      await window.electron.fileOperations.writePrompt(updatedPrompt);

    if (error) {
      setError(error);
      return;
    }

    refresh();
  }, [prompt, refresh]);

  const handleSave = useCallback(async () => {
    if (!prompt) {
      toast.error('Prompt not found.');
      return;
    }

    const updatedPrompt = {
      ...prompt,
      content,
    };

    const { error } =
      await window.electron.fileOperations.writePrompt(updatedPrompt);

    if (error) {
      setError(error);
      return;
    }

    setIsSaved(true);
  }, [content, prompt]);

  useEffect(() => {
    const handleSaveShortcut = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 's' && e.ctrlKey) {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleSaveShortcut);

    return () => window.removeEventListener('keydown', handleSaveShortcut);
  }, [handleSave]);

  if (!prompt) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-t-3xl bg-background p-4">
        <div className="h-fit w-fit">{error || 'Loading...'}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-4 rounded-t-3xl bg-background p-4">
      {/* Use this to adjust max width */}
      <div className="flex h-full w-full max-w-[800px] flex-col gap-4">
        <div className="flex items-center gap-2 px-4 text-sm text-muted-foreground @container">
          <span className="hidden whitespace-nowrap @[500px]:inline">
            Folder
          </span>
          <Button
            variant="outline"
            className="group w-44 justify-start"
            onClick={handleFolderSelect}
          >
            <FolderIcon className="inline h-4 w-4 flex-shrink-0 group-hover:hidden" />
            <Edit3 className="hidden h-4 w-4 flex-shrink-0 group-hover:inline" />
            <span className="truncate">{folder}</span>
          </Button>
          <span>
            <Separator
              orientation="vertical"
              className="mx-2 hidden h-9 @[500px]:block"
            />
          </span>
          <span className="hidden whitespace-nowrap @[500px]:inline">
            Send as
          </span>
          <Select
            value={type}
            onValueChange={(v) => handleSetType(v as 'user' | 'system')}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">
                <Notebook className="-mt-0.5 mr-2 inline h-4 w-4" />
                User
              </SelectItem>
              <SelectItem value="system">
                <SquareTerminal className="-mt-0.5 mr-2 inline h-4 w-4" />
                System
              </SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    variant="actionButton"
                    size="icon"
                    className="ml-auto hover:text-red-500 focus:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">Delete prompt</TooltipContent>
              <PopoverContent
                side="top"
                align="end"
                className="border-[0.5px] border-border bg-background-dim p-4 text-xs drop-shadow-md"
              >
                <div>
                  <div className="text-lg font-bold">Delete?</div>
                  <div className="text-muted-foreground">
                    Deletes this prompt permanently. References in chats will be
                    retained.
                  </div>
                </div>
                <div className="h-4" />
                <div className="flex w-full justify-end gap-2">
                  <PopoverClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </PopoverClose>
                  <Button variant="destructive" onClick={handleDeletePrompt}>
                    Confirm
                  </Button>
                </div>
              </PopoverContent>
            </Tooltip>
          </Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="actionButton"
                size="icon"
                onClick={(e) => {
                  navigator.clipboard.writeText(prompt.id);
                  e.currentTarget.blur();
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Copy ID</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                className=""
                disabled={isSaved}
                onClick={handleSave}
              >
                {isSaved ? (
                  <CheckCheck className="h-4 w-4" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="end">
              {isSaved ? 'Saved.' : 'Save'}
            </TooltipContent>
          </Tooltip>
        </div>
        {prompt && !error && (
          <div className="flex h-full w-full flex-col overflow-y-auto rounded-3xl bg-card">
            <div className="relative flex items-start px-4 pt-4 text-xl font-bold leading-none">
              {type === 'user' ? (
                <Notebook className="mr-4 h-6 w-6 flex-shrink-0" />
              ) : (
                <SquareTerminal className="mr-4 h-6 w-6 flex-shrink-0" />
              )}
              <div className="mr-10 mt-0.5 w-fit">{prompt?.title}</div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    className="absolute right-4 top-4 text-muted-foreground"
                    size="icon"
                    variant="actionButton"
                    onClick={handleRename}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Rename</TooltipContent>
              </Tooltip>
            </div>
            <div className="m-0 ml-14 mt-0.5 p-0 text-xs text-muted-foreground">
              <span>Created </span>
              <span className="font-bold">
                {formatTimestamp(prompt.timestamp)}
              </span>
            </div>
            <Textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setIsSaved(false);
              }}
              placeholder="Start typing here..."
              spellCheck={false}
              className="m-0 h-full w-full resize-none overflow-y-auto rounded-none border-none p-4 text-base focus-visible:ring-0"
            />
          </div>
        )}
      </div>
      <FolderSelectModal ref={folderSelectModalRef} />
      <RenameModal ref={renameModalRef} />
    </div>
  );
}
