/* eslint-disable no-use-before-define */
/* eslint-disable no-nested-ternary */
import React, { useCallback, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRightLeft,
  Brain,
  Check,
  ChevronDown,
  ChevronsUpDown,
  CircleAlert,
  Folder,
  Home,
  Loader2,
  MessageCircle,
  Notebook,
  SlidersHorizontal,
  SquareTerminal,
  TriangleAlert,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from './ui/sidebar';
import { Button } from './ui/button';
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from './ui/breadcrumb';
import { ChatOperations } from '../utils/chat-operations';
import { cn } from '../utils/utils';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from './ui/command';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

const HomeBreadcrumb = () => {
  return (
    <BreadcrumbList>
      <BreadcrumbItem>
        <Home className="h-4 w-4" />
        Home
      </BreadcrumbItem>
    </BreadcrumbList>
  );
};

const ChatBreadcrumb = ({ chatData }: { chatData: string | undefined }) => {
  return (
    <BreadcrumbList>
      <BreadcrumbItem className="min-w-0 max-w-36 lg:max-w-80">
        <MessageCircle className="h-4 w-4 flex-shrink-0" />
        <span className="truncate">{chatData}</span>
      </BreadcrumbItem>
    </BreadcrumbList>
  );
};

const PromptBreadcrumb = ({
  promptData,
}: {
  promptData:
    | { folder: string; name: string; type: 'user' | 'system' }
    | undefined;
}) => {
  return (
    <BreadcrumbList className="">
      <BreadcrumbItem className="min-w-0 max-w-36">
        <Folder className="h-4 w-4 flex-shrink-0" />
        <span className="truncate">{promptData?.folder ?? ''}</span>
      </BreadcrumbItem>
      <BreadcrumbSeparator className="" />
      <BreadcrumbItem className="min-w-0 max-w-40">
        {promptData?.type === 'user' ? (
          <Notebook className="h-4 w-4 flex-shrink-0" />
        ) : (
          <SquareTerminal className="h-4 w-4 flex-shrink-0" />
        )}
        <span className="truncate">{promptData?.name ?? ''}</span>
      </BreadcrumbItem>
    </BreadcrumbList>
  );
};

const ErrorOrLoadingBreadcrumb = ({ error }: { error: string | null }) => {
  return (
    <BreadcrumbList>
      <BreadcrumbItem>
        {error ? (
          <div className="min-w-0 max-w-40">
            <TriangleAlert className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{error}</span>
          </div>
        ) : (
          <div className="animate-pulse">Loading...</div>
        )}
      </BreadcrumbItem>
    </BreadcrumbList>
  );
};

const ModelSelector = () => {
  const [models, setModels] = React.useState<string[]>([]);
  const [selectedModel, setSelectedModel] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    const loadModels = async () => {
      const { models, error } = await ChatOperations.getModels();

      if (error || !models) {
        setError(error || "Couldn't get models.");
        setLoading(false);
        return;
      }

      setError(null);
      setModels(models);
      setSelectedModel(models[0]);
      setLoading(false);
    };

    if (loading) loadModels();
  }, [loading]);

  const handleModelSelect = async (model: string) => {
    setSelectedModel(model);

    const { error } = await ChatOperations.selectModel(model);

    if (error) {
      setSelectedModel(null);
      setError(error);
    }

    setLoading(true);
  };

  const handleRefresh = useCallback(() => {
    setLoading(true);
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              aria-label="Model selector"
              aria-expanded={open}
              role="combobox"
              className="group/button non-draggable"
              variant="ghost"
              size="sm"
            >
              {loading ? (
                <Loader2 className="animate-spin text-muted-foreground repeat-infinite" />
              ) : (
                <div className="relative flex items-center gap-0.5">
                  {error && (
                    <>
                      <div className="absolute right-0 top-0 h-2 w-2 animate-pulse rounded-full bg-red-500" />
                      <div className="absolute right-0 top-0 h-2 w-2 animate-ping rounded-full bg-red-500" />
                    </>
                  )}

                  {error ? (
                    <CircleAlert className="text-red-600 dark:text-red-400" />
                  ) : (
                    <Brain />
                  )}
                </div>
              )}
              <ChevronDown className="text-muted-foreground transition-transform duration-100 ease-in-out group-hover/button:text-secondary-foreground group-focus/button:text-secondary-foreground" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end">
          {selectedModel ? (
            <>
              <span>Using model: </span>
              <span className="font-bold">{selectedModel}</span>
            </>
          ) : (
            'No model selected!'
          )}
        </TooltipContent>
      </Tooltip>
      <PopoverContent
        className="non-draggable w-[300px] p-0"
        side="bottom"
        align="end"
      >
        <Command>
          <CommandInput
            placeholder="Search models..."
            disabled={!!error}
            onRefreshClick={handleRefresh}
          />
          <CommandList>
            <CommandEmpty>
              {error ? (
                <div className="leading-loose text-red-600 dark:text-red-400">
                  <CircleAlert className="inline" />
                  <br />
                  {error}
                  <br />
                  <span className="text-xs text-muted-foreground">
                    Check settings for insufficient configuration.
                  </span>
                </div>
              ) : loading ? (
                <Loader2 className="inline animate-spin repeat-infinite" />
              ) : (
                'No models found.'
              )}
            </CommandEmpty>
            <CommandGroup>
              {models &&
                models.map((model) => {
                  return (
                    <CommandItem
                      key={model}
                      value={model}
                      onSelect={handleModelSelect}
                    >
                      {loading ? (
                        <Loader2
                          className={cn(
                            'mr-2 h-4 w-4 animate-spin text-muted-foreground opacity-0 repeat-infinite',
                            model === selectedModel && 'opacity-100',
                          )}
                        />
                      ) : (
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4 opacity-0 transition-opacity duration-100 ease-in-out',
                            model === selectedModel && 'opacity-100',
                          )}
                        />
                      )}
                      {model}
                    </CommandItem>
                  );
                })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

function GenSettings() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label="Generation settings"
          className="group/button non-draggable"
          variant="ghost"
          size="sm"
        >
          <SlidersHorizontal />
          <ChevronDown className="ml-auto text-muted-foreground transition-transform duration-100 ease-in-out group-hover/button:text-secondary-foreground group-focus/button:text-secondary-foreground" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="end">
        Generation settings
      </TooltipContent>
    </Tooltip>
  );
}

export default function TitleBar() {
  const navigation = useNavigate();
  const location = useLocation();
  const [breadcrumbType, setBreadCrumbType] = React.useState<
    'home' | 'chat' | 'prompt' | null
  >(null);
  const [chatData, setChatData] = React.useState<string | undefined>();
  const [promptData, setPromptData] = React.useState<
    | {
        folder: string;
        name: string;
        type: 'user' | 'system';
      }
    | undefined
  >();
  const [error, setError] = React.useState<string | null>(null);
  useEffect(() => {
    const loadData = async () => {
      const locList = location.pathname.split('/').filter((x) => x !== '');
      if (locList.length === 0) {
        setBreadCrumbType('home');
        return;
      }
      if (locList.length === 2 && locList[0] === 'c') {
        const { chat, error } =
          await window.electron.fileOperations.getChatById(locList[1]);
        if (error || !chat) {
          setError(error || 'Chat not found');
          return;
        }
        setBreadCrumbType('chat');
        setChatData(chat.title);
        return;
      }
      if (locList.length === 2 && locList[0] === 'p') {
        const { prompt, folder, error } =
          await window.electron.fileOperations.getPromptById(locList[1]);
        if (error || !prompt || !folder) {
          setError(error || 'Prompt not found');
          return;
        }
        setBreadCrumbType('prompt');
        setPromptData({
          folder: folder.title,
          name: prompt.title,
          type: prompt.type,
        });
        return;
      }
      setError('Unknown URL');
      setBreadCrumbType(null);
    };
    loadData();
  }, [location]);
  return (
    <div className="draggable flex h-[64px] items-center gap-2 bg-sidebar p-2 pr-[145px]">
      <SidebarTrigger className="my-auto" />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          navigation(-1);
        }}
        disabled={location.key === 'default'}
      >
        <ArrowLeft className="my-auto" />
      </Button>
      <Breadcrumb className="flex-1">
        {breadcrumbType === 'home' ? (
          <HomeBreadcrumb />
        ) : breadcrumbType === 'chat' ? (
          <ChatBreadcrumb chatData={chatData} />
        ) : breadcrumbType === 'prompt' ? (
          <PromptBreadcrumb promptData={promptData} />
        ) : (
          <ErrorOrLoadingBreadcrumb error={error} />
        )}
      </Breadcrumb>
      <ModelSelector />
      <GenSettings />
    </div>
  );
}
