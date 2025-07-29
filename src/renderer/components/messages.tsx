/* eslint-disable no-nested-ternary */
/* eslint-disable react/no-unused-prop-types */
import {
  PromptMessage,
  Chat,
  StreamingMessageHandle,
  ResolvedPromptMessage,
  UserMessage,
  AssistantMessage,
} from '@/common/types';
import {
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit3,
  ExternalLink,
  Info,
  LoaderCircle,
  Notebook,
  RefreshCw,
  SquareTerminal,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import remarkGfm from 'remark-gfm';
import { PopoverClose } from '@radix-ui/react-popover';
import remarkBreaks from 'remark-breaks';
import { Button } from './ui/button';
import { cn, formatTimestamp } from '../utils/utils';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import ReasoningBlock from './reasoning-block';
import { PromptSelectModal, PromptSelectModalRef } from './modal-prompt-select';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from './ui/context-menu';
import { Separator } from './ui/separator';

const UserMessageComponent = React.memo<{
  m: UserMessage;
  isStreaming: boolean;
  isOmittedDuringStreaming: boolean;
  onMessageEdit: (toEdit: string, id: string) => void;
  onMessageDelete: (id: string) => void;
}>(
  ({
    m,
    isStreaming,
    isOmittedDuringStreaming,
    onMessageEdit,
    onMessageDelete,
  }) => {
    const [infoOpen, setInfoOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const shouldUnfocusInfo = React.useRef(false);
    const shouldUnfocusDelete = React.useRef(false);

    const [contextDeleteOpen, setContextDeleteOpen] = useState(false);

    const handleDelete = React.useCallback(() => {
      onMessageDelete(m.id);
    }, [m.id, onMessageDelete]);

    const handleEdit = React.useCallback(() => {
      onMessageEdit(m.content, m.id);
    }, [m.content, m.id, onMessageEdit]);

    return (
      <div
        className={cn(
          isStreaming && 'pointer-events-none',
          isStreaming && isOmittedDuringStreaming && 'opacity-50',
          'group/textbox flex w-full flex-col items-end',
        )}
      >
        <div className="flex max-w-[90%] flex-wrap-reverse items-center justify-end gap-0.5">
          {/* Action buttons */}
          <div className="flex h-fit w-fit min-w-[88px] gap-0.5 text-xs text-muted-foreground">
            <Popover open={deleteOpen} onOpenChange={setDeleteOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="actionButton"
                  size="icon"
                  className={cn(
                    'opacity-0 transition-opacity hover:text-red-500 focus:text-red-500',
                    'group-focus-within/textbox:opacity-100 group-hover/textbox:opacity-100',
                    (infoOpen || deleteOpen) && 'opacity-100',
                  )}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                className="border-[0.5px] border-border bg-background-dim p-4 text-xs drop-shadow-md"
                onCloseAutoFocus={(e) => {
                  if (shouldUnfocusDelete.current) {
                    e.preventDefault();
                    shouldUnfocusDelete.current = false;
                  }
                }}
              >
                <div>
                  <div className="text-lg font-bold">Delete?</div>
                  <div className="text-muted-foreground">
                    Also removes subsequent messages.
                  </div>
                </div>
                <div className="h-4" />
                <div className="flex w-full justify-end gap-2">
                  <PopoverClose asChild>
                    <Button
                      variant="outline"
                      onMouseDown={() => {
                        shouldUnfocusDelete.current = true;
                      }}
                    >
                      Cancel
                    </Button>
                  </PopoverClose>
                  <Button variant="destructive" onClick={handleDelete}>
                    Confirm
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <Button
              variant="actionButton"
              size="icon"
              className={cn(
                'opacity-0 transition-opacity',
                'group-focus-within/textbox:opacity-100 group-hover/textbox:opacity-100',
                (infoOpen || deleteOpen) && 'opacity-100',
              )}
              onClick={handleEdit}
            >
              <Edit3 className="h-4 w-4" />
            </Button>
            <Popover open={infoOpen} onOpenChange={setInfoOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="actionButton"
                  size="icon"
                  className={cn(
                    'opacity-0 transition-opacity',
                    'group-focus-within/textbox:opacity-100 group-hover/textbox:opacity-100',
                    (infoOpen || deleteOpen) && 'opacity-100',
                  )}
                  onMouseLeave={() => {
                    setInfoOpen(false);
                  }}
                  onMouseUp={(e) => {
                    shouldUnfocusInfo.current = true;
                    e.currentTarget.blur();
                  }}
                >
                  <Info className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                className="w-fit border-[0.5px] border-border bg-background-dim p-2 text-xs drop-shadow-md"
                onCloseAutoFocus={(e) => {
                  if (shouldUnfocusInfo.current) {
                    e.preventDefault();
                    shouldUnfocusInfo.current = false;
                  }
                }}
              >
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sent</span>
                  <span className="w-2" />
                  <span>{formatTimestamp(m.created)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Modified</span>
                  <span className="w-2" />
                  <span>{formatTimestamp(m.modified)}</span>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Message bubble */}
          <ContextMenu>
            <ContextMenuTrigger>
              <div className="display-linebreak flex select-text flex-col gap-0.5 rounded-3xl bg-card px-4 py-2 text-card-foreground">
                {m.content}
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent onCloseAutoFocus={(e) => e.preventDefault()}>
              <ContextMenuItem onClick={handleEdit}>
                <Edit3 className="mr-2 h-4 w-4" />
                Edit
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => {
                  navigator.clipboard.writeText(m.id);
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy ID
              </ContextMenuItem>
              <ContextMenuSub
                open={contextDeleteOpen}
                onOpenChange={(open) => {
                  if (!open) setContextDeleteOpen(false);
                }}
              >
                <ContextMenuSubTrigger
                  className="text-red-500 hover:bg-destructive hover:text-destructive-foreground focus:bg-destructive focus:text-destructive-foreground data-[state=open]:bg-destructive data-[state=open]:text-destructive-foreground"
                  onClick={() => setContextDeleteOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </ContextMenuSubTrigger>
                <ContextMenuPortal>
                  <ContextMenuSubContent className="w-72 text-xs">
                    <div>
                      <div className="text-lg font-bold">Delete?</div>
                      <div className="text-muted-foreground">
                        Also removes subsequent messages.
                      </div>
                    </div>
                    <div className="h-4" />
                    <div className="flex w-full justify-end gap-2">
                      <Button variant="destructive" onClick={handleDelete}>
                        Confirm
                      </Button>
                    </div>
                  </ContextMenuSubContent>
                </ContextMenuPortal>
              </ContextMenuSub>
            </ContextMenuContent>
          </ContextMenu>
        </div>
      </div>
    );
  },
);

const AssistantMessageComponent = React.memo(
  ({
    m,
    onMessageEdit,
    onMessageDelete,
    onMessageRegen,
    onSetActiveChoice,
    streamingText,
    streamingReasoningText,
    isStreaming,
    isOmittedDuringStreaming,
  }: {
    m: AssistantMessage;
    onMessageEdit: (toEdit: string, id: string) => void;
    onMessageDelete: (id: string) => void;
    onMessageRegen: (id: string) => void;
    onSetActiveChoice: (id: string, choice: number) => void;
    streamingText?: string;
    streamingReasoningText?: string;
    isStreaming: boolean;
    isOmittedDuringStreaming: boolean;
  }) => {
    const [infoOpen, setInfoOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [contextDeleteOpen, setContextDeleteOpen] = useState(false);
    const shouldUnfocusInfo = React.useRef(false);
    const shouldUnfocusDelete = React.useRef(false);

    const handlePrevChoice = React.useCallback(() => {
      onSetActiveChoice(m.id, m.activeChoice - 1);
    }, [m.id, m.activeChoice, onSetActiveChoice]);

    const handleNextChoice = React.useCallback(() => {
      onSetActiveChoice(m.id, m.activeChoice + 1);
    }, [m.id, m.activeChoice, onSetActiveChoice]);

    const handleEdit = React.useCallback(() => {
      onMessageEdit(m.choices[m.activeChoice].content, m.id);
    }, [m.activeChoice, m.choices, m.id, onMessageEdit]);

    const handleRegen = React.useCallback(() => {
      onMessageRegen(m.id);
    }, [m.id, onMessageRegen]);

    const handleDelete = React.useCallback(() => {
      onMessageDelete(m.id);
    }, [m.id, onMessageDelete]);

    const shouldShowSpinner =
      streamingText === '' && streamingReasoningText === '';

    // Trick to avoid space shrinking when no streaming text is present
    if (streamingText === '') streamingText = '\u00A0';

    const shouldShowReasoning =
      m.choices[m.activeChoice].reasoning_details || streamingReasoningText;

    return (
      <div
        className={cn(
          isStreaming && 'pointer-events-none',
          isStreaming && isOmittedDuringStreaming && 'opacity-50',
          'group/textbox flex w-full flex-col self-start',
        )}
      >
        <ContextMenu>
          <ContextMenuTrigger>
            <div className="px-4">
              {shouldShowReasoning && (
                <ReasoningBlock isStreaming={!!streamingReasoningText}>
                  {streamingReasoningText ||
                    m.choices[m.activeChoice].reasoning_details}
                </ReasoningBlock>
              )}
              {shouldShowSpinner && (
                <div className="flex w-fit items-center justify-center gap-2 rounded-xl bg-background-dim px-4 text-xs text-muted-foreground">
                  <LoaderCircle className="my-2 h-4 w-4 animate-spin" />
                  <span>Thinking...</span>
                </div>
              )}
            </div>

            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkBreaks]}
              className="markdown break-words px-4"
            >
              {streamingText || streamingReasoningText
                ? streamingText
                : m.choices[m.activeChoice].content}
            </ReactMarkdown>
          </ContextMenuTrigger>

          <ContextMenuContent onCloseAutoFocus={(e) => e.preventDefault()}>
            <ContextMenuItem onClick={handleRegen}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Regenerate
            </ContextMenuItem>
            <ContextMenuItem onClick={handleEdit}>
              <Edit3 className="mr-2 h-4 w-4" />
              Edit
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => {
                navigator.clipboard.writeText(m.id);
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy ID
            </ContextMenuItem>
            <ContextMenuSub
              open={contextDeleteOpen}
              onOpenChange={(open) => {
                if (!open) setContextDeleteOpen(false);
              }}
            >
              <ContextMenuSubTrigger
                className="text-red-500 hover:bg-destructive hover:text-destructive-foreground focus:bg-destructive focus:text-destructive-foreground data-[state=open]:bg-destructive data-[state=open]:text-destructive-foreground"
                onClick={() => setContextDeleteOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </ContextMenuSubTrigger>
              <ContextMenuPortal>
                <ContextMenuSubContent className="w-72 text-xs">
                  <div>
                    <div className="text-lg font-bold">Delete?</div>
                    <div className="text-muted-foreground">
                      Removes all message choices and subsequent messages.
                    </div>
                  </div>
                  <div className="h-4" />
                  <div className="flex w-full justify-end gap-2">
                    <Button variant="destructive" onClick={handleDelete}>
                      Confirm
                    </Button>
                  </div>
                </ContextMenuSubContent>
              </ContextMenuPortal>
            </ContextMenuSub>
            {m.choices.length > 1 && (
              <>
                <Separator className="my-1" />
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={m.activeChoice === 0}
                    onClick={handlePrevChoice}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {m.activeChoice + 1} / {m.choices.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={m.activeChoice === m.choices.length - 1}
                    onClick={handleNextChoice}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </ContextMenuContent>
        </ContextMenu>
        {/* Action buttons */}
        <div
          className={cn(
            streamingText !== undefined && 'pointer-events-none opacity-0',
            'flex items-center gap-0.5 text-xs text-muted-foreground',
          )}
        >
          <div
            className={cn(
              'flex select-none items-center',
              m.choices.length === 1 && 'hidden',
            )}
          >
            <Button
              variant="actionButton"
              size="icon"
              disabled={m.activeChoice === 0}
              onClick={handlePrevChoice}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {m.activeChoice + 1} / {m.choices.length}
            <Button
              variant="actionButton"
              size="icon"
              disabled={m.activeChoice === m.choices.length - 1}
              onClick={handleNextChoice}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center">
            <Popover open={infoOpen} onOpenChange={setInfoOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="actionButton"
                  size="icon"
                  onMouseLeave={() => {
                    setInfoOpen(false);
                  }}
                  onMouseUp={(e) => {
                    shouldUnfocusInfo.current = true;
                    e.currentTarget.blur();
                  }}
                >
                  <Info className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                className="w-fit border-[0.5px] border-border bg-background-dim p-2 text-xs drop-shadow-md"
                onCloseAutoFocus={(e) => {
                  if (shouldUnfocusInfo.current) {
                    e.preventDefault();
                    shouldUnfocusInfo.current = false;
                  }
                }}
              >
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sent</span>
                  <span className="w-2" />
                  <span>
                    {formatTimestamp(m.choices[m.activeChoice].created)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Modified</span>
                  <span className="w-2" />
                  <span>
                    {formatTimestamp(m.choices[m.activeChoice].modified)}
                  </span>
                </div>
                {m.choices[m.activeChoice].generated_with && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Generated with
                    </span>
                    <span className="w-2" />
                    <span>{m.choices[m.activeChoice].generated_with}</span>
                  </div>
                )}
              </PopoverContent>
            </Popover>
            <Button variant="actionButton" size="icon" onClick={handleRegen}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="actionButton" size="icon" onClick={handleEdit}>
              <Edit3 className="h-4 w-4" />
            </Button>
            <Popover open={deleteOpen} onOpenChange={setDeleteOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="actionButton"
                  size="icon"
                  className="hover:text-red-500 focus:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                className="border-[0.5px] border-border bg-background-dim p-4 text-xs drop-shadow-md"
                onCloseAutoFocus={(e) => {
                  if (shouldUnfocusDelete.current) {
                    e.preventDefault();
                    shouldUnfocusDelete.current = false;
                  }
                }}
              >
                <div>
                  <div className="text-lg font-bold">Delete?</div>
                  <div className="text-muted-foreground">
                    Removes all message choices and subsequent messages.
                  </div>
                </div>
                <div className="h-4" />
                <div className="flex w-full justify-end gap-2">
                  <PopoverClose asChild>
                    <Button
                      variant="outline"
                      onMouseDown={() => {
                        shouldUnfocusDelete.current = true;
                      }}
                    >
                      Cancel
                    </Button>
                  </PopoverClose>
                  <Button variant="destructive" onClick={handleDelete}>
                    Confirm
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    );
  },
);

const PromptMessageComponent = React.memo(
  ({
    m,
    onMessageDelete,
    onSwapPrompt,
    isStreaming,
    isOmittedDuringStreaming,
  }: {
    m: ResolvedPromptMessage;
    isStreaming: boolean;
    isOmittedDuringStreaming: boolean;
    onMessageDelete: (id: string) => void;
    onSwapPrompt: (oldId: string) => void;
  }) => {
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [contextDeleteOpen, setContextDeleteOpen] = useState(false);
    const shouldUnfocusDelete = React.useRef(false);

    const disabled = m.title === null || m.content === null;

    const handleDelete = React.useCallback(() => {
      onMessageDelete(m.id);
    }, [m.id, onMessageDelete]);

    const handleOnSwapPrompt = useCallback(() => {
      onSwapPrompt(m.id);
    }, [m.id, onSwapPrompt]);

    return (
      <div
        className={cn(
          isStreaming && 'pointer-events-none',
          isStreaming && isOmittedDuringStreaming && 'opacity-50',
          'group/textbox flex w-full flex-col items-end',
        )}
      >
        <div className="flex w-fit max-w-[400px] gap-0.5">
          {/* Action buttons */}
          <div className="flex items-center justify-end gap-0.5 text-xs text-muted-foreground">
            <div className="flex items-center">
              <Popover open={deleteOpen} onOpenChange={setDeleteOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="actionButton"
                    size="icon"
                    className={cn(
                      'opacity-0 transition-opacity hover:text-red-500 focus:text-red-500 group-focus-within/textbox:opacity-100 group-hover/textbox:opacity-100',
                      deleteOpen && 'opacity-100',
                    )}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  side="top"
                  className="border-[0.5px] border-border bg-background-dim p-4 text-xs drop-shadow-md"
                  onCloseAutoFocus={(e) => {
                    if (shouldUnfocusDelete.current) {
                      e.preventDefault();
                      shouldUnfocusDelete.current = false;
                    }
                  }}
                >
                  <div>
                    <div className="text-lg font-bold">Delete?</div>
                    <div className="text-muted-foreground">
                      Also removes subsequent messages.
                    </div>
                  </div>
                  <div className="h-4" />
                  <div className="flex w-full justify-end gap-2">
                    <PopoverClose asChild>
                      <Button
                        variant="outline"
                        onMouseDown={() => {
                          shouldUnfocusDelete.current = true;
                        }}
                      >
                        Cancel
                      </Button>
                    </PopoverClose>
                    <Button variant="destructive" onClick={handleDelete}>
                      Confirm
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                variant="actionButton"
                size="icon"
                className={cn(
                  'opacity-0 transition-opacity group-focus-within/textbox:opacity-100 group-hover/textbox:opacity-100',
                  deleteOpen && 'opacity-100',
                )}
                onClick={handleOnSwapPrompt}
              >
                <ArrowLeftRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Message bubble */}
          <ContextMenu>
            <ContextMenuTrigger>
              <Link
                to={`/p/${m.promptId}`}
                className={cn(
                  'group/promptbox over:bg-card-hover flex gap-2 rounded-xl border-[0.5px] border-border bg-background-dim p-4',
                  disabled && 'pointer-events-none opacity-50',
                )}
                aria-disabled={disabled}
              >
                {disabled ? (
                  <TriangleAlert className="h-5 w-5 flex-shrink-0" />
                ) : m.messageType === 'user-prompt' ? (
                  <Notebook className="h-5 w-5 flex-shrink-0" />
                ) : (
                  <SquareTerminal className="h-5 w-5 flex-shrink-0" />
                )}
                <div className="flex flex-col gap-2">
                  <div className="text-lg font-bold leading-none">
                    {disabled ? 'Unknown' : m.title}
                  </div>
                </div>
                <ExternalLink className="mx-2 h-4 w-4 flex-shrink-0 self-center text-muted-foreground group-hover/promptbox:text-foreground group-focus/promptbox:text-foreground" />
              </Link>
            </ContextMenuTrigger>
            <ContextMenuContent onCloseAutoFocus={(e) => e.preventDefault()}>
              <ContextMenuItem onClick={handleOnSwapPrompt}>
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                Swap
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => {
                  navigator.clipboard.writeText(m.id);
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy ID
              </ContextMenuItem>
              <ContextMenuSub
                open={contextDeleteOpen}
                onOpenChange={(open) => {
                  if (!open) setContextDeleteOpen(false);
                }}
              >
                <ContextMenuSubTrigger
                  className="text-red-500 hover:bg-destructive hover:text-destructive-foreground focus:bg-destructive focus:text-destructive-foreground data-[state=open]:bg-destructive data-[state=open]:text-destructive-foreground"
                  onClick={() => setContextDeleteOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </ContextMenuSubTrigger>
                <ContextMenuPortal>
                  <ContextMenuSubContent className="w-72 text-xs">
                    <div>
                      <div className="text-lg font-bold">Delete?</div>
                      <div className="text-muted-foreground">
                        Also removes subsequent messages.
                      </div>
                    </div>
                    <div className="h-4" />
                    <div className="flex w-full justify-end gap-2">
                      <Button variant="destructive" onClick={handleDelete}>
                        Confirm
                      </Button>
                    </div>
                  </ContextMenuSubContent>
                </ContextMenuPortal>
              </ContextMenuSub>
            </ContextMenuContent>
          </ContextMenu>
        </div>
      </div>
    );
  },
);

const Messages = React.memo(
  ({
    messages,
    onMessageEdit,
    onSwapPrompt,
    onMessageDelete,
    onSetActiveChoice,
    onMessageRegen,
    isStreaming,
    messageBeingStreamed,
    streamingText,
    streamingReasoningText,
  }: {
    messages: Chat['messages'];
    onMessageEdit: (toEdit: string, id: string) => void;
    onSwapPrompt: (oldId: string) => void;
    onMessageDelete: (id: string) => void;
    onSetActiveChoice: (id: string, choice: number) => void;
    onMessageRegen: (id: string) => void;
    isStreaming: boolean;
    messageBeingStreamed: string | null;
    streamingText: string;
    streamingReasoningText: string;
  }) => {
    return (
      <div className="mx-auto flex max-w-[800px] flex-col gap-4 p-4">
        {messages.map((m, index) => {
          // Find the index of the message being streamed
          const streamedMessageIndex =
            isStreaming && messageBeingStreamed
              ? messages.findIndex((msg) => msg.id === messageBeingStreamed)
              : -1;

          // Determine if this message should be omitted during streaming
          const isOmittedDuringStreaming =
            isStreaming &&
            streamedMessageIndex !== -1 &&
            index > streamedMessageIndex;

          if (m.messageType === 'user') {
            return (
              <UserMessageComponent
                key={m.id}
                m={m as UserMessage}
                isStreaming={isStreaming}
                isOmittedDuringStreaming={isOmittedDuringStreaming}
                onMessageEdit={onMessageEdit}
                onMessageDelete={onMessageDelete}
              />
            );
          }

          if (m.messageType === 'assistant') {
            const isStreamedMessage =
              isStreaming && messageBeingStreamed === m.id;

            return (
              <AssistantMessageComponent
                key={m.id}
                m={m as AssistantMessage}
                isStreaming={isStreaming}
                isOmittedDuringStreaming={isOmittedDuringStreaming}
                onMessageEdit={onMessageEdit}
                onMessageDelete={onMessageDelete}
                onMessageRegen={onMessageRegen}
                onSetActiveChoice={onSetActiveChoice}
                streamingText={isStreamedMessage ? streamingText : undefined}
                streamingReasoningText={
                  isStreamedMessage ? streamingReasoningText : undefined
                }
              />
            );
          }

          if (
            m.messageType === 'user-prompt' ||
            m.messageType === 'system-prompt'
          ) {
            return (
              <PromptMessageComponent
                key={m.id}
                m={m as ResolvedPromptMessage}
                isStreaming={isStreaming}
                isOmittedDuringStreaming={isOmittedDuringStreaming}
                onMessageDelete={onMessageDelete}
                onSwapPrompt={onSwapPrompt}
              />
            );
          }

          return null;
        })}
      </div>
    );
  },
);

export default Messages;
