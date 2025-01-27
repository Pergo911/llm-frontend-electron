/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
/* eslint-disable no-nested-ternary */
import { useParams } from 'react-router-dom';
import { useState, useEffect, useCallback, memo, useRef } from 'react';
import {
  Chat,
  ChatInputBarActions,
  StreamingMessageHandle,
} from '@/common/types';
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
import { PromptSelectModal, PromptSelectModalRef } from './modal-prompt-select';

const EmptyChatTitle = memo(
  ({
    title,
    onInputFocus,
    onPromptAdd,
  }: {
    title: string;
    onInputFocus: () => void;
    onPromptAdd: () => void;
  }) => {
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
          <button
            className="font-bold hover:underline active:font-normal active:no-underline"
            onClick={onPromptAdd}
          >
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
  const [isStreaming, setIsStreaming] = useState(false);
  const [overrideCanSend, setOverrideCanSend] = useState(false);
  const chatInputBarActionRef = useRef<ChatInputBarActions>(null);
  const streamHandleRef = useRef<StreamingMessageHandle>(null);
  const deleteDialogRef = useRef<ConfirmDeleteRequestRef>(null);
  const editMessageModalRef = useRef<EditMessageModalRef>(null);
  const promptSelectModalRef = useRef<PromptSelectModalRef>(null);
  const abortRequestRef = useRef<AbortController | null>(null);

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

  useEffect(() => {
    if (chat && chat.messages.length !== 0) {
      if (chat.messages[chat.messages.length - 1].messageType !== 'assistant') {
        setOverrideCanSend(true);
      } else {
        setOverrideCanSend(false);
      }
    } else {
      setOverrideCanSend(false);
    }
  }, [chat]);

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

  const handleAbortStreaming = useCallback(() => {
    if (abortRequestRef.current) {
      abortRequestRef.current.abort();
      abortRequestRef.current = null;
      setIsStreaming(false);
    }
  }, []);

  const handleSend = useCallback(
    async (t: string, as: 'user' | 'assistant') => {
      if (!chat) return;

      const { newChat, error } = await ChatOperations.insertMessage(
        chat,
        as,
        t,
      );

      if (error || !newChat) {
        setError(error || "Couldn't write your message.");
        return;
      }

      setChat(newChat);

      if (as === 'assistant') return;

      if (abortRequestRef.current) {
        setError('Request already in progress.');
        return;
      }

      const { resultMessages, error: brmError } =
        await ChatOperations.buildRequestMessages(newChat.messages);

      if (brmError || !resultMessages) {
        setError(
          brmError || "Couldn't convert messages to API response format.",
        );
        return;
      }

      setIsStreaming(true);

      // eslint-disable-next-line no-promise-executor-return
      await new Promise((resolve) => setTimeout(resolve, 0));

      if (!streamHandleRef.current) {
        setError('No stream handle.');
        setIsStreaming(false);
        return;
      }

      const abortController = new AbortController();
      abortRequestRef.current = abortController;

      const {
        finalMessage,
        finishReason,
        error: requestError,
      } = await ChatOperations.streamingRequest(
        resultMessages,
        (t) => {
          streamHandleRef.current?.addToken(t);
        },
        abortRequestRef.current.signal,
      );

      setIsStreaming(false);
      abortRequestRef.current = null;

      if (requestError) {
        setError(requestError);
      }

      if (finalMessage) {
        const { newChat: finalChat, error: finalChatError } =
          await ChatOperations.insertMessage(
            newChat,
            'assistant',
            finalMessage,
          );

        if (finalChatError || !finalChat) {
          setError(finalChatError || "Couldn't write response.");
        }

        setChat(finalChat);
      }

      if (finishReason && finishReason !== 'stop') {
        setError(`Unexpected finish reason: ${finishReason}`);
      }
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

  const handleOnAddPrompt = useCallback(async () => {
    if (!chat) return;

    if (!promptSelectModalRef.current) {
      setError("Couldn't get the prompt selector dialog.");
      return;
    }

    const result = await promptSelectModalRef.current.promptUser();

    if (!result) return;

    const { id, type } = result;

    const { newChat, error } = await ChatOperations.insertMessage(
      chat,
      type === 'user' ? 'user-prompt' : 'system-prompt',
      id,
    );

    if (error || !newChat) {
      setError(error);
      return;
    }

    setChat(newChat);
  }, [chat]);

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
                onPromptAdd={handleOnAddPrompt}
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
                  isStreaming={isStreaming}
                  streamHandle={streamHandleRef}
                />
              </>
            )
          ) : null}
        </div>
        <ChatInputBar
          onSend={handleSend}
          onAddPrompt={handleOnAddPrompt}
          actionRef={chatInputBarActionRef}
          isStreaming={isStreaming}
          onAbort={handleAbortStreaming}
          overrideCanSend={overrideCanSend}
        />
        <ConfirmDeleteRequest ref={deleteDialogRef} />
        <EditMessageModal ref={editMessageModalRef} />
        <PromptSelectModal ref={promptSelectModalRef} />
      </div>
    </div>
  );
}
