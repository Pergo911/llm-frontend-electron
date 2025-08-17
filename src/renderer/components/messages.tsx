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
  Tag,
  Scissors,
  ClipboardPaste,
  Edit2,
  Paperclip,
} from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import ReactMarkdown from 'react-markdown';
import { Link, useNavigate } from 'react-router-dom';
import remarkGfm from 'remark-gfm';
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
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from './ui/context-menu';
import {
  DeleteConfirmPopover,
  DeleteConfirmContextSub,
} from './confirm-delete';
import { InfoPopover, ACTION_BUTTON_FADE_CLASSES } from './message-shared';
import {
  ContextMenuWithBarContent,
  ContextMenuWithBarItem,
} from './context-menu-with-bar';

// Helper functions moved near top to avoid use-before-define issues
const deleteDescription = (
  type: 'user' | 'assistant' | 'prompt',
  hasChoices: boolean,
) => {
  if (type === 'assistant')
    return 'Removes all message choices and subsequent messages.';
  return 'Also removes subsequent messages.';
};

const useCopyIdHandler = (id: string) =>
  React.useCallback(() => {
    navigator.clipboard.writeText(id);
  }, [id]);

const getSelectedTextWithin = (el: HTMLElement | null): string | null => {
  if (!el) return null;
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  const ancestor = range.commonAncestorContainer as Node;
  // If selection intersects element at all, allow (more permissive than strict contains)
  if (el === ancestor || el.contains(ancestor)) {
    const text = sel.toString();
    return text.trim().length ? text : null;
  }
  return null;
};

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

    const [contextDeleteOpen, setContextDeleteOpen] = useState(false);
    const [hasSelection, setHasSelection] = useState(false);
    const contentRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
      const checkSelection = () => {
        const sel = window.getSelection();
        setHasSelection(!!sel && sel.toString().length > 0);
      };
      document.addEventListener('selectionchange', checkSelection);
      return () =>
        document.removeEventListener('selectionchange', checkSelection);
    }, []);

    const handleDelete = React.useCallback(() => {
      onMessageDelete(m.id);
    }, [m.id, onMessageDelete]);

    const handleEdit = React.useCallback(() => {
      onMessageEdit(m.content, m.id);
    }, [m.content, m.id, onMessageEdit]);

    const handleCopyBar = React.useCallback(() => {
      navigator.clipboard.writeText(window.getSelection()?.toString() || '');
    }, []);

    const handleCopyMessage = React.useCallback(() => {
      navigator.clipboard.writeText(m.content);
    }, [m.content]);

    return (
      <div
        className={cn(
          isStreaming && 'pointer-events-none',
          isStreaming && isOmittedDuringStreaming && 'opacity-50',
          'group/textbox my-2 flex w-full flex-col items-end',
        )}
      >
        <div className="flex max-w-[90%] flex-wrap-reverse items-center justify-end gap-0.5">
          {/* Action buttons */}
          <div className="flex h-fit w-fit min-w-[88px] gap-0.5 text-xs text-muted-foreground">
            <DeleteConfirmPopover
              open={deleteOpen}
              onOpenChange={setDeleteOpen}
              onConfirm={handleDelete}
              trigger={
                <Button
                  variant="actionButton"
                  size="icon"
                  className={cn(
                    ACTION_BUTTON_FADE_CLASSES,
                    'hover:text-red-500 focus:text-red-500',
                    (infoOpen || deleteOpen) && 'opacity-100',
                  )}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              }
              description={deleteDescription('user', false)}
            />
            <Button
              variant="actionButton"
              size="icon"
              className={cn(
                ACTION_BUTTON_FADE_CLASSES,
                (infoOpen || deleteOpen) && 'opacity-100',
              )}
              onClick={handleEdit}
            >
              <Edit3 className="h-4 w-4" />
            </Button>
            <InfoPopover
              open={infoOpen}
              onOpenChange={setInfoOpen}
              trigger={
                <Button
                  variant="actionButton"
                  size="icon"
                  className={cn(
                    ACTION_BUTTON_FADE_CLASSES,
                    (infoOpen || deleteOpen) && 'opacity-100',
                  )}
                >
                  <Info className="h-4 w-4" />
                </Button>
              }
              rows={[
                { label: 'Sent', value: formatTimestamp(m.created) },
                { label: 'Modified', value: formatTimestamp(m.modified) },
              ]}
            />
          </div>

          {/* Message bubble */}
          <ContextMenu>
            <ContextMenuTrigger>
              <div
                ref={contentRef}
                className="display-linebreak flex select-text flex-col gap-0.5 rounded-3xl bg-card px-4 py-2 text-card-foreground"
              >
                {m.content}
              </div>
            </ContextMenuTrigger>
            <ContextMenuWithBarContent
              barActions={
                hasSelection
                  ? [
                      {
                        key: 'copy',
                        label: 'Copy',
                        icon: <Copy className="h-4 w-4" />,
                        onClick: handleCopyBar,
                      },
                      {
                        key: 'cut',
                        label: 'Cut',
                        icon: <Scissors className="h-4 w-4" />,
                        onClick: () => {},
                        disabled: true,
                      },
                      {
                        key: 'paste',
                        label: 'Paste',
                        icon: <ClipboardPaste className="h-4 w-4" />,
                        onClick: () => {},
                        disabled: true,
                      },
                    ]
                  : []
              }
            >
              <ContextMenuWithBarItem onClick={handleEdit}>
                <Edit3 className="mr-2 h-4 w-4" />
                Edit
              </ContextMenuWithBarItem>
              <ContextMenuWithBarItem onClick={handleCopyMessage}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Message
              </ContextMenuWithBarItem>
              <ContextMenuWithBarItem
                onClick={() => {
                  navigator.clipboard.writeText(m.id);
                }}
              >
                <Tag className="mr-2 h-4 w-4" />
                Copy ID
              </ContextMenuWithBarItem>
              <DeleteConfirmContextSub
                open={contextDeleteOpen}
                onOpenChange={setContextDeleteOpen}
                onConfirm={handleDelete}
                description={deleteDescription('user', false)}
                triggerChildren={
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </>
                }
              />
            </ContextMenuWithBarContent>
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
    const [hasSelection, setHasSelection] = useState(false);
    const contentRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
      const checkSelection = () => {
        const sel = window.getSelection();
        setHasSelection(!!sel && sel.toString().length > 0);
      };
      document.addEventListener('selectionchange', checkSelection);
      return () =>
        document.removeEventListener('selectionchange', checkSelection);
    }, []);

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

    const handleCopyBar = React.useCallback(() => {
      navigator.clipboard.writeText(window.getSelection()?.toString() || '');
    }, []);

    const handleCopyMessage = React.useCallback(() => {
      const baseContent =
        streamingText || streamingReasoningText
          ? streamingText || ''
          : m.choices[m.activeChoice].content;
      navigator.clipboard.writeText(baseContent);
    }, [streamingText, streamingReasoningText, m.choices, m.activeChoice]);

    const shouldShowSpinner =
      streamingText === '' && streamingReasoningText === '';

    const shouldShowReasoning =
      m.choices[m.activeChoice].reasoning_details || streamingReasoningText;

    return (
      <div
        className={cn(
          isStreaming && isOmittedDuringStreaming && 'opacity-50',
          'group/textbox mb-2 flex w-full flex-col self-start',
        )}
      >
        <ContextMenu>
          <ContextMenuTrigger>
            <div ref={contentRef}>
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
                {/* Show non-breaking space if empty */}
                {streamingText || streamingReasoningText
                  ? (streamingText ?? '').trim() === ''
                    ? '\u00A0'
                    : streamingText
                  : m.choices[m.activeChoice].content.trim() === ''
                    ? '\u00A0'
                    : m.choices[m.activeChoice].content}
              </ReactMarkdown>
            </div>
          </ContextMenuTrigger>

          <ContextMenuWithBarContent
            barActions={
              hasSelection
                ? [
                    {
                      key: 'copy',
                      label: 'Copy',
                      icon: <Copy className="h-4 w-4" />,
                      onClick: handleCopyBar,
                    },
                    {
                      key: 'cut',
                      label: 'Cut',
                      icon: <Scissors className="h-4 w-4" />,
                      onClick: () => {},
                      disabled: true,
                    },
                    {
                      key: 'paste',
                      label: 'Paste',
                      icon: <ClipboardPaste className="h-4 w-4" />,
                      onClick: () => {},
                      disabled: true,
                    },
                  ]
                : []
            }
          >
            <ContextMenuWithBarItem onClick={handleEdit}>
              <Edit3 className="mr-2 h-4 w-4" />
              Edit
            </ContextMenuWithBarItem>
            <ContextMenuWithBarItem onClick={handleRegen}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Regenerate
            </ContextMenuWithBarItem>
            <ContextMenuWithBarItem onClick={handleCopyMessage}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Message
            </ContextMenuWithBarItem>
            <ContextMenuWithBarItem
              onClick={() => {
                navigator.clipboard.writeText(m.id);
              }}
            >
              <Tag className="mr-2 h-4 w-4" />
              Copy ID
            </ContextMenuWithBarItem>
            <DeleteConfirmContextSub
              open={contextDeleteOpen}
              onOpenChange={setContextDeleteOpen}
              onConfirm={handleDelete}
              description={deleteDescription('assistant', m.choices.length > 1)}
              triggerChildren={
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              }
            />
            {m.choices.length > 1 && (
              <>
                <ContextMenuSeparator className="my-1" />
                <div className="flex items-center justify-between px-1">
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
          </ContextMenuWithBarContent>
        </ContextMenu>
        {/* Action buttons */}
        <div
          className={cn(
            isStreaming && 'pointer-events-none opacity-0',
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
            <DeleteConfirmPopover
              open={deleteOpen}
              onOpenChange={setDeleteOpen}
              onConfirm={handleDelete}
              trigger={
                <Button
                  variant="actionButton"
                  size="icon"
                  className="hover:text-red-500 focus:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              }
              description={deleteDescription('assistant', m.choices.length > 1)}
            />
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
    const navigate = useNavigate();
    const [infoOpen, setInfoOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [contextDeleteOpen, setContextDeleteOpen] = useState(false);

    const [hasSelection, setHasSelection] = useState(false);
    useEffect(() => {
      const checkSelection = () => {
        const sel = window.getSelection();
        setHasSelection(!!sel && sel.toString().length > 0);
      };
      document.addEventListener('selectionchange', checkSelection);
      return () =>
        document.removeEventListener('selectionchange', checkSelection);
    }, []);

    const handleCopyBar = React.useCallback(() => {
      navigator.clipboard.writeText(window.getSelection()?.toString() || '');
    }, []);

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
          'group/textbox my-2 flex w-full flex-col items-end',
        )}
      >
        <div className="flex max-w-[90%] flex-wrap-reverse items-center justify-end gap-0.5">
          {/* Action buttons */}
          <div className="flex h-fit w-fit min-w-[88px] gap-0.5 text-xs text-muted-foreground">
            <DeleteConfirmPopover
              open={deleteOpen}
              onOpenChange={setDeleteOpen}
              onConfirm={handleDelete}
              trigger={
                <Button
                  variant="actionButton"
                  size="icon"
                  className={cn(
                    ACTION_BUTTON_FADE_CLASSES,
                    'hover:text-red-500 focus:text-red-500',
                    (infoOpen || deleteOpen) && 'opacity-100',
                  )}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              }
              description={deleteDescription('prompt', false)}
            />
            <Button
              variant="actionButton"
              size="icon"
              className={cn(
                ACTION_BUTTON_FADE_CLASSES,
                (infoOpen || deleteOpen) && 'opacity-100',
              )}
              onClick={handleOnSwapPrompt}
            >
              <ArrowLeftRight className="h-4 w-4" />
            </Button>
            <InfoPopover
              open={infoOpen}
              onOpenChange={setInfoOpen}
              trigger={
                <Button
                  variant="actionButton"
                  size="icon"
                  className={cn(
                    ACTION_BUTTON_FADE_CLASSES,
                    (infoOpen || deleteOpen) && 'opacity-100',
                  )}
                >
                  <Info className="h-4 w-4" />
                </Button>
              }
              rows={[
                {
                  label: 'Type',
                  value:
                    m.messageType === 'user-prompt'
                      ? 'User Prompt'
                      : 'System Prompt',
                },
                { label: 'Sent', value: formatTimestamp(m.created) },
                { label: 'Modified', value: formatTimestamp(m.modified) },
              ]}
            />
          </div>

          {/* Message bubble */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ContextMenu>
              <ContextMenuTrigger>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/p/${m.promptId}`)}
                  className={cn(
                    'group h-6 gap-0.5 rounded-lg p-2 text-xs hover:text-foreground focus:text-foreground',
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
                  {disabled ? 'Unknown' : m.title}
                </Button>
              </ContextMenuTrigger>
              <ContextMenuWithBarContent
                barActions={
                  hasSelection
                    ? [
                        {
                          key: 'copy',
                          label: 'Copy',
                          icon: <Copy className="h-4 w-4" />,
                          onClick: handleCopyBar,
                        },
                      ]
                    : []
                }
              >
                <ContextMenuWithBarItem
                  onClick={() => navigate(`/p/${m.promptId}`)}
                  disabled={disabled}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open
                </ContextMenuWithBarItem>
                <ContextMenuWithBarItem onClick={handleOnSwapPrompt}>
                  <ArrowLeftRight className="mr-2 h-4 w-4" />
                  Swap
                </ContextMenuWithBarItem>
                <ContextMenuWithBarItem
                  onClick={() => {
                    navigator.clipboard.writeText(m.id);
                  }}
                >
                  <Tag className="mr-2 h-4 w-4" />
                  Copy ID
                </ContextMenuWithBarItem>
                <DeleteConfirmContextSub
                  open={contextDeleteOpen}
                  onOpenChange={setContextDeleteOpen}
                  onConfirm={handleDelete}
                  description={deleteDescription('prompt', false)}
                  triggerChildren={
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </>
                  }
                />
              </ContextMenuWithBarContent>
            </ContextMenu>
            <Paperclip className="mr-2 h-4 w-4" />
          </div>
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
      <div className="mx-auto flex max-w-[800px] flex-col p-4">
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
