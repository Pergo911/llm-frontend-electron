/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
/* eslint-disable no-nested-ternary */
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useCallback, memo, useRef } from 'react';
import {
  Chat,
  ChatInputBarActions,
  StreamingMessageHandle,
} from '@/common/types';
import { MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import ChatInputBar from './chat-input-bar';
import Messages from './messages';
import { formatTimestamp, setWindowTitle } from '../utils/utils';
import { ChatOperations } from '../utils/chat-operations';
import { EditMessageModal, EditMessageModalRef } from './modal-edit';
import { PromptSelectModal, PromptSelectModalRef } from './modal-prompt-select';
import { Button } from './ui/button';

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
      <div className="flex h-full flex-col items-center justify-center gap-2 p-4">
        <MessageCircle className="h-16 w-16 ease-out animate-in fade-in slide-in-from-bottom" />
        <h1 className="select-text text-2xl font-bold ease-out animate-in fade-in slide-in-from-bottom">
          {title}
        </h1>
        <div className="text-muted-foreground ease-out animate-in fade-in">
          <span>Start typing or </span>
          <Button variant="outline" onClick={onPromptAdd}>
            Add a prompt
          </Button>
        </div>
      </div>
    );
  },
);

const ChatTitle = memo(
  ({ title, timestamp }: { title: string; timestamp: number }) => {
    return (
      <div className="m-auto flex max-w-[800px] flex-col items-center justify-center gap-2 p-4">
        <MessageCircle className="h-16 w-16" />
        <h1 className="select-text text-2xl font-bold">{title}</h1>
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [chat, setChat] = useState<Chat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const nav = useNavigate();
  const [isStreaming, setIsStreaming] = useState(false);
  const [overrideCanSend, setOverrideCanSend] = useState(false);
  const chatInputBarActionRef = useRef<ChatInputBarActions>(null);
  const streamHandleRef = useRef<StreamingMessageHandle>(null);
  const editMessageModalRef = useRef<EditMessageModalRef>(null);
  const promptSelectModalRef = useRef<PromptSelectModalRef>(null);
  const abortRequestRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'instant',
      });
    });
  }, []);

  useEffect(() => {
    const getChat = async () => {
      if (!id) {
        setError('Getting id route param failed.');
        return;
      }

      const { chat, error } =
        await window.electron.fileOperations.getChatById(id);

      if (!chat) {
        nav('/');
      }

      setError(error);
      setChat(chat);
      setWindowTitle(chat?.title ?? 'Chat');
      // eslint-disable-next-line no-use-before-define
      handleInputFocus();
    };

    getChat();

    return () => {
      setChat(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (error) {
      toast.error(`Error: ${error}`);
      setError(null);
    }
  }, [error]);

  useEffect(() => {
    if (chat && chat.messages.length !== 0) {
      const lastMessage = chat.messages[chat.messages.length - 1];

      if (lastMessage.messageType !== 'assistant') {
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

      if (abortRequestRef.current) {
        setError("Can't set choice while generating.");
        return;
      }

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

      if (abortRequestRef.current) {
        setError('Already generating.');
        return;
      }

      const chatRecovery = JSON.parse(JSON.stringify(chat));

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
        setChat(chatRecovery);
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

      if (
        finishReason &&
        !(finishReason === 'stop' || finishReason === 'abort')
      ) {
        setError(`Unexpected finish reason: ${finishReason}`);
      }
    },
    [chat],
  );

  const handleOnMessageRegen = useCallback(
    async (id: string) => {
      if (!chat) return;

      if (abortRequestRef.current) {
        setError('Already generating.');
        return;
      }

      // Find message index
      const messageIndex = chat.messages.findIndex((m) => m.id === id);
      if (messageIndex === -1) {
        setError('Message not found');
        return;
      }
      // Get messages up to the one to regenerate
      const messagesToInclude = chat.messages.slice(0, messageIndex);
      // Save current chat state
      const chatCopy = JSON.parse(JSON.stringify(chat));
      // Remove messages after the one to regenerate
      setChat({
        ...chat,
        messages: messagesToInclude,
      });
      // Build request messages
      const { resultMessages, error: brmError } =
        await ChatOperations.buildRequestMessages(messagesToInclude);
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
        setChat(chatCopy);
        return;
      }
      if (abortRequestRef.current) {
        setError('Request already in progress.');
        setIsStreaming(false);
        setChat(chatCopy);
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
        setChat(chatCopy);
        return;
      }
      if (finalMessage) {
        const { newChat: finalChat, error: insertError } =
          await ChatOperations.insertChoice(chatCopy, id, finalMessage);
        if (insertError || !finalChat) {
          setError(insertError || "Couldn't write regenerated response.");
          return;
        }
        setChat(finalChat);
      }
      if (
        finishReason &&
        !(finishReason === 'stop' || finishReason === 'abort')
      ) {
        setError(`Unexpected finish reason: ${finishReason}`);
      }
    },
    [chat],
  );

  const handleOnMessageDelete = useCallback(
    async (id: string) => {
      if (!chat) return;

      if (abortRequestRef.current) {
        setError("Can't delete while generating.");
        return;
      }

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

      if (abortRequestRef.current) {
        setError("Can't edit while generating.");
        return;
      }

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

    if (abortRequestRef.current) {
      setError("Can't add while generating.");
      return;
    }

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

  const handleOnSwapPrompt = useCallback(
    async (oldId: string, newId: string, newType: 'user' | 'system') => {
      if (!chat) return;

      if (abortRequestRef.current) {
        setError("Can't swap while generating.");
        return;
      }

      const { newChat, error } = await ChatOperations.editMessage(
        chat,
        oldId,
        newId,
        undefined,
        newType,
      );

      if (error || !newChat) {
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

  // Handle URL params received from the home page
  useEffect(() => {
    if (!chat) return;

    const handleAddLocal = async (id: string) => {
      const { prompt, error } =
        await window.electron.fileOperations.getPromptById(id);

      if (error || !prompt) {
        setError(error);
        return;
      }

      const { newChat, error: insertError } =
        await ChatOperations.insertMessage(
          chat,
          prompt.type === 'user' ? 'user-prompt' : 'system-prompt',
          id,
        );

      if (insertError || !newChat) {
        setError(error);
        return;
      }

      setChat(newChat);
    };

    if (searchParams.has('message')) {
      const message = searchParams.get('message');

      if (message) {
        handleSend(message, 'user');
        setSearchParams({}, { replace: true });
      }
    }

    if (searchParams.has('prompt')) {
      const prompt = searchParams.get('prompt');

      if (prompt) {
        handleAddLocal(prompt);
        setSearchParams({}, { replace: true });
      }
    }
  }, [handleOnAddPrompt, handleSend, searchParams, setSearchParams, chat]);

  return (
    <div className="h-[calc(100vh-48px)]">
      <div className="flex h-full flex-col rounded-t-xl bg-background">
        <div className="h-full overflow-y-auto" ref={scrollRef}>
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
                  onSwapPrompt={handleOnSwapPrompt}
                  onMessageDelete={handleOnMessageDelete}
                  onSetActiveChoice={handleOnSetActiveChoice}
                  onMessageRegen={handleOnMessageRegen}
                  onNeedsScroll={scrollToBottom}
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
        <EditMessageModal ref={editMessageModalRef} />
        <PromptSelectModal ref={promptSelectModalRef} />
      </div>
    </div>
  );
}
