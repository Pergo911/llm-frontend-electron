import { useParams } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { Chat, DisplayMessage } from '@/common/types';
import { MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import TitleBar from './ui/title-bar';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem } from './ui/breadcrumb';
import ChatInputBar from './chat-input-bar';
import Messages from './messages';
import { formatTimestamp, setWindowTitle } from '../utils/utils';
import { ChatOperations } from '../utils/chat-operations';

function EmptyChatTitle({ title }: { title: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-0.5 p-4">
      <MessageCircle className="h-16 w-16" />
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-muted-foreground">
        Start typing or{' '}
        <button className="font-bold hover:underline">add a prompt</button>
      </p>
    </div>
  );
}

function ChatTitle({ title, timestamp }: { title: string; timestamp: number }) {
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
}

export default function ChatPage() {
  const { id } = useParams();
  const [chat, setChat] = useState<Chat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [displayMessages, setDisplayMessages] = useState<Array<DisplayMessage>>(
    [],
  );

  useEffect(() => {
    if (chat) {
      setWindowTitle(chat.title);
      const display = async () => {
        const messages = await ChatOperations.buildDisplayMessages(chat);
        setDisplayMessages(messages);
      };

      display();
    }
  }, [chat]);

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
    };

    getChat();
  }, [id]);

  useEffect(() => {
    if (error) {
      toast.error(`Error: ${error}`);
    }
  }, [error]);

  const handleOnSetActiveChoice = useCallback(
    async (id: string, choice: number) => {
      if (chat) {
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
      }
    },
    [chat],
  );

  const handleSend = useCallback(
    async (t: string, as: 'user' | 'assistant') => {
      if (chat) {
        const { newChat, error } = await ChatOperations.upsertMessage(
          chat,
          as,
          t,
        );

        if (error || !newChat) {
          setError(error);
          return;
        }

        setChat(newChat);
      }
    },
    [chat],
  );

  const handleOnMessageDelete = useCallback(
    async (id: string) => {
      if (chat) {
        const { newChat, error } = await ChatOperations.deleteMessages(
          chat,
          id,
        );

        if (error || !newChat) {
          setError(error);
          return;
        }

        setChat(newChat);
      }
    },
    [chat],
  );

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
          {displayMessages.length === 0 ? (
            <EmptyChatTitle title={chat?.title ?? ''} />
          ) : (
            <>
              <ChatTitle
                title={chat?.title ?? ''}
                timestamp={chat?.timestamp ?? 0}
              />
              <Messages
                messages={displayMessages}
                onMessageEdit={(id: string, choice?: number) => ({})}
                onMessageDelete={handleOnMessageDelete}
                onSetActiveChoice={handleOnSetActiveChoice}
                onMessageRegen={(id: string) => ({})}
              />
            </>
          )}
        </div>
        <ChatInputBar onSend={handleSend} onAddPrompt={() => {}} />
      </div>
    </div>
  );
}
