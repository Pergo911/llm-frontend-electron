/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
/* eslint-disable no-nested-ternary */
import { useSearchParams } from 'react-router-dom';
import { useState, useEffect, useCallback, memo, useRef } from 'react';
import {
  Chat,
  ChatInputBarActions,
  Config,
  ModelsController,
  OpenRouterModel,
  ResolvedChat,
  ResolvedFolder,
  ResolvedPrompt,
  SaveFileController,
} from '@/common/types';
import { ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import ChatInputBar from './chat-input-bar';
import Messages from './messages';
import { formatTimestamp, setWindowTitle } from '../utils/utils';
import { ChatOperations } from '../utils/chat-operations';
import { EditMessageModal, EditMessageModalRef } from './modal-edit';
import { PromptSelectModal, PromptSelectModalRef } from './modal-prompt-select';
import { Button } from './ui/button';

const ChatTitle = memo(
  ({ chat, onPromptAdd }: { chat: Chat; onPromptAdd: () => void }) => {
    const { title, created, modified } = chat;

    const messageNum = chat.messages.length;

    return (
      <>
        <div className="m-auto flex max-w-[800px] flex-col items-start px-8 py-4">
          <h1 className="text-3xl font-bold text-primary">{title}</h1>
          <p className="text-xs text-muted-foreground">
            Created{' '}
            <span className="font-bold">{formatTimestamp(created)}</span> •{' '}
            Modified{' '}
            <span className="font-bold">{formatTimestamp(modified)}</span>
            <br />
            {messageNum > 0 ? (
              <>
                <span className="font-bold">{messageNum}</span> message
                {messageNum > 1 ? 's' : ''}
              </>
            ) : (
              'No messages'
            )}
          </p>
        </div>

        {messageNum === 0 && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-muted-foreground">
            <span>Start typing or </span>
            <Button variant="outline" onClick={onPromptAdd}>
              Add a prompt
            </Button>
          </div>
        )}
      </>
    );
  },
);

export default function ChatPage({
  chat,
  modelSelection,
  toggleReasoningPreference,
  controller,
  folders,
  prompts,
}: {
  chat: ResolvedChat;
  modelSelection: OpenRouterModel[] | null;
  toggleReasoningPreference: ModelsController['toggleReasoningPreference'];
  controller: SaveFileController;
  folders: ResolvedFolder[];
  prompts: ResolvedPrompt[];
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const messageBeingStreamed = useRef<string | null>(null); // null if we are not currently streaming
  const [streamingText, setStreamingText] = useState<string>('');
  const [streamingReasoningText, setStreamingReasoningText] =
    useState<string>('');
  const [overrideCanSend, setOverrideCanSend] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const chatInputBarActionRef = useRef<ChatInputBarActions>(null);
  const editMessageModalRef = useRef<EditMessageModalRef>(null);
  const promptSelectModalRef = useRef<PromptSelectModalRef>(null);
  const abortRequestRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    });
  }, []);

  const scrollToBottomInstant = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'instant',
      });
    });
  }, []);

  const scrollToTopInstant = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: 0,
        behavior: 'instant',
      });
    });
  }, []);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100; // 100px threshold

    setShowScrollButton(!isNearBottom);
  }, []);

  const handleInputFocus = () => {
    chatInputBarActionRef.current?.focus();
  };

  useEffect(() => {
    setWindowTitle(chat.title);
    handleInputFocus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(`Error: ${error}`);
      setError(null);
    }
  }, [error]);

  // `overrideCanSend` is set to true if the
  // last message is not an assistant message,
  // in which case we allow generation
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

  // Add scroll event listener
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    scrollElement.addEventListener('scroll', handleScroll);

    // eslint-disable-next-line consistent-return
    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  // On navigation,
  useEffect(() => {
    // reset scroll to top
    scrollToTopInstant();
    // and update button visibility if needed
    handleScroll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.id]);

  const handleOnSetActiveChoice = useCallback(
    (id: string, choice: number) => {
      if (abortRequestRef.current) {
        setError("Can't set choice while generating.");
        return;
      }

      const { error } = controller.chats.messages.setChoice(
        chat.id,
        id,
        choice,
      );

      if (error) setError(error);
    },
    [chat, controller.chats.messages],
  );

  const handleAbortStreaming = useCallback(() => {
    if (abortRequestRef.current) {
      abortRequestRef.current.abort();
      abortRequestRef.current = null;
    }
  }, []);

  const handleSend = useCallback(
    async (t: string, as: 'user' | 'assistant') => {
      if (abortRequestRef.current) {
        setError('Already generating.');
        return;
      }

      // t is empty if last message is already a user message
      // in which case, we proceed without adding t to the chat
      if (t !== '') {
        const { error } = controller.chats.messages.add(chat.id, as, t);

        if (error) {
          setError(error);
          return;
        }

        // If we added a message, scroll to the bottom
        scrollToBottomInstant();
      }

      // User manually adds an assistant message, don't proceed with generation
      if (as === 'assistant') return;

      // Convert to the format required by the API
      const { resultMessages, error: brmError } =
        await ChatOperations.buildRequestMessages(chat.messages);

      if (brmError || !resultMessages) {
        setError(
          brmError || "Couldn't convert messages to API response format.",
        );
        return;
      }

      // Add an empty assistant message
      // Text will be added as the response streams in
      const { error, messageId } = controller.chats.messages.add(
        chat.id,
        'assistant',
        '',
        undefined,
        modelSelection ? modelSelection[0].name : undefined,
      );

      if (error || !messageId) {
        setError(error || "Couldn't create assistant message.");
        return;
      }

      scrollToBottomInstant();

      setIsStreaming(true);
      messageBeingStreamed.current = messageId;
      setStreamingText('');
      setStreamingReasoningText('');

      const abortController = new AbortController();
      abortRequestRef.current = abortController;

      const {
        finalMessage,
        finalReasoning,
        finishReason,
        error: requestError,
      } = await ChatOperations.streamingRequest(
        resultMessages,
        (newToken, newReasoningToken) => {
          // eslint-disable-next-line no-unused-expressions
          newToken && setStreamingText((prev) => prev + newToken);
          // eslint-disable-next-line no-unused-expressions
          newReasoningToken &&
            setStreamingReasoningText((prev) => prev + newReasoningToken);
        },
        abortRequestRef.current.signal,
      );

      setIsStreaming(false);
      abortRequestRef.current = null;

      // Track whether we successfully wrote non-empty content to the message
      let writeSucceeded = false;

      if (requestError) {
        setError(requestError);
      }

      if (finalMessage || finalReasoning) {
        const { error: finalChatError } = controller.chats.messages.modify(
          chat.id,
          messageId,
          finalMessage ?? '',
          finalReasoning ?? undefined,
        );

        if (finalChatError) {
          setError(finalChatError || "Couldn't write response.");
        } else if (
          // Only mark success if something non-empty was actually produced
          (finalMessage && finalMessage.length > 0) ||
          (finalReasoning && finalReasoning.length > 0)
        ) {
          writeSucceeded = true;
        }
      }

      if (finishReason && !(finishReason === 'stop')) {
        toast.warning(`Unexpected finish reason: ${finishReason}`);
      }

      // Final cleanup: if the assistant message remains empty, remove it
      if (!writeSucceeded || (!finalMessage && !finalReasoning)) {
        const { error: deleteError } = controller.chats.messages.delete(
          chat.id,
          messageId,
        );
        if (deleteError) {
          setError(deleteError || "Couldn't delete empty message.");
        }
      }
    },
    [
      chat.id,
      chat.messages,
      controller.chats.messages,
      modelSelection,
      scrollToBottomInstant,
    ],
  );

  const handleOnMessageRegen = useCallback(
    async (id: string) => {
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

      // For restoration purposes
      const activeChoice =
        chat.messages[messageIndex].messageType === 'assistant'
          ? chat.messages[messageIndex].activeChoice
          : undefined;

      // Get messages up to the one to regenerate
      const messagesToInclude = chat.messages.slice(0, messageIndex);

      // Build request messages
      const { resultMessages, error: brmError } =
        await ChatOperations.buildRequestMessages(messagesToInclude);
      if (brmError || !resultMessages) {
        setError(
          brmError || "Couldn't convert messages to API response format.",
        );
        return;
      }

      // Add an empty choice to the message being regenerated
      const { error } = controller.chats.messages.addChoice(
        chat.id,
        id,
        '',
        undefined,
        modelSelection ? modelSelection[0].name : undefined,
      );

      if (error) {
        setError(error || "Couldn't create new choice.");
        return;
      }

      setIsStreaming(true);
      messageBeingStreamed.current = id;
      setStreamingText('');
      setStreamingReasoningText('');

      const abortController = new AbortController();
      abortRequestRef.current = abortController;

      const {
        finalMessage,
        finalReasoning,
        finishReason,
        error: requestError,
      } = await ChatOperations.streamingRequest(
        resultMessages,
        (newToken, newReasoningToken) => {
          // eslint-disable-next-line no-unused-expressions
          newToken && setStreamingText((prev) => prev + newToken);
          // eslint-disable-next-line no-unused-expressions
          newReasoningToken &&
            setStreamingReasoningText((prev) => prev + newReasoningToken);
        },
        abortRequestRef.current.signal,
      );

      setIsStreaming(false);
      abortRequestRef.current = null;

      // Track if we successfully wrote non-empty content to the new choice
      let writeSucceeded = false;

      if (requestError) {
        setError(requestError);
      }

      if (finalMessage) {
        const { error: finalChatError } = controller.chats.messages.modify(
          chat.id,
          id,
          finalMessage,
          finalReasoning ?? undefined,
        );

        if (finalChatError) {
          setError(finalChatError || "Couldn't write response.");
        } else if (
          (finalMessage && finalMessage.length > 0) ||
          (finalReasoning && finalReasoning.length > 0)
        ) {
          writeSucceeded = true;
        }
      }

      if (finishReason && finishReason !== 'stop') {
        toast.warning(`Unexpected finish reason: ${finishReason}`);
      }

      // Final cleanup: if the newly added choice remains empty, remove it and restore previous active choice
      if (!writeSucceeded || (!finalMessage && !finalReasoning)) {
        controller.chats.messages.deleteChoice(chat.id, id);
        if (activeChoice !== undefined)
          controller.chats.messages.setChoice(chat.id, id, activeChoice);
      }
    },
    [chat.id, chat.messages, controller.chats.messages, modelSelection],
  );

  const handleOnMessageDelete = useCallback(
    async (id: string) => {
      if (abortRequestRef.current) {
        setError("Can't delete while generating.");
        return;
      }

      const { error } = controller.chats.messages.delete(chat.id, id);

      if (error) setError(error);
    },
    [chat.id, controller.chats.messages],
  );

  const handleOnMessageEdit = useCallback(
    async (toEdit: string, id: string) => {
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

      const { error } = controller.chats.messages.modify(
        chat.id,
        id,
        newContent,
      );

      if (error) setError(error);
    },
    [chat.id, controller.chats.messages],
  );

  const handleOnAddPrompt = useCallback(async () => {
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

    const { error } = controller.chats.messages.add(
      chat.id,
      result.type,
      result.id,
    );

    if (error) {
      setError(error);
      return;
    }

    // If we added a prompt, scroll to the bottom
    scrollToBottomInstant();
  }, [chat.id, controller.chats.messages, scrollToBottomInstant]);

  const handleOnSwapPrompt = useCallback(
    async (oldId: string) => {
      if (abortRequestRef.current) {
        setError("Can't swap while generating.");
        return;
      }

      if (!promptSelectModalRef.current) {
        setError("Couldn't get prompt selector's ref.");
        return;
      }

      const res = await promptSelectModalRef.current.promptUser();

      if (!res) return;

      const { error } = await controller.chats.messages.modify(
        chat.id,
        oldId,
        res.id,
      );

      if (error) setError(error);
    },
    [chat.id, controller.chats.messages],
  );

  const handleReasoningToggle = useCallback(
    async (enabled: boolean) => {
      if (!modelSelection) {
        setError('Models not loaded');
        return;
      }

      if (!modelSelection[0].reasoning) {
        setError('Reasoning is not available for this model.');
        return;
      }

      const { error } = await toggleReasoningPreference(enabled);

      if (error) setError(error);
    },
    [modelSelection, toggleReasoningPreference],
  );

  // Handle URL params received from the home page
  useEffect(() => {
    const handleAddLocal = async (id: string) => {
      const prompt = prompts.find((p) => p.id === id);

      if (!prompt) {
        setError('Prompt not found');
        return;
      }

      const { error } = controller.chats.messages.add(
        chat.id,
        prompt.type,
        prompt.id,
      );

      if (error) setError(error);
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
  }, [
    chat.id,
    controller.chats.messages,
    handleSend,
    prompts,
    searchParams,
    setSearchParams,
  ]);

  // Add keyboard shortcuts
  // CTRL + L to focus input
  // CTRL + P to open prompt selector
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key.toLowerCase() === 'l') {
        event.preventDefault();
        handleInputFocus();
      } else if (event.ctrlKey && event.key.toLowerCase() === 'p') {
        event.preventDefault();
        // eslint-disable-next-line no-use-before-define
        handleOnAddPrompt();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleOnAddPrompt]);

  return (
    <div className="h-[calc(100vh-48px)]">
      <div className="flex h-full flex-col overflow-hidden rounded-t-3xl bg-background">
        <div
          className="h-full overflow-y-auto"
          ref={scrollRef}
          style={{ scrollbarGutter: 'stable' }}
        >
          <ChatTitle chat={chat} onPromptAdd={handleOnAddPrompt} />
          <Messages
            messages={chat.messages}
            onMessageEdit={handleOnMessageEdit}
            onSwapPrompt={handleOnSwapPrompt}
            onMessageDelete={handleOnMessageDelete}
            onSetActiveChoice={handleOnSetActiveChoice}
            onMessageRegen={handleOnMessageRegen}
            isStreaming={isStreaming}
            messageBeingStreamed={messageBeingStreamed.current}
            streamingText={streamingText}
            streamingReasoningText={streamingReasoningText}
          />
        </div>

        {/* Scroll to Bottom Button */}
        <div
          className={`absolute bottom-36 right-1/2 translate-x-1/2 text-muted-foreground transition-all duration-300 ease-in-out ${
            showScrollButton
              ? 'pointer-events-auto translate-y-0 opacity-100'
              : 'pointer-events-none translate-y-2 opacity-0'
          }`}
        >
          <Button
            variant="outline"
            onClick={scrollToBottom}
            className="rounded-full border border-border bg-background-dim text-xs font-bold opacity-80 shadow-lg transition-shadow duration-200 hover:shadow-xl"
            aria-label="Scroll to bottom"
          >
            Scroll down
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>

        <ChatInputBar
          onSend={handleSend}
          onAddPrompt={handleOnAddPrompt}
          actionRef={chatInputBarActionRef}
          isStreaming={isStreaming}
          onAbort={handleAbortStreaming}
          overrideCanSend={overrideCanSend}
          reasoningSelect={
            modelSelection && modelSelection.length > 0
              ? modelSelection[0].reasoning
                ? modelSelection[0].reasoning_preference
                : null
              : null
          }
          onReasoningToggle={handleReasoningToggle}
        />
        <EditMessageModal ref={editMessageModalRef} />
        <PromptSelectModal ref={promptSelectModalRef} folders={folders} />
      </div>
    </div>
  );
}
