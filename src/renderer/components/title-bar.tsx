/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
/* eslint-disable camelcase */
/* eslint-disable no-nested-ternary */
import React, {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
} from 'react';
import {
  ArrowLeft,
  Brain,
  Check,
  ChevronDown,
  CircleAlert,
  Folder,
  Lightbulb,
  Loader2,
  Menu,
  MessageCircle,
  Notebook,
  SlidersHorizontal,
  SquareTerminal,
  TriangleAlert,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Chat,
  ModelsController,
  OpenRouterModel,
  ResolvedChat,
  ResolvedFolder,
  ResolvedPrompt,
  SaveFileController,
} from '@/common/types';
import { SidebarTrigger, useSidebar } from './ui/sidebar';
import { Button } from './ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from './ui/breadcrumb';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import NewButton from './new-button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './ui/command';
import { cn } from '../utils/utils';
import { Input } from './ui/input';
import { Slider } from './ui/slider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Separator } from './ui/separator';

const ModelSelectorGenSettingsComboPopover = memo(
  ({
    models,
    loading,
    error,
    controller,
  }: {
    models: OpenRouterModel[] | null;
    loading: boolean;
    error: string | null;
    controller: ModelsController;
  }) => {
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
    const [isContentReady, setIsContentReady] = React.useState(false);
    const [tab, setTab] = React.useState<'models' | 'generation'>('models');

    const modelInputRef = React.useRef<HTMLInputElement>(null);

    // Focus input when popover opens or tab changes to models
    useEffect(() => {
      if (isPopoverOpen && tab === 'models') {
        setTimeout(() => {
          modelInputRef.current?.focus();
        }, 100);
      }
    }, [isPopoverOpen, tab]);

    const handleModelSelect = useCallback(
      async (modelId: string) => {
        if (!models) return;

        // Retrieve model object based on ID
        const model = models.find((m) => m.id === modelId);
        if (!model) return;

        // Call select fn
        const { error } = await controller.select(model);

        if (error) toast.error(error);
      },
      [controller, models],
    );

    const handleRefresh = useCallback(() => {
      controller.reload();
    }, [controller]);

    useEffect(() => {
      if (error) toast.error(error);
    }, [error]);

    // Render content asynchronously when popover opens
    useEffect(() => {
      if (isPopoverOpen && !isContentReady) {
        // Use setTimeout to defer heavy rendering until after the popover opens
        const timer = setTimeout(() => {
          setIsContentReady(true);
        }, 0);
        return () => clearTimeout(timer);
      }
      if (!isPopoverOpen) {
        // Timer here to wait until animation finishes
        const timer = setTimeout(() => {
          setIsContentReady(false);
        }, 100);
        return () => clearTimeout(timer);
      }
      return undefined;
    }, [isPopoverOpen, isContentReady]);

    const selectedModel = useMemo(() => (models ? models[0] : null), [models]);

    // GenSettings state
    const [max_tokens, setMaxTokens] = React.useState(4096);
    const [max_tokensInvalid, setMaxTokensInvalid] = React.useState(false);
    const [top_p, setTopP] = React.useState(0.9);
    const [top_pInvalid, setTopPInvalid] = React.useState(false);
    const [temperature, setTemperature] = React.useState(0.9);
    const [temperatureInvalid, setTemperatureInvalid] = React.useState(false);
    const [stop, setStop] = React.useState<string[] | null>(null);
    const [stopInvalid, setStopInvalid] = React.useState(false);

    const [stopRaw, setStopRaw] = React.useState<string>('');

    const [genSettingsError, setGenSettingsError] = React.useState<
      string | null
    >(null);
    const [genSettingsLoading, setGenSettingsLoading] = React.useState(true);

    const invalid =
      max_tokensInvalid || top_pInvalid || temperatureInvalid || stopInvalid;

    useEffect(() => {
      const loadSettings = async () => {
        const config = await window.electron.fileOperations.getConfig();

        const { genSettings } = config;

        if (!genSettings) {
          setGenSettingsError('Failed to load settings');
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

      if (genSettingsLoading)
        loadSettings().then(() => setGenSettingsLoading(false));
    }, [genSettingsLoading]);

    useEffect(() => {
      if (genSettingsError) {
        toast.error(genSettingsError);
        setGenSettingsError(null);
      }
    }, [genSettingsError]);

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
      if (genSettingsLoading) return;

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
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                aria-label="Model selector"
                role="combobox"
                className="group/button non-draggable justify-start hover:bg-background-acrylic-hover"
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
                      <Menu />
                    )}
                  </div>
                )}

                <span className="hidden w-36 truncate text-left @xl/main:inline">
                  {selectedModel
                    ? selectedModel.name
                    : loading
                      ? 'Loading...'
                      : 'No model selected!'}
                </span>

                <ChevronDown className="ml-auto text-muted-foreground transition-transform duration-100 ease-in-out group-hover/button:text-foreground group-focus/button:text-foreground" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="end">
            {selectedModel ? (
              <>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Using model</span>
                  <span className="w-2" />
                  <span className="font-bold">{selectedModel.name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Current balance</span>
                  <span className="w-2" />
                  <span className="font-bold">$3.22</span>
                </div>
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
          <Tabs
            defaultValue="models"
            className="flex flex-col"
            onValueChange={(v) => setTab(v as 'models' | 'generation')}
            value={tab}
          >
            <TabsList className="m-2">
              <TabsTrigger value="models" className="w-full">
                <Brain className="mr-2 h-4 w-4 flex-shrink-0" />
                Models
              </TabsTrigger>
              <TabsTrigger value="generation" className="w-full">
                <SlidersHorizontal className="mr-2 h-4 w-4 flex-shrink-0" />
                Generation
              </TabsTrigger>
            </TabsList>
            <Separator className="m-0 p-0" />
            <TabsContent value="models" className="m-0 h-[300px] p-0">
              <Command className="h-full">
                <CommandInput
                  placeholder="Search models..."
                  disabled={!!error}
                  onRefreshClick={handleRefresh}
                  ref={modelInputRef}
                />
                <CommandList className="h-full max-h-none min-h-0 overflow-y-auto">
                  {!isContentReady ? (
                    <div className="flex h-full items-center justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      <CommandEmpty className="flex h-full flex-col items-center justify-center p-4 text-muted-foreground">
                        {error ? (
                          <>
                            <div className="p-4 text-center leading-loose text-red-600 dark:text-red-400">
                              <CircleAlert className="inline" />
                              <br />
                              {error}
                              <br />
                            </div>
                            <span className="text-xs">
                              Check settings for insufficient configuration.
                            </span>
                          </>
                        ) : loading ? (
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        ) : (
                          <span className="text-xs">No models found.</span>
                        )}
                      </CommandEmpty>
                      {models && (
                        <CommandGroup>
                          {models.map((model) => {
                            return (
                              <CommandItem
                                key={model.id}
                                value={model.id}
                                onSelect={handleModelSelect}
                                className="py-2"
                              >
                                {loading ? (
                                  <Loader2
                                    className={cn(
                                      'invisible mt-0.5 h-4 w-4 flex-shrink-0 animate-spin text-muted-foreground',
                                      model.id === selectedModel?.id &&
                                        'visible',
                                    )}
                                  />
                                ) : (
                                  <Check
                                    className={cn(
                                      'invisible mt-0.5 h-4 w-4 flex-shrink-0',
                                      model.id === selectedModel?.id &&
                                        'visible',
                                    )}
                                  />
                                )}
                                <span
                                  className={cn(
                                    model.id === selectedModel?.id &&
                                      'font-bold',
                                    'w-full truncate',
                                  )}
                                >
                                  {model.name}
                                </span>
                                {model.reasoning && (
                                  <Lightbulb className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                )}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      )}
                    </>
                  )}
                </CommandList>
              </Command>
            </TabsContent>
            <TabsContent value="generation" className="m-0 h-[300px] p-0">
              <div className="m-4 mt-2 flex flex-col gap-2">
                {/* Max tokens: int, default: 4096, min: 1 */}
                <div className="text-sm font-bold">
                  Max new tokens{' '}
                  <span className="font-normal text-muted-foreground">
                    (1{'<'})
                  </span>
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
                  <span className="font-normal text-muted-foreground">
                    (0-5)
                  </span>
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
                  <span className="font-normal text-muted-foreground">
                    (0-1)
                  </span>
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
                  <span className="font-normal text-muted-foreground">
                    (max 4)
                  </span>
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
            </TabsContent>
          </Tabs>
          <Separator className="m-0 p-0" />
          <div className="flex justify-between p-4 text-sm">
            <span className="text-muted-foreground">Current balance</span>
            <span className="w-2" />
            <span className="font-bold">$3.22</span>
          </div>
        </PopoverContent>
      </Popover>
    );
  },
);

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
    | { folder: string; name: string; type: 'user-prompt' | 'system-prompt' }
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
        {promptData?.type === 'user-prompt' ? (
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

type TitleBarProps = {
  chats: ResolvedChat[];
  prompts: ResolvedPrompt[];
  folders: ResolvedFolder[];
  models: OpenRouterModel[] | null;
  loading: boolean;
  modelsError: string | null;
  modelsController: ModelsController;
  saveFileController: SaveFileController;
  isStreaming: boolean;
};

const TitleBar = memo(
  ({
    chats,
    prompts,
    folders,
    modelsController,
    saveFileController,
    models,
    loading,
    modelsError,
    isStreaming,
  }: TitleBarProps) => {
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
          type: 'user-prompt' | 'system-prompt';
        }
      | undefined
    >();
    const [error, setError] = React.useState<string | null>(null);
    const sidebarClosed = useSidebar().state === 'collapsed';

    useEffect(() => {
      const loadData = () => {
        const locList = location.pathname.split('/').filter((x) => x !== '');
        if (locList.length === 0) {
          setBreadCrumbType('home');
          return;
        }
        if (locList.length === 2 && locList[0] === 'c') {
          const chat = chats.find((c) => c.id === locList[1]);

          if (!chat) {
            setError(error || 'Chat not found');
            return;
          }
          setBreadCrumbType('chat');
          setChatData(chat.title);
          return;
        }
        if (locList.length === 2 && locList[0] === 'p') {
          const prompt = prompts.find((p) => p.id === locList[1]);

          if (!prompt) {
            setError(error || 'Prompt not found');
            return;
          }

          setBreadCrumbType('prompt');
          setPromptData({
            folder: prompt.folder?.name ?? 'No folder',
            name: prompt.title,
            type: prompt.type,
          });
          return;
        }
        setError('Unknown URL');
        setBreadCrumbType(null);
      };
      loadData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location, chats, prompts]);

    return (
      <div className="draggable flex h-[48px] items-center gap-0.5 p-2 pr-[145px] @container/main">
        {sidebarClosed && <SidebarTrigger />}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigation(-1);
              }}
              disabled={location.key === 'default' || isStreaming}
              className="hover:bg-background-acrylic-hover"
            >
              <ArrowLeft className="my-auto" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Back</TooltipContent>
        </Tooltip>
        {sidebarClosed && (
          <NewButton
            controller={saveFileController}
            folders={folders}
            disabled={isStreaming}
          />
        )}
        <Breadcrumb className="mx-2 min-w-0 flex-1">
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
        <ModelSelectorGenSettingsComboPopover
          controller={modelsController}
          error={modelsError}
          loading={loading}
          models={models}
        />
      </div>
    );
  },
);

export default TitleBar;
