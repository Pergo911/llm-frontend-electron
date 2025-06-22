/* eslint-disable no-nested-ternary */
/* eslint-disable react/no-unused-prop-types */
import {
  Message,
  MultipleChoiceMessage,
  PromptMessage,
  DisplayMessage,
  Chat,
  StreamingMessageHandle,
} from '@/common/types';
import {
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit3,
  ExternalLink,
  Info,
  Notebook,
  RefreshCw,
  SquareTerminal,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import React, { useEffect, useImperativeHandle, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import remarkGfm from 'remark-gfm';
import { PopoverClose } from '@radix-ui/react-popover';
import { Button } from './ui/button';
import { cn, formatTimestamp } from '../utils/utils';
import { ChatOperations } from '../utils/chat-operations';
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
  m: Message;
  onMessageEdit: (toEdit: string, id: string) => void;
  onMessageDelete: (id: string) => void;
  needsAnimate?: boolean;
}>(({ m, onMessageEdit, onMessageDelete, needsAnimate }) => {
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
    <div className="group/textbox flex w-full flex-col items-end">
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
              Sent {formatTimestamp(m.timestamp)}
            </PopoverContent>
          </Popover>
        </div>

        {/* Message bubble */}
        <ContextMenu>
          <ContextMenuTrigger>
            <div
              className={cn(
                needsAnimate && 'animate-in fade-in slide-in-from-bottom-3',
                'display-linebreak flex w-fit select-text flex-col gap-0.5 break-all rounded-3xl bg-card px-4 py-2 text-card-foreground',
              )}
            >
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
            <Separator className="my-1" />
            <div className="p-2 text-xs leading-none text-muted-foreground">
              Sent {formatTimestamp(m.timestamp)}
            </div>
          </ContextMenuContent>
        </ContextMenu>
      </div>
    </div>
  );
});

const AssistantMessageComponent = React.memo<{
  m: MultipleChoiceMessage;
  onMessageEdit: (toEdit: string, id: string, choice: number) => void;
  onMessageDelete: (id: string) => void;
  onMessageRegen: (id: string) => void;
  onSetActiveChoice: (id: string, choice: number) => void;
}>(
  ({
    m,
    onMessageEdit,
    onMessageDelete,
    onMessageRegen,
    onSetActiveChoice,
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
      onMessageEdit(m.choices[m.activeChoice].content, m.id, m.activeChoice);
    }, [m.activeChoice, m.choices, m.id, onMessageEdit]);

    const handleRegen = React.useCallback(() => {
      onMessageRegen(m.id);
    }, [m.id, onMessageRegen]);

    const handleDelete = React.useCallback(() => {
      onMessageDelete(m.id);
    }, [m.id, onMessageDelete]);

    // Extract reasoning text within <think></think> tags from message content
    const text = React.useMemo(() => {
      const reasoningStartText =
        m.choices[m.activeChoice].content.split('<think>') || [];
      const reasoningEndText = reasoningStartText[1]
        ? reasoningStartText[1].split('</think>')
        : [];
      return {
        reasoning:
          reasoningStartText[1] && reasoningEndText[0]
            ? reasoningEndText[0].trim()
            : '',
        reasoningEnd: `${reasoningStartText[0] || ''}${reasoningEndText?.[1] || ''}`,
      };
    }, [m.choices, m.activeChoice]);

    return (
      <div className="group/textbox flex w-full flex-col gap-0.5 self-start">
        <ContextMenu>
          <ContextMenuTrigger>
            {text.reasoning && (
              <div className="px-4 py-2">
                <ReasoningBlock isStreaming={false}>
                  {text.reasoning}
                </ReasoningBlock>
              </div>
            )}
            <div className="h-0.5" />
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              className="markdown break-all px-4 py-2"
            >
              {text.reasoningEnd}
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
            <Separator className="my-1" />
            <div className="p-2 text-xs leading-none text-muted-foreground">
              Sent {formatTimestamp(m.choices[m.activeChoice].timestamp)}
            </div>
          </ContextMenuContent>
        </ContextMenu>
        {/* Action buttons */}
        <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
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
                {`Sent ${formatTimestamp(m.choices[m.activeChoice].timestamp)}`}
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
    isConcat,
    onMessageDelete,
    onSwapPrompt,
    needsAnimate,
  }: {
    m: PromptMessage;
    isConcat: boolean;
    onMessageDelete: (id: string) => void;
    onSwapPrompt: (
      oldId: string,
      newId: string,
      newType: 'user' | 'system',
    ) => void;
    needsAnimate?: boolean;
  }) => {
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [contextDeleteOpen, setContextDeleteOpen] = useState(false);
    const shouldUnfocusDelete = React.useRef(false);
    const modalRef = React.useRef<PromptSelectModalRef>(null);

    const disabled = m.promptId === '';

    const handleDelete = React.useCallback(() => {
      onMessageDelete(m.id);
    }, [m.id, onMessageDelete]);

    const handleSwapPrompt = React.useCallback(async () => {
      if (!modalRef.current) return;

      const result = await modalRef.current.promptUser();

      if (!result) return;

      onSwapPrompt(m.id, result.id, result.type);
    }, [m.id, onSwapPrompt]);

    return (
      <div className="group/textbox flex w-full flex-col items-end">
        {isConcat && <div className="text-muted-foreground">+</div>}
        <div
          className={cn(
            needsAnimate && 'animate-in fade-in slide-in-from-bottom-3',
            'flex w-fit max-w-[400px] gap-0.5',
          )}
        >
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
                onClick={handleSwapPrompt}
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
                  'group/promptbox flex gap-2 rounded-xl border-[0.5px] border-border bg-background-dim p-4 text-card-foreground hover:bg-card-hover',
                  disabled && 'pointer-events-none opacity-50',
                )}
                aria-disabled={disabled}
              >
                {disabled ? (
                  <TriangleAlert className="h-5 w-5 flex-shrink-0" />
                ) : m.type === 'user' ? (
                  <Notebook className="h-5 w-5 flex-shrink-0" />
                ) : (
                  <SquareTerminal className="h-5 w-5 flex-shrink-0" />
                )}
                <div className="flex flex-col gap-2">
                  <div className="text-lg font-bold leading-none">
                    {disabled ? 'Unknown' : m.title}
                  </div>
                  <div
                    className={cn(
                      'text-xs text-muted-foreground',
                      disabled && 'invisible',
                    )}
                  >
                    <span className="font-bold">
                      {m.content ? m.content.split(' ').length : 0}
                    </span>{' '}
                    words • Sent as{' '}
                    <span className="font-bold">
                      {m.type === 'user' ? 'user' : 'system'}
                    </span>
                  </div>
                </div>
                <ExternalLink className="mx-2 h-4 w-4 flex-shrink-0 self-center text-muted-foreground group-hover/promptbox:text-foreground group-focus/promptbox:text-foreground" />
              </Link>
            </ContextMenuTrigger>
            <ContextMenuContent onCloseAutoFocus={(e) => e.preventDefault()}>
              <ContextMenuItem onClick={handleSwapPrompt}>
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
        <PromptSelectModal ref={modalRef} />
      </div>
    );
  },
);

const StreamingAssistantMessageComponent = React.memo(
  React.forwardRef<StreamingMessageHandle, { isStreaming: boolean }>(
    ({ isStreaming }, ref) => {
      const [text, setText] = useState('');
      const [reasoningText, setReasoningText] = useState('');
      const foundReasoningStart = React.useRef(false);
      const foundReasoningEnd = React.useRef(false);
      const isReasoning = React.useRef(false);

      useImperativeHandle(ref, () => ({
        addToken: (token) => {
          setText((prev) => {
            let newText = prev;
            let toAdd = token;

            if (toAdd === '<think>') {
              foundReasoningStart.current = true;
              isReasoning.current = true;
              toAdd = '';
              return newText;
            }

            if (toAdd === '</think>') {
              foundReasoningEnd.current = true;
              isReasoning.current = false;
              toAdd = '';
              return newText;
            }

            if (foundReasoningStart.current && !foundReasoningEnd.current) {
              setReasoningText((prevReasoning) => prevReasoning + toAdd);
            } else {
              newText += toAdd;
            }

            return newText;
          });
        },
      }));

      useEffect(() => {
        if (!isStreaming) {
          setText('');
          setReasoningText('');
          foundReasoningStart.current = false;
          foundReasoningEnd.current = false;
        }
      }, [isStreaming]);

      return (
        <div
          className={cn(
            'group/textbox hidden w-full flex-col gap-0.5 self-start',
            isStreaming && 'flex',
          )}
        >
          {reasoningText && (
            <ReasoningBlock isStreaming={isReasoning.current}>
              {reasoningText}
            </ReasoningBlock>
          )}
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            className="markdown px-4 py-2"
          >
            {text && `${text} ■`}
          </ReactMarkdown>
          {!text && !reasoningText && (
            <span className="animate-pulse px-4 py-2 font-bold">
              Thinking...
            </span>
          )}
          {/* Action buttons here keep spacing the same */}
          <div className="flex items-center gap-0.5 text-xs text-muted-foreground opacity-0">
            <div className="flex items-center">
              <Button
                variant="actionButton"
                size="icon"
                className="opacity-0 transition-opacity group-hover/textbox:opacity-100"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      );
    },
  ),
);

const Messages = React.memo(
  ({
    messages,
    onMessageEdit,
    onSwapPrompt,
    onMessageDelete,
    onSetActiveChoice,
    onMessageRegen,
    onNeedsScroll,
    isStreaming,
    streamHandle,
  }: {
    messages: Chat['messages'];
    onMessageEdit: (toEdit: string, id: string, choice?: number) => void;
    onSwapPrompt: (
      oldId: string,
      newId: string,
      newType: 'user' | 'system',
    ) => void;
    onMessageDelete: (id: string) => void;
    onSetActiveChoice: (id: string, choice: number) => void;
    onMessageRegen: (id: string) => void;
    onNeedsScroll: () => void;
    isStreaming: boolean;
    streamHandle: React.MutableRefObject<StreamingMessageHandle | null>;
  }) => {
    const [displayMessages, setDisplayMessages] = React.useState<
      Array<DisplayMessage>
    >([]);
    const needsAnimate = React.useRef<boolean>(false);
    const willNeedScroll = React.useRef<boolean>(false);
    const prevMRef = React.useRef<PromptMessage['type'] | null>(null);

    useEffect(() => {
      const resolveMessages = async () => {
        const resolvedMessages =
          await ChatOperations.buildDisplayMessages(messages);

        // Scroll to bottom on first render
        if (displayMessages.length === 0 && resolvedMessages.length !== 0) {
          willNeedScroll.current = true;
        }

        // Scroll to bottom if new non-assistant messages are added
        if (
          displayMessages.length !== 0 &&
          resolvedMessages.length > displayMessages.length &&
          resolvedMessages[resolvedMessages.length - 1].type !== 'assistant'
        ) {
          willNeedScroll.current = true;
        }

        // Animates new messages
        if (
          displayMessages.length !== 0 &&
          displayMessages.length < resolvedMessages.length
        ) {
          needsAnimate.current = true;
        }
        setDisplayMessages(resolvedMessages);
      };

      resolveMessages();

      prevMRef.current = null;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages]);

    useEffect(() => {
      if (willNeedScroll.current) {
        onNeedsScroll();
        willNeedScroll.current = false;
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [displayMessages]);

    useEffect(() => {
      if (isStreaming) {
        onNeedsScroll();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isStreaming]);

    return (
      <div className="mx-auto flex max-w-[800px] flex-col gap-4 p-4">
        {displayMessages.map((m, i) => {
          if (m.type === 'user') {
            prevMRef.current = null;

            return (
              <UserMessageComponent
                key={m.item.id}
                m={m.item as Message}
                onMessageEdit={onMessageEdit}
                onMessageDelete={onMessageDelete}
                needsAnimate={needsAnimate.current}
              />
            );
          }

          if (m.type === 'assistant') {
            prevMRef.current = null;

            return (
              <AssistantMessageComponent
                key={m.item.id}
                m={m.item as MultipleChoiceMessage}
                onMessageEdit={onMessageEdit}
                onMessageDelete={onMessageDelete}
                onMessageRegen={onMessageRegen}
                onSetActiveChoice={onSetActiveChoice}
              />
            );
          }

          if (m.type === 'prompt') {
            const mitem = m.item as PromptMessage;
            let isConcat = false;

            if (prevMRef.current === mitem.type) {
              isConcat = true;
            }

            prevMRef.current = mitem.type;

            return (
              <PromptMessageComponent
                key={m.item.id}
                m={mitem}
                isConcat={isConcat}
                onMessageDelete={onMessageDelete}
                onSwapPrompt={onSwapPrompt}
                needsAnimate={needsAnimate.current}
              />
            );
          }

          return null;
        })}
        <StreamingAssistantMessageComponent
          ref={streamHandle}
          isStreaming={isStreaming}
        />
      </div>
    );
  },
);

export default Messages;
