import {
  Chat,
  Message,
  MultipleChoiceMessage,
  PromptMessage,
  DisplayMessage,
  RequestMessage,
  ChatMessage,
  Config,
} from '@/common/types';
import { generateUUID } from '@/common/uuid';
import OpenAI from 'openai';

/**
 * Converts a chat's messages into a display-friendly format
 * @param messageData Array of messages from a chat
 * @returns Promise<DisplayMessage[]> Array of display-ready messages with proper typing
 * @example
 * const chat = {
 *   messages: [
 *     { messageType: 'user', id: '1', choices: [{ content: 'Hello', timestamp: 123 }] },
 *     { messageType: 'assistant', id: '2', choices: [{ content: 'Hi!', timestamp: 124 }] }
 *   ]
 * };
 * const displayMessages = await convertChatToDisplayMessages(chat);
 */
const buildDisplayMessages = async (
  messageData: Chat['messages'],
): Promise<DisplayMessage[]> => {
  const messages = await Promise.all(
    messageData.map(async (m): Promise<DisplayMessage | null> => {
      if (m.messageType === 'user') {
        if (!m.choices) return null;

        return {
          type: 'user',
          item: {
            id: m.id,
            content: m.choices[0].content,
            timestamp: m.choices[0].timestamp,
          } as Message,
        };
      }

      if (m.messageType === 'assistant') {
        return {
          type: 'assistant',
          item: {
            id: m.id,
            activeChoice: m.activeChoice,
            choices: m.choices,
          } as MultipleChoiceMessage,
        };
      }

      if (
        m.messageType === 'user-prompt' ||
        m.messageType === 'system-prompt'
      ) {
        if (!m.promptId) return null;

        const { error, prompt, folder } =
          await window.electron.fileOperations.getPromptById(m.promptId);

        if (error || !prompt) return null;

        return {
          type: 'prompt',
          item: {
            id: m.id,
            promptId: prompt.id,
            type: prompt.type,
            title: prompt.title,
            content: prompt.content,
          } as PromptMessage,
        };
      }

      return null;
    }),
  );

  return messages.filter((e): e is DisplayMessage => e !== null);
};

/**
 * Converts chat messages into a format suitable for API requests
 * @param messageData Array of messages from a chat
 * @returns Promise containing either the formatted messages or an error
 * @example
 * const chat = {
 *   messages: [
 *     {
 *       messageType: 'user',
 *       id: 'msg1',
 *       choices: [{ content: 'Hello', timestamp: 123 }]
 *     },
 *     {
 *       messageType: 'assistant',
 *       id: 'msg2',
 *       choices: [{ content: 'Hi!', timestamp: 124 }]
 *     },
 *     {
 *       messageType: 'user-prompt',
 *       id: 'msg3',
 *       promptId: 'prompt1'
 *     }
 *   ]
 * };
 *
 * const { resultMessages, error } = await buildRequestMessages(chat.messages);
 * // resultMessages = [
 * //   { role: 'user', content: 'Hello' },
 * //   { role: 'assistant', content: 'Hi!' },
 * //   { role: 'user', content: 'Prompt content...' }
 * // ]
 *
 * @throws Will return error if:
 * - Message has no choices (for user/assistant messages)
 * - Choice index is invalid
 * - Message content is invalid
 * - Prompt message has no promptId
 * - Prompt cannot be fetched or has no content
 */
const buildRequestMessages = async (
  messageData: Chat['messages'],
): Promise<{
  resultMessages: RequestMessage[] | null;
  error: string | null;
}> => {
  try {
    const resultMessages = await Promise.all(
      messageData.map(async (m): Promise<RequestMessage> => {
        const role =
          // eslint-disable-next-line no-nested-ternary
          m.messageType === 'user' || m.messageType === 'assistant'
            ? m.messageType
            : m.messageType === 'user-prompt'
              ? 'user'
              : 'developer';

        let content: string;

        if (m.messageType === 'user' || m.messageType === 'assistant') {
          if (!m.choices?.length) {
            throw new Error(`Message ${m.id} has no choices`);
          }
          const choiceIndex = m.activeChoice ?? 0;
          if (choiceIndex >= m.choices.length) {
            throw new Error(
              `Invalid choice index ${choiceIndex} for message ${m.id}`,
            );
          }
          content = m.choices[choiceIndex].content;
          if (typeof content !== 'string') {
            throw new Error(`Invalid content for message ${m.id}`);
          }
        } else {
          if (!m.promptId) {
            throw new Error(`Prompt message ${m.id} has no promptId`);
          }
          const { prompt, error } =
            await window.electron.fileOperations.getPromptById(m.promptId);

          if (error || !prompt) {
            throw new Error(
              `Failed to get prompt ${m.promptId}: ${error || 'No prompt.'}`,
            );
          }

          content = prompt.content;
        }

        return { role, content };
      }),
    );

    return { resultMessages, error: null };
  } catch (e) {
    return { resultMessages: null, error: (e as Error).message };
  }
};

/**
 * Inserts a new message into a chat
 * @param chat The chat to add the message to
 * @param messageType Type of message to insert ('user', 'assistant', 'user-prompt', or 'system-prompt')
 * @param content Content of the message or prompt ID for prompt messages
 * @returns Object containing the updated chat or error
 * @example
 * const {newChat, error} = await insertMessage(chat, 'user', 'Hello world');
 * // Adds a new user message with content "Hello world"
 */
const insertMessage = async (
  chat: Chat,
  messageType: ChatMessage['messageType'],
  content: string,
): Promise<{ newChat: Chat | null; error: string | null }> => {
  if (content === '') {
    return { newChat: chat, error: null };
  }

  const isPromptMessage =
    messageType === 'user-prompt' || messageType === 'system-prompt';

  // Create deep copy
  const newChat: Chat = {
    ...chat,
    messages: chat.messages.map((msg) => ({
      ...msg,
      choices: msg.choices ? [...msg.choices] : undefined,
    })),
  };

  // Construct new message
  const newMessage: ChatMessage = {
    id: generateUUID('m'),
    messageType,
    activeChoice: isPromptMessage ? undefined : 0,
    choices: isPromptMessage ? undefined : [{ timestamp: Date.now(), content }],
    promptId: isPromptMessage ? content : undefined,
  };

  // Add message to chat
  newChat.messages.push(newMessage);

  // Write chat to file
  const { error } = await window.electron.fileOperations.writeChat(newChat);

  if (error) {
    return { newChat: null, error };
  }

  return { newChat, error: null };
};

/**
 * Adds a new choice to an assistant message
 * @param chat The chat containing the message
 * @param messageId ID of the message to add the choice to
 * @param content Content of the new choice
 * @returns Object containing the updated chat or error
 * @example
 * const {newChat, error} = await insertChoice(chat, "msg-123", "Alternative response");
 * // Adds a new choice to message "msg-123" with content "Alternative response"
 */
const insertChoice = async (
  chat: Chat,
  messageId: string,
  content: string,
): Promise<{ newChat: Chat | null; error: string | null }> => {
  // Find message
  const messageIndex = chat.messages.findIndex((i) => i.id === messageId);
  if (messageIndex === -1) {
    return { newChat: null, error: 'insertChoice: Message not found' };
  }

  // Create deep copy of the message
  const message = {
    ...chat.messages[messageIndex],
    choices: chat.messages[messageIndex].choices
      ? [...chat.messages[messageIndex].choices]
      : undefined,
  };

  // Adding choices is only valid on assistant messages
  if (message.messageType !== 'assistant' || message.choices === undefined) {
    return { newChat: null, error: 'insertChoice: Invalid message type' };
  }

  // Add choice
  message.choices.push({
    timestamp: Date.now(),
    content,
  });

  // Replace old message
  const newChat: Chat = { ...chat, messages: [...chat.messages] };
  newChat.messages[messageIndex] = message;

  // Write chat to file
  const { error } = await window.electron.fileOperations.writeChat(newChat);

  if (error) {
    return { newChat: null, error };
  }

  return { newChat, error: null };
};

/**
 * Edits the content of a message
 * @param chat The chat containing the message
 * @param id ID of the message to edit
 * @param content New content for the message
 * @param choice For assistant messages, index of the choice to edit
 * @returns Object containing the updated chat or error
 * @example
 * // Edit a user message
 * const {newChat, error} = await editMessage(chat, "msg-123", "Updated content");
 *
 * // Edit a specific choice in an assistant message
 * const {newChat, error} = await editMessage(chat, "msg-456", "New response", 1);
 */
const editMessage = async (
  chat: Chat,
  id: string,
  content: string,
  choice?: number,
): Promise<{ newChat: Chat | null; error: string | null }> => {
  // Find message
  const messageIndex = chat.messages.findIndex((m) => m.id === id);
  if (messageIndex === -1) {
    return { newChat: null, error: 'editMessage: Message not found' };
  }

  // Create deep copy of the message
  const message = {
    ...chat.messages[messageIndex],
    choices: chat.messages[messageIndex].choices
      ? [...chat.messages[messageIndex].choices]
      : undefined,
  };

  // Handle different message types
  if (message.messageType === 'assistant') {
    if (
      !message.choices ||
      choice === undefined ||
      choice >= message.choices.length
    ) {
      return { newChat: null, error: 'editMessage: Invalid choice index' };
    }
    message.choices[choice] = {
      timestamp: Date.now(),
      content,
    };
  } else if (message.messageType === 'user') {
    if (!message.choices) {
      return { newChat: null, error: 'editMessage: Message has no choices' };
    }
    message.choices[0] = {
      timestamp: Date.now(),
      content,
    };
  } else {
    return { newChat: null, error: 'editMessage: Invalid message type' };
  }

  // Create new chat with updated message
  const newChat: Chat = { ...chat, messages: [...chat.messages] };
  newChat.messages[messageIndex] = message;

  // Write chat to file
  const { error } = await window.electron.fileOperations.writeChat(newChat);

  if (error) {
    return { newChat: null, error };
  }

  return { newChat, error: null };
};

/**
 * Deletes messages from a chat
 * @param chat The chat to modify
 * @param id ID of the starting message to delete. Also deletes all subsequent messages.
 * @returns Object containing the updated chat or error
 * @example
 * const {newChat, error} = await deleteMessages(chat, "msg-123");
 * // Deletes message with ID "msg-123" and all subsequent messages
 */
const deleteMessages = async (chat: Chat, id: string) => {
  const messageIndex = chat.messages.findIndex((m) => m.id === id);

  if (messageIndex === -1)
    return { newChat: null, error: 'deleteMessages: Message not found' };

  const newChat: Chat = {
    ...chat,
    messages: chat.messages.slice(0, messageIndex),
  };

  const { error } = await window.electron.fileOperations.writeChat(newChat);

  return {
    newChat: error ? null : newChat,
    error,
  };
};

/**
 * Sets the active choice for a message with multiple choices.
 * @param chat - The chat containing the message
 * @param messageId - ID of the message to update
 * @param choice - Index of the choice to set as active
 * @returns Object containing the updated chat or error
 * @example
 * const chat = {
 *   title: "Example chat",
 *   id: "123",
 *   timestamp: 1234567890,
 *   messages: [{
 *     messageType: "assistant",
 *     id: "msg1",
 *     activeChoice: 0,
 *     choices: [
 *       { content: "First response", timestamp: 1234567890 },
 *       { content: "Alternative response", timestamp: 1234567891 }
 *     ]
 *   }]
 * };
 *
 * const {newChat, error} = await ChatOperations.setActiveChoice(chat, "msg1", 1);
 * // Sets second choice (index 1) as active for message "msg1"
 */
const setActiveChoice = async (
  chat: Chat,
  messageId: string,
  choice: number,
) => {
  const messageIndex = chat.messages.findIndex((m) => m.id === messageId);

  if (messageIndex === -1)
    return { newChat: null, error: 'setActiveChoice: Message not found' };

  if (chat.messages[messageIndex].messageType !== 'assistant')
    return { newChat: null, error: 'setActiveChoice: Message type mismatch' };

  const newChat: Chat = { ...chat, messages: [...chat.messages] };

  newChat.messages[messageIndex].activeChoice = choice;

  const { error } = await window.electron.fileOperations.writeChat(newChat);

  return {
    newChat: error ? null : newChat,
    error,
  };
};

let openAI: OpenAI | undefined;
let config: Config | undefined;

const streamingRequest = async (
  messages: RequestMessage[],
  onNewToken: (t: string) => void,
  abortSignal?: AbortSignal,
): Promise<{
  finalMessage: string | null;
  finishReason:
    | 'stop'
    | 'length'
    | 'tool_calls'
    | 'content_filter'
    | 'function_call'
    | 'abort'
    | null;
  error: string | null;
}> => {
  let finalMessage = '';
  let finishReason:
    | 'stop'
    | 'length'
    | 'tool_calls'
    | 'content_filter'
    | 'function_call'
    | 'abort'
    | null = null;

  try {
    const newConfig = await window.electron.fileOperations.getConfig();

    // Create new OpenAI instance if it doesn't exist or if config has changed
    if (
      !openAI ||
      !config ||
      config.apiKey !== newConfig.apiKey ||
      config.baseUrl !== newConfig.baseUrl
    ) {
      config = newConfig;
      openAI = new OpenAI({
        baseURL: config.baseUrl,
        apiKey: config.apiKey,
        dangerouslyAllowBrowser: true,
      });
    }

    const onAbort = (e: Event) => {
      finishReason = 'abort';
    };

    if (abortSignal) {
      abortSignal.addEventListener('abort', onAbort, { once: true });
    }

    // Always use latest values from config
    const completion = await openAI.chat.completions.create({
      model: newConfig.selectedModel,
      messages,
      stream: true,
    });

    // eslint-disable-next-line no-restricted-syntax
    for await (const chunk of completion) {
      // @ts-ignore
      if (finishReason === 'abort') {
        break;
      }

      const content = chunk.choices[0]?.delta?.content;

      if (content) {
        finalMessage += content;
        onNewToken(content);
      }

      if (chunk.choices[0]?.finish_reason) {
        finishReason = chunk.choices[0]?.finish_reason;
      }
    }

    if (abortSignal) {
      abortSignal.removeEventListener('abort', onAbort);
    }
    return { finalMessage, finishReason, error: null };
  } catch (e) {
    return {
      finalMessage: null,
      finishReason: null,
      error: (e as Error).message || 'An error occurred during the API request',
    };
  }
};

export const ChatOperations = {
  buildDisplayMessages,
  buildRequestMessages,
  insertMessage,
  insertChoice,
  editMessage,
  deleteMessages,
  setActiveChoice,
  streamingRequest,
};
