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
  ChevronLeft,
  ChevronRight,
  Edit,
  Edit3,
  Notebook,
  RefreshCw,
  SquareTerminal,
  Trash2,
} from 'lucide-react';
import React, { useEffect, useImperativeHandle, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import remarkGfm from 'remark-gfm';
import { Button } from './ui/button';
import { cn, formatTimestamp } from '../utils/utils';
import { ChatOperations } from '../utils/chat-operations';

const UserMessageComponent = React.memo(
  React.forwardRef<
    HTMLDivElement,
    {
      m: Message;
      onMessageEdit: (toEdit: string, id: string) => {};
      onMessageDelete: (id: string) => {};
      needsAnimate?: boolean;
    }
  >(({ m, onMessageEdit, onMessageDelete, needsAnimate }, ref) => {
    const handleDelete = React.useCallback(() => {
      onMessageDelete(m.id);
    }, [m.id, onMessageDelete]);

    const handleEdit = React.useCallback(() => {
      onMessageEdit(m.content, m.id);
    }, [m.content, m.id, onMessageEdit]);

    return (
      <div className="group/textbox flex w-full flex-col items-end">
        <div className="mb-2 w-full text-center text-xs text-muted-foreground">
          {formatTimestamp(m.timestamp)}
        </div>

        <div className="flex max-w-[90%] flex-wrap-reverse justify-end gap-0.5">
          {/* Action buttons */}
          <div className="flex h-fit w-fit min-w-[88px] gap-0.5 text-xs text-muted-foreground">
            <Button
              variant="actionButton"
              size="icon"
              className="opacity-0 transition-opacity hover:text-red-500 focus:text-red-500 group-focus-within/textbox:opacity-100 group-hover/textbox:opacity-100"
              onClick={handleDelete}
              title="Delete message"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="actionButton"
              size="icon"
              className="opacity-0 transition-opacity group-focus-within/textbox:opacity-100 group-hover/textbox:opacity-100"
              onClick={handleEdit}
              title="Edit message"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
          </div>

          {/* Message bubble */}
          <div
            ref={ref}
            className={cn(
              needsAnimate && 'animate-in fade-in slide-in-from-bottom-3',
              'display-linebreak flex w-fit flex-col gap-0.5 rounded-3xl bg-card px-4 py-2 text-card-foreground',
            )}
          >
            {m.content}
          </div>
        </div>
      </div>
    );
  }),
);

const AssistantMessageComponent = React.memo(
  // eslint-disable-next-line react/no-unused-prop-types
  React.forwardRef<
    HTMLDivElement,
    {
      m: MultipleChoiceMessage;
      onMessageEdit: (toEdit: string, id: string, choice: number) => {};
      onMessageDelete: (id: string) => {};
      onMessageRegen: (id: string) => {};
      onSetActiveChoice: (id: string, choice: number) => {};
    }
  >(
    (
      { m, onMessageEdit, onMessageDelete, onMessageRegen, onSetActiveChoice },
      ref,
    ) => {
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

      return (
        <div
          ref={ref}
          className="group/textbox flex w-full flex-col gap-0.5 self-start"
        >
          <div className="mb-2 w-full text-center text-xs text-muted-foreground">
            {formatTimestamp(m.choices[m.activeChoice].timestamp)}
          </div>
          <div className="display-linebreak markdown px-4 py-2">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              className="markdown prose prose-neutral max-w-none dark:prose-invert"
            >
              {m.choices[m.activeChoice].content}
            </ReactMarkdown>
          </div>
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
                title="Previous response"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {m.activeChoice + 1} / {m.choices.length}
              <Button
                variant="actionButton"
                size="icon"
                disabled={m.activeChoice === m.choices.length - 1}
                onClick={handleNextChoice}
                title="Next response"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center">
              <Button
                variant="actionButton"
                size="icon"
                className="opacity-0 transition-opacity group-focus-within/textbox:opacity-100 group-hover/textbox:opacity-100"
                onClick={handleRegen}
                title="Regenerate response"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="actionButton"
                size="icon"
                className="opacity-0 transition-opacity group-focus-within/textbox:opacity-100 group-hover/textbox:opacity-100"
                onClick={handleEdit}
                title="Edit message"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button
                variant="actionButton"
                size="icon"
                className="opacity-0 transition-opacity hover:text-red-500 focus:text-red-500 group-focus-within/textbox:opacity-100 group-hover/textbox:opacity-100"
                onClick={handleDelete}
                title="Delete message"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      );
    },
  ),
);

const PromptMessageComponent = React.memo(
  // eslint-disable-next-line react/no-unused-prop-types
  React.forwardRef<
    HTMLDivElement,
    {
      m: PromptMessage;
      isConcat: boolean;
      onMessageDelete: (id: string) => {};
      needsAnimate?: boolean;
    }
  >(({ m, isConcat, onMessageDelete, needsAnimate }, ref) => {
    const handleDelete = React.useCallback(() => {
      onMessageDelete(m.id);
    }, [m.id, onMessageDelete]);

    return (
      <div className="group/textbox flex w-full flex-col items-end">
        {isConcat && <div className="text-muted-foreground">+</div>}
        <div
          ref={ref}
          className={cn(
            needsAnimate && 'animate-in fade-in slide-in-from-bottom-3',
            'flex w-fit max-w-[400px] gap-0.5',
          )}
        >
          {/* Action buttons */}
          <div className="flex items-center justify-end gap-0.5 text-xs text-muted-foreground">
            <div className="flex items-center">
              <Button
                variant="actionButton"
                size="icon"
                className="opacity-0 transition-opacity hover:text-red-500 focus:text-red-500 group-focus-within/textbox:opacity-100 group-hover/textbox:opacity-100"
                onClick={handleDelete}
                title="Delete prompt"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Link
            to={`/p/${m.promptId}`}
            title="Edit prompt"
            className="group/promptbox flex gap-2 rounded-lg border border-sidebar-border bg-card p-2 text-card-foreground hover:bg-accent"
          >
            {m.type === 'user' ? (
              <Notebook className="h-5 w-5" />
            ) : (
              <SquareTerminal className="h-5 w-5" />
            )}
            <div className="flex flex-col gap-2">
              <div className="text-lg font-bold leading-none">{m.title}</div>
              <div className="text-xs text-muted-foreground">
                <span className="font-bold">{m.content.split(' ').length}</span>{' '}
                words • Sent as{' '}
                <span className="font-bold">
                  {m.type === 'user' ? 'user' : 'system'}
                </span>
              </div>
            </div>
            <Edit className="mx-2 h-4 w-4 self-center text-muted-foreground group-hover/promptbox:text-foreground group-focus/promptbox:text-foreground" />
          </Link>
        </div>
      </div>
    );
  }),
);

const StreamingAssistantMessageComponent = React.memo(
  React.forwardRef<StreamingMessageHandle, { isStreaming: boolean }>(
    ({ isStreaming }, ref) => {
      const [text, setText] = useState('');

      useImperativeHandle(ref, () => ({
        addToken: (token) => {
          setText((prev) => prev + token);
        },
      }));

      useEffect(() => {
        if (!isStreaming) {
          setText('');
        }
      }, [isStreaming]);

      return (
        <div
          className={cn(
            'group/textbox hidden w-full flex-col gap-0.5 self-start',
            isStreaming && 'flex',
          )}
        >
          <div className="mb-2 w-full animate-pulse text-center text-xs text-muted-foreground duration-1000">
            Thinking...
          </div>
          <div className="display-linebreak markdown px-4 py-2">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              className="markdown prose prose-neutral max-w-none dark:prose-invert"
            >
              {text}
            </ReactMarkdown>
          </div>
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
    onMessageDelete,
    onSetActiveChoice,
    onMessageRegen,
    isStreaming,
    streamHandle,
  }: {
    messages: Chat['messages'];
    onMessageEdit: (toEdit: string, id: string, choice?: number) => {};
    onMessageDelete: (id: string) => {};
    onSetActiveChoice: (id: string, choice: number) => {};
    onMessageRegen: (id: string) => {};
    isStreaming: boolean;
    streamHandle: React.MutableRefObject<StreamingMessageHandle | null>;
  }) => {
    const [displayMessages, setDisplayMessages] = React.useState<
      Array<DisplayMessage>
    >([]);
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const needsScroll = React.useRef<boolean>(false);
    const needsAnimate = React.useRef<boolean>(false);
    const prevMRef = React.useRef<PromptMessage['type'] | null>(null);

    useEffect(() => {
      const resolveMessages = async () => {
        const resolvedMessages =
          await ChatOperations.buildDisplayMessages(messages);

        // If new messages are added, scroll to the bottom
        if (displayMessages.length < resolvedMessages.length)
          needsScroll.current = true;

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
      if (needsScroll.current && scrollRef.current) {
        requestAnimationFrame(() => {
          scrollRef.current?.scrollIntoView({
            behavior: 'instant',
            block: 'start',
          });
        });

        needsScroll.current = false;
      }
    }, [displayMessages]);

    return (
      <div className="mx-auto flex max-w-[800px] flex-col gap-4 p-4">
        {displayMessages.map((m, i) => {
          const ref = i === displayMessages.length - 1 ? scrollRef : undefined;

          if (m.type === 'user') {
            prevMRef.current = null;

            return (
              <UserMessageComponent
                key={m.item.id}
                m={m.item as Message}
                ref={ref}
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
                ref={ref}
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
                ref={ref}
                onMessageDelete={onMessageDelete}
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
