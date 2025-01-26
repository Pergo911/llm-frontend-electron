/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
/* eslint-disable no-nested-ternary */
import { useParams } from 'react-router-dom';
import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { Chat, ChatInputBarActions } from '@/common/types';
import { MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import TitleBar from './ui/title-bar';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem } from './ui/breadcrumb';
import ChatInputBar from './chat-input-bar';
import Messages from './messages';
import { formatTimestamp, setWindowTitle } from '../utils/utils';
import { ChatOperations } from '../utils/chat-operations';
import { ConfirmDeleteRequest, ConfirmDeleteRequestRef } from './modal-delete';
import { EditMessageModal, EditMessageModalRef } from './modal-edit';

const EmptyChatTitle = memo(
  ({ title, onInputFocus }: { title: string; onInputFocus: () => void }) => {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-0.5 p-4">
        <MessageCircle className="h-16 w-16" />
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground animate-in fade-in">
          <button
            className="font-bold hover:underline active:font-normal active:no-underline"
            onClick={onInputFocus}
          >
            Start typing
          </button>{' '}
          <span> or </span>
          <button className="font-bold hover:underline active:font-normal active:no-underline">
            add a prompt
          </button>
        </p>
      </div>
    );
  },
);

const ChatTitle = memo(
  ({ title, timestamp }: { title: string; timestamp: number }) => {
    return (
      <div className="m-auto flex max-w-[800px] flex-col items-center justify-center gap-0.5 p-4">
        <MessageCircle className="h-16 w-16" />
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground">
          Created {formatTimestamp(timestamp)}
        </p>
        <div className="h-5 min-w-full max-w-[700px] bg-gradient-to-r from-transparent via-sidebar-border to-transparent bg-[length:100%_1px] bg-bottom bg-no-repeat" />
        <div className="h-5" />
      </div>
    );
  },
);

export default function ChatPage() {
  const { id } = useParams();
  const [chat, setChat] = useState<Chat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const chatInputBarActionRef = useRef<ChatInputBarActions>(null);
  const deleteDialogRef = useRef<ConfirmDeleteRequestRef>(null);
  const editMessageModalRef = useRef<EditMessageModalRef>(null);

  useEffect(() => {
    const getChat = async () => {
      if (!id) {
        setError('Getting id route param failed.');
        return;
      }

      const { chat, error } =
        await window.electron.fileOperations.getChatById(id);

      setError(error);
      setChat(chat);
      setWindowTitle(chat?.title ?? 'Chat');
    };

    getChat();

    return () => {
      setChat(null);
    };
  }, [id]);

  useEffect(() => {
    if (error) {
      toast.error(`Error: ${error}`);
      setError(null);
    }
  }, [error]);

  const handleOnSetActiveChoice = useCallback(
    async (id: string, choice: number) => {
      if (!chat) return;

      const { newChat, error } = await ChatOperations.setActiveChoice(
        chat,
        id,
        choice,
      );

      if (error || !newChat) {
        setError(error);
        return;
      }

      setChat(newChat);
    },
    [chat],
  );

  const handleSend = useCallback(
    async (t: string, as: 'user' | 'assistant') => {
      if (!chat) return;

      const { newChat, error } = await ChatOperations.insertMessage(
        chat,
        as,
        t,
      );

      if (error || !newChat) {
        setError(error);
        return;
      }

      setChat(newChat);
    },
    [chat],
  );

  const handleOnMessageDelete = useCallback(
    async (id: string) => {
      if (!chat) return;

      if (!deleteDialogRef.current) {
        setError("Couldn't get delete confirm dialog");
        return;
      }

      const confirmed = await deleteDialogRef.current.confirm();

      if (!confirmed) return;

      const { newChat, error } = await ChatOperations.deleteMessages(chat, id);

      if (error || !newChat) {
        setError(error);
        return;
      }

      setChat(newChat);
    },
    [chat],
  );

  const handleOnMessageEdit = useCallback(
    async (toEdit: string, id: string, choice?: number) => {
      if (!chat) return;

      if (!editMessageModalRef.current) {
        setError("Couldn't get message editing dialog.");
        return;
      }

      const newContent = await editMessageModalRef.current.promptUser(toEdit);

      if (newContent === null) return;

      const { newChat, error } = await ChatOperations.editMessage(
        chat,
        id,
        newContent,
        choice,
      );

      if (error) {
        setError(error);
        return;
      }

      setChat(newChat);
    },
    [chat],
  );

  const handleInputFocus = useCallback(() => {
    chatInputBarActionRef.current?.focus();
  }, []);

  return (
    <div className="h-[calc(100vh-64px)]">
      <TitleBar>
        <Breadcrumb className="flex h-full items-center">
          <BreadcrumbList>
            <BreadcrumbItem>
              <MessageCircle className="h-4 w-4" />
              {chat?.title ?? 'Chat'}
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </TitleBar>
      <div className="flex h-full w-full flex-col rounded-t-xl bg-background">
        <div className="h-full overflow-y-auto">
          {chat ? (
            chat.messages.length === 0 ? (
              <EmptyChatTitle
                title={chat.title}
                onInputFocus={handleInputFocus}
              />
            ) : (
              <>
                <ChatTitle title={chat.title} timestamp={chat.timestamp} />
                <Messages
                  messages={chat.messages}
                  onMessageEdit={handleOnMessageEdit}
                  onMessageDelete={handleOnMessageDelete}
                  onSetActiveChoice={handleOnSetActiveChoice}
                  onMessageRegen={(id: string) => ({})}
                />
              </>
            )
          ) : null}
        </div>
        <ChatInputBar
          onSend={handleSend}
          onAddPrompt={() => {}}
          actionRef={chatInputBarActionRef}
        />
        <ConfirmDeleteRequest ref={deleteDialogRef} />
        <EditMessageModal ref={editMessageModalRef} />
      </div>
    </div>
  );
}
