import {
  Chat,
  Message,
  MultipleChoiceMessage,
  PromptMessage,
  DisplayMessage,
} from '@/common/types';
import { generateUUID } from '@/common/uuid';

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

type ChatMessage = {
  messageType: 'user' | 'assistant' | 'user-prompt' | 'system-prompt';
  id: string;
  activeChoice?: number;
  choices?: Array<{
    content: string;
    timestamp: number;
  }>;
  promptId?: string;
};

const insertMessage = async (
  chat: Chat,
  messageType: ChatMessage['messageType'],
  content: string,
): Promise<{ newChat: Chat | null; error: string | null }> => {
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

export const ChatOperations = {
  buildDisplayMessages,
  insertMessage,
  insertChoice,
  editMessage,
  deleteMessages,
  setActiveChoice,
};
