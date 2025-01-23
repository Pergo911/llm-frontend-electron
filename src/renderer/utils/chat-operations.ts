import {
  Chat,
  Message,
  MultipleChoiceMessage,
  PromptMessage,
  DisplayMessage,
} from '@/common/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Converts a chat's messages into a display-friendly format
 * @param chat The chat containing messages to convert
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
  chatData: Chat,
): Promise<DisplayMessage[]> => {
  const messages = await Promise.all(
    chatData.messages.map(async (m): Promise<DisplayMessage | null> => {
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

/**
 * Updates or inserts a message into a chat
 * @param chat The chat to modify
 * @param messageType Type of message ('user'|'assistant'|'user-prompt'|'system-prompt')
 * @param content Content of the message
 * @param choiceToEdit Optional index of choice to edit (for multiple choice messages)
 * @param id Optional ID of existing message to update
 * @returns Object containing the updated chat and any error message
 * @example
 * // Add new message
 * const { newChat, error } = await upsertMessage(chat, 'user', 'Hello');
 *
 * // Edit existing message
 * const { newChat, error } = await upsertMessage(chat, 'assistant', 'Updated response', 0, 'msg-123');
 *
 * // Add new choice to message
 * const { newChat, error }= await upsertMessage(chat, 'assistant', 'Alternative response', undefined, 'msg-123');
 */
const upsertMessage = async (
  chat: Chat,
  messageType: 'user' | 'assistant' | 'user-prompt' | 'system-prompt',
  content: string,
  choiceToEdit?: number,
  id?: string,
) => {
  let oldMessageIndex: number = -1;

  // If updating existing message, find its index
  if (id) {
    oldMessageIndex = chat.messages.findIndex((m) => m.id === id);

    if (oldMessageIndex === -1)
      return {
        newChat: null as Chat | null,
        error: 'upsertMessage: Message not found' as string | null,
      };
  }

  // Helper functions to determine message properties
  const isUserOrAssistant = (type: string) =>
    type === 'user' || type === 'assistant';

  const isPromptMessage = (type: string) =>
    type === 'user-prompt' || type === 'system-prompt';

  // Calculate active choice for user/assistant messages
  // - Return undefined for prompt messages
  // - For new messages, start at choice 0
  // - For edited messages, use provided choice index
  // - For new choices, increment the last active choice
  const getActiveChoice = () => {
    if (!isUserOrAssistant(messageType)) {
      return undefined;
    }
    if (!id) {
      return 0;
    }
    if (typeof choiceToEdit === 'number') {
      return choiceToEdit;
    }
    const existingChoices = chat.messages[oldMessageIndex].choices ?? [];
    return existingChoices.length;
  };

  // Build choices array for user/assistant messages
  // - Return undefined for prompt messages
  // - For new messages, create array with single choice
  // - For edited messages with choice index, update that choice
  // - For new choices, append to existing choices array
  type ChoicesResult = {
    choices?: Array<{ content: string; timestamp: number }>;
    error?: string;
  };

  const getChoices = (): ChoicesResult => {
    if (!isUserOrAssistant(messageType)) {
      return { choices: undefined };
    }

    const newChoice = {
      content,
      timestamp: Date.now(),
    };

    if (!id) {
      return { choices: [newChoice] };
    }

    const existingChoices = chat.messages[oldMessageIndex].choices ?? [];
    if (typeof choiceToEdit === 'number') {
      if (choiceToEdit < 0 || choiceToEdit >= existingChoices.length) {
        return { error: 'Invalid choice index' };
      }
      const newChoices = [...existingChoices];
      newChoices[choiceToEdit] = newChoice;
      return { choices: newChoices };
    }
    return { choices: [...existingChoices, newChoice] };
  };

  const choicesResult = getChoices();
  if (choicesResult.error) {
    return {
      newChat: null,
      error: choicesResult.error,
    };
  }

  // Create new message object
  const newMessage: ChatMessage = {
    id: id || uuidv4(),
    messageType,
    activeChoice: getActiveChoice(),
    choices: choicesResult.choices,
    promptId: isPromptMessage(messageType) ? content : undefined,
  };

  const newChat = {
    ...chat,
    messages: [...chat.messages],
  };

  // Either update existing message or append new one
  if (id) {
    newChat.messages[oldMessageIndex] = newMessage;
  } else {
    newChat.messages.push(newMessage);
  }

  // Persist changes to disk
  const { error } = await window.electron.fileOperations.writeChat(newChat);

  return {
    newChat: error ? null : newChat,
    error,
  };
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
  upsertMessage,
  deleteMessages,
  setActiveChoice,
};
