/* eslint-disable react/no-unused-prop-types */
import {
  Message,
  MultipleChoiceMessage,
  PromptMessage,
  DisplayMessage,
} from '@/common/types';
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Edit2,
  Edit3,
  Notebook,
  RefreshCw,
  SquareTerminal,
  Trash2,
} from 'lucide-react';
import React, { act } from 'react';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { cn, formatTimestamp } from '../utils/utils';

const UserMessageComponent = React.memo(
  React.forwardRef<
    HTMLDivElement,
    {
      m: Message;
      onMessageEdit: (id: string) => {};
      onMessageDelete: (id: string) => {};
    }
  >(({ m, onMessageEdit, onMessageDelete }, ref) => {
    const handleDelete = React.useCallback(() => {
      onMessageDelete(m.id);
    }, [m.id, onMessageDelete]);

    const handleEdit = React.useCallback(() => {
      onMessageEdit(m.id);
    }, [m.id, onMessageEdit]);

    return (
      <div className="group/textbox flex w-full justify-end">
        <div
          ref={ref}
          className="flex max-w-[700px] flex-col gap-0.5 self-end animate-in fade-in slide-in-from-bottom-3"
        >
          <div className="pr-4 text-right text-xs text-muted-foreground">
            {formatTimestamp(m.timestamp)}
          </div>
          <div className="display-linebreak w-fit self-end rounded-3xl bg-card px-4 py-2 text-card-foreground">
            {m.content}
          </div>
          {/* Action buttons */}
          <div className="flex items-center justify-end gap-0.5 text-xs text-muted-foreground">
            <div className="flex items-center">
              <Button
                variant="actionButton"
                size="icon"
                className="opacity-0 transition-opacity hover:text-red-500 group-hover/textbox:opacity-100"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="actionButton"
                size="icon"
                className="opacity-0 transition-opacity group-hover/textbox:opacity-100"
                onClick={handleEdit}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            </div>
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
      onMessageEdit: (id: string, choice?: number) => {};
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

      const handleRegen = React.useCallback(() => {
        onMessageRegen(m.id);
      }, [m.id, onMessageRegen]);

      const handleEdit = React.useCallback(() => {
        onMessageEdit(m.id, m.activeChoice);
      }, [m.id, m.activeChoice, onMessageEdit]);

      const handleDelete = React.useCallback(() => {
        onMessageDelete(m.id);
      }, [m.id, onMessageDelete]);

      return (
        <div
          ref={ref}
          className="group/textbox flex w-full flex-col gap-0.5 self-start"
        >
          <div className="pl-4 text-xs text-muted-foreground">
            {formatTimestamp(m.choices[m.activeChoice].timestamp)}
          </div>
          <div className="display-linebreak markdown px-4 py-2">
            <ReactMarkdown className="m-0">
              {m.choices[m.activeChoice].content}
            </ReactMarkdown>
          </div>
          {/* Action buttons */}
          <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
            <div
              className={cn(
                'flex items-center',
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
              <Button
                variant="actionButton"
                size="icon"
                className="opacity-0 transition-opacity group-hover/textbox:opacity-100"
                onClick={handleRegen}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="actionButton"
                size="icon"
                className="opacity-0 transition-opacity group-hover/textbox:opacity-100"
                onClick={handleEdit}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button
                variant="actionButton"
                size="icon"
                className="opacity-0 transition-opacity hover:text-red-500 group-hover/textbox:opacity-100"
                onClick={handleDelete}
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
      onMessageDelete: (id: string) => {};
    }
  >(({ m, onMessageDelete }, ref) => {
    const handleDelete = React.useCallback(() => {
      onMessageDelete(m.id);
    }, [m.id, onMessageDelete]);

    return (
      <div className="group/textbox flex w-full justify-end">
        <div
          ref={ref}
          className="group/textbox flex w-fit max-w-[400px] flex-col gap-0.5 self-end animate-in fade-in slide-in-from-bottom-3"
        >
          <div className="pr-4 text-right text-xs text-muted-foreground">
            Added prompt
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
          {/* Action buttons */}
          <div className="flex items-center justify-end gap-0.5 text-xs text-muted-foreground">
            <div className="flex items-center">
              <Button
                variant="actionButton"
                size="icon"
                className="opacity-0 transition-opacity hover:text-red-500 group-hover/textbox:opacity-100"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }),
);

const Messages = React.memo(
  ({
    messages,
    onMessageEdit,
    onMessageDelete,
    onSetActiveChoice,
    onMessageRegen,
  }: {
    messages: Array<DisplayMessage>;
    onMessageEdit: (id: string, choice?: number) => {};
    onMessageDelete: (id: string) => {};
    onSetActiveChoice: (id: string, choice: number) => {};
    onMessageRegen: (id: string) => {};
  }) => {
    const lastMessageRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      if (lastMessageRef.current) {
        lastMessageRef.current.scrollIntoView({ behavior: 'instant' });
      }
    }, [messages]);

    return (
      <div className="mx-auto flex max-w-[800px] flex-col gap-4 p-4">
        {messages.map((m, i) => {
          const ref = i === messages.length - 1 ? lastMessageRef : undefined;

          if (m.type === 'user') {
            return (
              <UserMessageComponent
                key={m.item.id}
                m={m.item as Message}
                ref={ref}
                onMessageEdit={onMessageEdit}
                onMessageDelete={onMessageDelete}
              />
            );
          }

          if (m.type === 'assistant') {
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
            return (
              <PromptMessageComponent
                key={m.item.id}
                m={m.item as PromptMessage}
                ref={ref}
                onMessageDelete={onMessageDelete}
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
