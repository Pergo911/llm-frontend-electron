/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
/* eslint-disable camelcase */
/* eslint-disable no-use-before-define */
/* eslint-disable no-nested-ternary */
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
} from 'react';
import {
  ArrowLeft,
  Brain,
  Check,
  ChevronDown,
  CircleAlert,
  Folder,
  Loader2,
  MessageCircle,
  Notebook,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  SquareTerminal,
  TriangleAlert,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { SidebarTrigger, useSidebar } from './ui/sidebar';
import { Button } from './ui/button';
import {
  Breadcrumb,
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
import { Input } from './ui/input';
import { Slider } from './ui/slider';
import AddRefreshButtonGroup from './add-refresh-buttongroup';
import { RefreshRef } from './app-sidebar';

// Used to display home icon, kept for consistency
const HomeBreadcrumb = () => {
  return null;
};

const ChatBreadcrumb = ({ chatData }: { chatData: string | undefined }) => {
  return (
    <BreadcrumbList>
      {/* Ellipsis */}
      <BreadcrumbItem className="w-full min-w-0">
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
    <BreadcrumbList className="flex flex-nowrap">
      {/* Folder */}
      <BreadcrumbItem className="hidden max-w-40 @2xl/main:flex">
        <Folder className="h-4 w-4 flex-shrink-0" />
        <span className="truncate">{promptData?.folder ?? ''}</span>
      </BreadcrumbItem>

      <BreadcrumbSeparator className="hidden @2xl/main:block" />

      {/* Ellipsis */}
      <BreadcrumbItem className="w-full min-w-0">
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

const ModelSelector = forwardRef<RefreshRef>((_, ref) => {
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

  useImperativeHandle(ref, () => ({ refresh: handleRefresh }));

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
              className="group/button non-draggable justify-start"
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

              <span className="hidden w-36 truncate text-left @xl/main:inline">
                {selectedModel ? (
                  <>
                    <span className="text-xs text-muted-foreground">
                      {selectedModel.includes('/') &&
                        selectedModel.split('/')[0]}
                    </span>
                    <br />
                    <span className="font-bold">
                      {selectedModel.includes('/')
                        ? selectedModel.split('/')[1]
                        : selectedModel}
                    </span>
                  </>
                ) : loading ? (
                  'Loading...'
                ) : (
                  'No model selected!'
                )}
              </span>

              <ChevronDown className="ml-auto text-muted-foreground transition-transform duration-100 ease-in-out group-hover/button:text-secondary-foreground group-focus/button:text-secondary-foreground" />
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
                <div className="p-4 leading-loose text-red-600 dark:text-red-400">
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
                      <span
                        className={cn(model === selectedModel && 'font-bold')}
                      >
                        {model}
                      </span>
                    </CommandItem>
                  );
                })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
});

const GenSettings = forwardRef<RefreshRef>((_, ref) => {
  const [max_tokens, setMaxTokens] = React.useState(4096);
  const [max_tokensInvalid, setMaxTokensInvalid] = React.useState(false);
  const [top_p, setTopP] = React.useState(0.9);
  const [top_pInvalid, setTopPInvalid] = React.useState(false);
  const [temperature, setTemperature] = React.useState(0.9);
  const [temperatureInvalid, setTemperatureInvalid] = React.useState(false);
  const [stop, setStop] = React.useState<string[] | null>(null);
  const [stopInvalid, setStopInvalid] = React.useState(false);

  const [stopRaw, setStopRaw] = React.useState<string>('');

  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const invalid =
    max_tokensInvalid || top_pInvalid || temperatureInvalid || stopInvalid;

  useEffect(() => {
    const loadSettings = async () => {
      const config = await window.electron.fileOperations.getConfig();

      const { genSettings } = config;

      if (!genSettings) {
        setError('Failed to load settings');
        return;
      }

      setMaxTokens(genSettings.max_tokens);
      setTopP(genSettings.top_p);
      setTemperature(genSettings.temperature);
      setStop(genSettings.stop);
      setStopRaw(
        genSettings.stop.length !== 0 ? JSON.stringify(genSettings.stop) : '',
      );
    };

    if (loading) loadSettings().then(() => setLoading(false));
  }, [loading]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      setError(null);
    }
  }, [error]);

  const handleRefresh = useCallback(() => {
    setLoading(true);
  }, []);

  useImperativeHandle(ref, () => ({ refresh: handleRefresh }));

  const validateInputs = useCallback(() => {
    // Max tokens validation
    setMaxTokensInvalid(max_tokens < 1 || !Number.isInteger(max_tokens));

    // Temperature validation
    setTemperatureInvalid(temperature < 0 || temperature > 5);

    // Top P validation
    setTopPInvalid(top_p < 0 || top_p > 1);

    // Stop sequences validation
    try {
      if (stopRaw.trim() === '') {
        setStop(null);
        setStopInvalid(false);
      } else {
        const parsed = JSON.parse(stopRaw);
        const isValid =
          Array.isArray(parsed) &&
          parsed.length <= 4 &&
          parsed.every((item) => typeof item === 'string');
        setStopInvalid(!isValid);
        if (isValid) {
          setStop(parsed);
        }
      }
    } catch {
      setStopInvalid(true);
    }
  }, [max_tokens, temperature, top_p, stopRaw]);

  useEffect(() => {
    validateInputs();
  }, [max_tokens, temperature, top_p, stopRaw, validateInputs]);

  useEffect(() => {
    // Don't auto-save if loading hasn't finished yet.
    if (loading) return;

    // Don't auto-save if there are any invalid values.
    if (invalid) return;

    const debounceTimer = setTimeout(() => {
      window.electron.fileOperations
        .setConfig('genSettings', {
          max_tokens,
          top_p,
          temperature,
          stop: stop ?? [],
        })
        .then(({ error }) => {
          if (error) {
            toast.error(error);
          }
        });
    }, 1000); // 1000ms debounce

    // eslint-disable-next-line consistent-return
    return () => clearTimeout(debounceTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invalid, max_tokens, top_p, temperature, stop]);

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              aria-label="Generation settings"
              className="group/button non-draggable"
              variant="ghost"
              size="sm"
            >
              <div className="relative">
                {invalid && (
                  <>
                    <div className="absolute right-0 top-0 h-2 w-2 animate-pulse rounded-full bg-red-500" />
                    <div className="absolute right-0 top-0 h-2 w-2 animate-ping rounded-full bg-red-500" />
                  </>
                )}
                <SlidersHorizontal />
              </div>
              <ChevronDown className="ml-auto text-muted-foreground transition-transform duration-100 ease-in-out group-hover/button:text-secondary-foreground group-focus/button:text-secondary-foreground" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end">
          {invalid ? `Invalid generation settings!` : 'Generation settings'}
        </TooltipContent>
      </Tooltip>
      <PopoverContent
        className="non-draggable w-[300px] p-0"
        side="bottom"
        align="end"
      >
        <div className="flex flex-col gap-2 p-4">
          {/* Max tokens: int, default: 4096, min: 1 */}
          <div className="text-sm font-bold">
            Max new tokens{' '}
            <span className="font-normal text-muted-foreground">(1{'<'})</span>
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              className={cn(
                'flex-[2]',
                max_tokensInvalid &&
                  'border-red-600 focus-visible:ring-red-600 dark:border-red-400 dark:focus-visible:ring-red-400',
              )}
              value={max_tokens}
              onChange={(e) => setMaxTokens(Number(e.target.value))}
              step={1}
              min={1}
            />
          </div>

          {/* Temperature: float, default: 0.9, min: 0, max: 5 */}
          <div className="text-sm font-bold">
            Temperature{' '}
            <span className="font-normal text-muted-foreground">(0-5)</span>
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              className={cn(
                'flex-[2]',
                temperatureInvalid &&
                  'border-red-600 focus-visible:ring-red-600 dark:border-red-400 dark:focus-visible:ring-red-400',
              )}
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
              min={0}
              max={5}
              step={0.1}
            />
            <Slider
              className={cn(
                'flex-[8]',
                temperatureInvalid && 'text-red-600 dark:text-red-400',
              )}
              min={0}
              max={2}
              step={0.1}
              value={[temperature]}
              onValueChange={(value) => setTemperature(value[0])}
            />
          </div>

          {/* Top P: float, default: 0.9, min: 0, max: 1 */}
          <div className="text-sm font-bold">
            Top P{' '}
            <span className="font-normal text-muted-foreground">(0-1)</span>
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              className={cn(
                'flex-[2]',
                top_pInvalid &&
                  'border-red-600 focus-visible:ring-red-600 dark:border-red-400 dark:focus-visible:ring-red-400',
              )}
              min={0}
              max={1}
              value={top_p}
              onChange={(e) => setTopP(Number(e.target.value))}
              step={0.1}
            />
            <Slider
              className={cn(
                'flex-[8]',
                top_pInvalid && 'text-red-600 dark:text-red-400',
              )}
              min={0}
              max={1}
              step={0.1}
              value={[top_p]}
              onValueChange={(value) => setTopP(value[0])}
            />
          </div>

          {/* Stop sequences: string[]; up to 4 items */}
          <div className="text-sm font-bold">
            Stop sequences{' '}
            <span className="font-normal text-muted-foreground">(max 4)</span>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder='["\n", "You:"]'
              value={stopRaw}
              onChange={(e) => setStopRaw(e.target.value)}
              className={cn(
                stopInvalid &&
                  'border-red-600 focus-visible:ring-red-600 dark:border-red-400 dark:focus-visible:ring-red-400',
              )}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});

const TitleBar = forwardRef<RefreshRef>((_, ref) => {
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
  const sidebarClosed = useSidebar().state === 'collapsed';
  const modelSelectorRef = React.useRef<RefreshRef>(null);
  const genSettingsRef = React.useRef<RefreshRef>(null);

  useImperativeHandle(ref, () => ({
    refresh: () => {
      modelSelectorRef.current?.refresh();
      genSettingsRef.current?.refresh();
    },
  }));

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
    <div className="draggable flex h-[64px] items-center gap-2 bg-sidebar p-2 pr-[145px] @container/main">
      <SidebarTrigger className="my-auto" />
      {sidebarClosed && <AddRefreshButtonGroup />}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          navigation(-1);
        }}
        disabled={location.key === 'default'}
      >
        <ArrowLeft className="my-auto" />
      </Button>
      <Breadcrumb className="min-w-0 flex-1">
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
      <ModelSelector ref={modelSelectorRef} />
      <GenSettings ref={genSettingsRef} />
    </div>
  );
});

export default TitleBar;
