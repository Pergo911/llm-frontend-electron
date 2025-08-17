import {
  AssistantMessage,
  Chat,
  Folder,
  Message,
  OpenRouterModel,
  Prompt,
  PromptMessage,
  ResolvedChat,
  ResolvedFolder,
  ResolvedPrompt,
  ResolvedPromptMessage,
  ResolvedSaveFile,
  SaveFile,
  SaveFileController,
  UserMessage,
} from '@/utils/types';
import { generateUUID } from '@/utils/uuid';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

// Deep clone helper replacing repeated JSON.parse(JSON.stringify(...)) usages
const deepClone = <T,>(value: T): T => {
  try {
    // structuredClone is available in modern Electron (Chromium) environments
    return structuredClone(value);
  } catch {
    return JSON.parse(JSON.stringify(value));
  }
};

const useSaveFile = (): {
  loading: boolean;
  chats: ResolvedChat[] | null;
  prompts: ResolvedPrompt[] | null;
  folders: ResolvedFolder[] | null;
  controller: SaveFileController;
  error: string | null;
} => {
  const [error, setError] = useState<string | null>(null);
  const [saveFile, setSaveFile] = useState<SaveFile | null>(null);
  const [resolvedSaveFile, setResolvedSaveFile] =
    useState<ResolvedSaveFile | null>(null);
  const [loading, setLoading] = useState(true);
  const debounceTimerRef = useRef<number | null>(null);

  const resolvePromptMessage = useCallback(
    (message: PromptMessage, saveFile: SaveFile): ResolvedPromptMessage => {
      // Find prompt
      const { content, title, type } = saveFile.prompts.find(
        (prompt) => prompt.id === message.promptId,
      ) ?? { content: null, title: null, type: null };

      // Prompt couldn't be found
      if (content === null || title === null || type === null) {
        return {
          ...message,
          title: null,
          content: null,
          type: null,
        } as ResolvedPromptMessage;
      }

      // Return resolved prompt message
      return {
        ...message,
        content,
        title,
        messageType: type,
      } as ResolvedPromptMessage;
    },
    [],
  );

  /**
   * Finds and attaches the corresponding folder to the prompt
   * @param prompt Prompt to resolve
   * @returns The resolved prompt
   */
  const resolvePrompt = useCallback(
    (prompt: Prompt, saveFile: SaveFile): ResolvedPrompt => {
      const folder = saveFile.folders.find((f) => f.id === prompt.folderId);
      return folder ? { ...prompt, folder } : { ...prompt, folder: null };
    },
    [],
  );

  const resolveFolder = useCallback(
    (folder: Folder, resolvedPrompts: ResolvedPrompt[]): ResolvedFolder => {
      // A prompt belongs to this folder if its `folderId` matches
      const items = resolvedPrompts.filter((p) => p.folderId === folder.id);
      // Return as resolved
      return { ...folder, items };
    },
    [],
  );

  /**
   * Resolves a raw savefile once it is available.
   * Resolving basically means "joining tables":
   * - Messages of type `user-prompt` and `system-prompt`
   *   will have their content, title and folder retrieved
   *   from `"prompts": [...]`
   * - Folders will contain all corresponding prompts
   *
   * @param {SaveFile} saveFile - The raw SaveFile to resolve
   * @returns {ResolvedSaveFile} The resolved save file with joined data
   */
  const resolveSaveFile = useCallback(
    (saveFile: SaveFile): ResolvedSaveFile => {
      const res: ResolvedSaveFile = {
        chats: [],
        prompts: [],
        folders: [],
      };

      // Foreach resolving chats
      saveFile.chats.forEach((chat) => {
        const resolvedChat: ResolvedChat = {
          // These can be copied
          id: chat.id,
          created: chat.created,
          modified: chat.modified,
          title: chat.title,
          // Only messages need to be resolved
          messages: chat.messages.map((message) => {
            // If it's not a prompt message there's no further processing
            if (
              message.messageType === 'user' ||
              message.messageType === 'assistant'
            )
              return message;

            // If it is a prompt message, resolve it
            return resolvePromptMessage(message, saveFile);
          }),
        };

        res.chats.push(resolvedChat);
      });

      // Foreach resolving prompts
      saveFile.prompts.forEach((prompt) => {
        res.prompts.push(resolvePrompt(prompt, saveFile));
      });

      // Foreach resolving folders
      saveFile.folders.forEach((folder) => {
        res.folders.push(resolveFolder(folder, res.prompts));
      });

      return res;
    },
    [resolveFolder, resolvePrompt, resolvePromptMessage],
  );

  /**
   * Load/reload savefile
   * Will reset everything once called
   */
  const load = useCallback(async () => {
    if (saveFile) setSaveFile(null);
    if (resolvedSaveFile) setResolvedSaveFile(null);
    if (!loading) setLoading(true);
    if (error) setError(null);

    const { saveFile: readSaveFile, error: readError } =
      await window.electron.fileOperations.getSaveFile();

    if (readError || !readSaveFile) {
      setError(readError);
      return;
    }

    setSaveFile(readSaveFile);
    setResolvedSaveFile(resolveSaveFile(readSaveFile));
  }, [error, loading, resolveSaveFile, resolvedSaveFile, saveFile]);

  /**
   * Takes the current saveFile state and writes it to disk
   * @returns {Object} An object with error field, which is null if successful
   */
  const write = useCallback(async () => {
    if (!saveFile) {
      return { error: 'No save file loaded' };
    }

    const { error } =
      await window.electron.fileOperations.setSaveFile(saveFile);

    if (error) {
      return { error };
    }

    return { error: null };
  }, [saveFile]);

  /**
   * Debounced write handler that delays writing for 2 seconds
   * Can be called frequently but will only write if nothing happens for 2 seconds
   */
  const handleWrite = useCallback(() => {
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set a new timer for 2 seconds
    debounceTimerRef.current = window.setTimeout(async () => {
      const { error } = await write();
      if (error) {
        toast.error(`Failed to save: ${error}`);
        toast.warning('Warning: Unsaved changes!');
      }
    }, 2000);
  }, [write]);

  const addMessage = useCallback(
    (
      chatId: string,
      messageType: Message['messageType'],
      content: string,
      reasoning?: string,
      generatedWith?: string,
    ) => {
      if (!saveFile || !resolvedSaveFile) {
        return {
          messageId: null,
          error: `add: No savefile found.`,
        };
      }

      const chat = saveFile.chats.find((c) => c.id === chatId);
      const resolvedChat = resolvedSaveFile.chats.find((c) => c.id === chatId);

      if (!chat || !resolvedChat)
        return {
          messageId: null,
          error: `add: Couldn't find chat ${chatId}`,
        };

      let message: UserMessage | AssistantMessage | PromptMessage;
      let resolvedMessage:
        | UserMessage
        | AssistantMessage
        | ResolvedPromptMessage;
      const id = generateUUID('m');

      if (messageType === 'user') {
        const t = Date.now();

        message = {
          messageType: 'user',
          id,
          content,
          created: t,
          modified: t,
        } as UserMessage;

        resolvedMessage = message;
      } else if (messageType === 'assistant') {
        const t = Date.now();

        message = {
          messageType: 'assistant',
          id,
          activeChoice: 0,
          choices: [
            {
              created: t,
              modified: t,
              content,
              reasoning_details: reasoning,
              generated_with: generatedWith,
            },
          ],
        } as AssistantMessage;

        resolvedMessage = message;
      } else {
        const t = Date.now();

        message = {
          messageType,
          id,
          created: t,
          modified: t,
          promptId: content,
        } as PromptMessage;

        // Resolve prompt message to include title and tags
        resolvedMessage = resolvePromptMessage(message, saveFile);
      }

      chat.messages.push(message);
      resolvedChat.messages.push(resolvedMessage);

      // Update the chat's modified timestamp
      chat.modified = Date.now();
      resolvedChat.modified = chat.modified;

      setSaveFile(deepClone(saveFile));
      setResolvedSaveFile(deepClone(resolvedSaveFile));

      handleWrite();

      return { messageId: id, error: null };
    },
    [resolvePromptMessage, resolvedSaveFile, saveFile, handleWrite],
  );

  const addMessageChoice = useCallback(
    (
      chatId: string,
      messageId: string,
      content: string,
      reasoning?: string,
      generatedWith?: string,
    ) => {
      if (!saveFile || !resolvedSaveFile) {
        return {
          error: `addChoice: No savefile found.`,
        };
      }

      const chat = saveFile.chats.find((c) => c.id === chatId);
      const resolvedChat = resolvedSaveFile.chats.find((c) => c.id === chatId);

      if (!chat || !resolvedChat)
        return {
          error: `addChoice: Couldn't find chat ${chatId}`,
        };

      const message = chat.messages.find((m) => m.id === messageId);
      const resolvedMessage = resolvedChat.messages.find(
        (m) => m.id === messageId,
      );
      if (
        !message ||
        message.messageType !== 'assistant' ||
        !resolvedMessage ||
        resolvedMessage.messageType !== 'assistant'
      ) {
        return {
          error: `addChoice: Couldn't find assistant message ${messageId} in chat ${chatId}`,
        };
      }
      const t = Date.now();
      const choice = {
        created: t,
        modified: t,
        content,
        reasoning_details: reasoning,
        generated_with: generatedWith,
      };

      message.choices.push(choice);
      message.activeChoice = message.choices.length - 1;

      resolvedMessage.choices.push(choice);
      resolvedMessage.activeChoice = resolvedMessage.choices.length - 1;

      // Update the chat's modified timestamp
      chat.modified = Date.now();
      resolvedChat.modified = chat.modified;

      setSaveFile(deepClone(saveFile));
      setResolvedSaveFile(deepClone(resolvedSaveFile));

      handleWrite();

      return { error: null };
    },
    [resolvedSaveFile, saveFile, handleWrite],
  );

  const setMessageChoice = useCallback(
    (chatId: string, messageId: string, choiceIndex: number) => {
      if (!saveFile || !resolvedSaveFile) {
        return {
          error: `setChoice: No savefile found.`,
        };
      }

      const chat = saveFile.chats.find((c) => c.id === chatId);
      const resolvedChat = resolvedSaveFile.chats.find((c) => c.id === chatId);

      if (!chat || !resolvedChat)
        return {
          error: `setChoice: Couldn't find chat ${chatId}`,
        };

      const message = chat.messages.find((m) => m.id === messageId);
      const resolvedMessage = resolvedChat.messages.find(
        (m) => m.id === messageId,
      );
      if (
        !message ||
        message.messageType !== 'assistant' ||
        !resolvedMessage ||
        resolvedMessage.messageType !== 'assistant'
      ) {
        return {
          error: `setChoice: Couldn't find assistant message ${messageId} in chat ${chatId}`,
        };
      }

      if (choiceIndex < 0 || choiceIndex >= message.choices.length) {
        return {
          error: `setChoice: Invalid choice index ${choiceIndex} for message ${messageId} in chat ${chatId}`,
        };
      }

      message.activeChoice = choiceIndex;
      resolvedMessage.activeChoice = choiceIndex;

      setSaveFile(deepClone(saveFile));
      setResolvedSaveFile(deepClone(resolvedSaveFile));

      handleWrite();

      return { error: null };
    },
    [resolvedSaveFile, saveFile, handleWrite],
  );

  const deleteMessage = useCallback(
    (chatId: string, messageId: string) => {
      if (!saveFile || !resolvedSaveFile) {
        return {
          error: `delete: No savefile found.`,
        };
      }

      const chat = saveFile.chats.find((c) => c.id === chatId);
      const resolvedChat = resolvedSaveFile.chats.find((c) => c.id === chatId);

      if (!chat || !resolvedChat)
        return {
          error: `delete: Couldn't find chat ${chatId}`,
        };

      const messageIndex = chat.messages.findIndex((m) => m.id === messageId);
      const resolvedMessageIndex = resolvedChat.messages.findIndex(
        (m) => m.id === messageId,
      );
      if (messageIndex === -1 || resolvedMessageIndex === -1) {
        return {
          error: `delete: Couldn't find message ${messageId} in chat ${chatId}`,
        };
      }

      // Remove the message and all subsequent messages
      chat.messages.splice(messageIndex);
      resolvedChat.messages.splice(resolvedMessageIndex);

      // Update the chat's modified timestamp
      chat.modified = Date.now();
      resolvedChat.modified = chat.modified;

      setSaveFile(deepClone(saveFile));
      setResolvedSaveFile(deepClone(resolvedSaveFile));

      handleWrite();

      return { error: null };
    },
    [resolvedSaveFile, saveFile, handleWrite],
  );

  const deleteMessageChoice = useCallback(
    (chatId: string, messageId: string, choiceIndex?: number) => {
      if (!saveFile || !resolvedSaveFile) {
        return {
          error: `deleteChoice: No savefile found.`,
        };
      }

      const chat = saveFile.chats.find((c) => c.id === chatId);
      const resolvedChat = resolvedSaveFile.chats.find((c) => c.id === chatId);

      if (!chat || !resolvedChat)
        return {
          error: `deleteChoice: Couldn't find chat ${chatId}`,
        };

      const message = chat.messages.find((m) => m.id === messageId);
      const resolvedMessage = resolvedChat.messages.find(
        (m) => m.id === messageId,
      );
      if (
        !message ||
        message.messageType !== 'assistant' ||
        !resolvedMessage ||
        resolvedMessage.messageType !== 'assistant'
      ) {
        return {
          error: `deleteChoice: Couldn't find assistant message ${messageId} in chat ${chatId}`,
        };
      }

      if (!choiceIndex) choiceIndex = message.activeChoice;

      if (choiceIndex < 0 || choiceIndex >= message.choices.length) {
        return {
          error: `deleteChoice: Invalid choice index ${choiceIndex} for message ${messageId} in chat ${chatId}`,
        };
      }

      if (message.choices.length <= 1) {
        return {
          error: `deleteChoice: Unable to delete only choice of a message. Use messages.delete().`,
        };
      }

      // Active choice is being deleted, prev will be the new active
      if (choiceIndex === message.activeChoice) {
        message.activeChoice -= 1;
        resolvedMessage.activeChoice -= 1;
      }

      message.choices.splice(choiceIndex, 1);
      resolvedMessage.choices.splice(choiceIndex, 1);

      setSaveFile(deepClone(saveFile));
      setResolvedSaveFile(deepClone(resolvedSaveFile));

      handleWrite();

      return { error: null };
    },
    [saveFile, resolvedSaveFile, handleWrite],
  );

  const modifyMessage = useCallback(
    (
      chatId: string,
      messageId: string,
      content: string,
      reasoning?: string,
    ) => {
      if (!saveFile || !resolvedSaveFile) {
        return {
          error: `modify: No savefile found.`,
        };
      }

      const chat = saveFile.chats.find((c) => c.id === chatId);
      const resolvedChat = resolvedSaveFile.chats.find((c) => c.id === chatId);

      if (!chat || !resolvedChat)
        return {
          error: `modify: Couldn't find chat ${chatId}`,
        };

      const message = chat.messages.find((m) => m.id === messageId);
      const resolvedMessageIndex = resolvedChat.messages.findIndex(
        (m) => m.id === messageId,
      );
      if (!message || resolvedMessageIndex === -1) {
        return {
          error: `modify: Couldn't find message ${messageId} in chat ${chatId}`,
        };
      }

      const resolvedMessage = resolvedChat.messages[resolvedMessageIndex];

      if (message.messageType === 'user') {
        message.content = content;
        message.modified = Date.now();

        // @ts-ignore
        resolvedMessage.content = content;
        // @ts-ignore
        resolvedMessage.modified = message.modified;
      } else if (message.messageType === 'assistant') {
        message.choices[message.activeChoice].content = content;

        if (reasoning !== undefined)
          message.choices[message.activeChoice].reasoning_details = reasoning;

        message.choices[message.activeChoice].modified = Date.now();

        // @ts-ignore
        resolvedMessage.choices[resolvedMessage.activeChoice].content = content;

        // @ts-ignore
        if (reasoning !== undefined) resolvedMessage.choices[resolvedMessage.activeChoice].reasoning_details = reasoning; // prettier-ignore

        // @ts-ignore
        resolvedMessage.choices[resolvedMessage.activeChoice].modified =
          message.choices[message.activeChoice].modified;
      } else {
        message.promptId = content;
        message.modified = Date.now();

        const resolvedPromptMessage = resolvePromptMessage(message, saveFile);

        resolvedChat.messages[resolvedMessageIndex] = resolvedPromptMessage;
      }

      // Update the chat's modified timestamp
      chat.modified = Date.now();
      resolvedChat.modified = chat.modified;

      setSaveFile(deepClone(saveFile));
      setResolvedSaveFile(deepClone(resolvedSaveFile));

      handleWrite();

      return { error: null };
    },
    [resolvePromptMessage, resolvedSaveFile, saveFile, handleWrite],
  );

  const addChat = useCallback(
    (title: string) => {
      if (!saveFile || !resolvedSaveFile)
        return { error: 'No save file loaded', newId: null };

      const newId = generateUUID('c');
      const t = Date.now();

      const chat: Chat = {
        id: newId,
        title,
        created: t,
        modified: t,
        messages: [],
      };

      saveFile.chats.unshift(chat);
      resolvedSaveFile.chats.unshift(chat as ResolvedChat);

      setSaveFile(deepClone(saveFile));
      setResolvedSaveFile(deepClone(resolvedSaveFile));

      handleWrite();

      return { error: null, newId };
    },
    [saveFile, resolvedSaveFile, handleWrite],
  );

  const addPrompt = useCallback(
    (title: string, folderId: string, type: Prompt['type']) => {
      if (!saveFile) return { error: 'No save file loaded', newId: null };

      const newId = generateUUID('p');
      const t = Date.now();

      const prompt: Prompt = {
        id: newId,
        title,
        folderId,
        type,
        created: t,
        modified: t,
        content: '',
      };

      saveFile.prompts.unshift(prompt);
      const resolvedSaveFile = resolveSaveFile(saveFile);

      setSaveFile(deepClone(saveFile));
      setResolvedSaveFile(deepClone(resolvedSaveFile));

      handleWrite();

      return { error: null, newId };
    },
    [saveFile, resolveSaveFile, handleWrite],
  );

  const addFolder = useCallback(
    (name: string) => {
      if (!saveFile) return { error: 'No save file loaded', newId: null };

      const newId = generateUUID('f');
      const folder: Folder = {
        id: newId,
        name,
      };

      saveFile.folders.unshift(folder);
      const resolvedSaveFile = resolveSaveFile(saveFile);

      setSaveFile(deepClone(saveFile));
      setResolvedSaveFile(deepClone(resolvedSaveFile));

      handleWrite();

      return { error: null, newId };
    },
    [saveFile, resolveSaveFile, handleWrite],
  );

  const deleteChat = useCallback(
    (id: string) => {
      if (!saveFile) {
        return { error: 'No save file loaded' };
      }

      const chatIndex = saveFile.chats.findIndex((c) => c.id === id);

      if (chatIndex === -1) {
        return { error: `Chat with id ${id} not found` };
      }

      saveFile.chats.splice(chatIndex, 1);
      const resolvedSaveFile = resolveSaveFile(saveFile);

      setSaveFile(deepClone(saveFile));
      setResolvedSaveFile(deepClone(resolvedSaveFile));

      handleWrite();

      return { error: null };
    },
    [saveFile, resolveSaveFile, handleWrite],
  );

  const deletePrompt = useCallback(
    (id: string) => {
      if (!saveFile) {
        return { error: 'No save file loaded' };
      }

      const promptIndex = saveFile.prompts.findIndex((p) => p.id === id);

      if (promptIndex === -1) {
        return { error: `Prompt with id ${id} not found` };
      }

      saveFile.prompts.splice(promptIndex, 1);
      const resolvedSaveFile = resolveSaveFile(saveFile);

      setSaveFile(deepClone(saveFile));
      setResolvedSaveFile(deepClone(resolvedSaveFile));

      handleWrite();

      return { error: null };
    },
    [saveFile, resolveSaveFile, handleWrite],
  );

  const deleteFolder = useCallback(
    (id: string) => {
      if (!saveFile || !resolvedSaveFile) {
        return { error: 'No save file loaded' };
      }

      const folderIndex = saveFile.folders.findIndex((f) => f.id === id);
      const resolvedFolderIndex = resolvedSaveFile.folders.findIndex(
        (f) => f.id === id,
      );

      if (folderIndex === -1 || resolvedFolderIndex === -1) {
        return { error: `Folder with id ${id} not found` };
      }

      // Remove prompts in the folder first
      const resolvedFolder = resolvedSaveFile.folders[resolvedFolderIndex];
      resolvedFolder.items.forEach((i) => {
        const promptIndex = saveFile.prompts.findIndex((p) => p.id === i.id);
        if (promptIndex !== -1) {
          // Remove prompt from saveFile
          saveFile.prompts.splice(promptIndex, 1);
        }
      });

      saveFile.folders.splice(folderIndex, 1);
      const newResolvedSaveFile = resolveSaveFile(saveFile);

      setSaveFile(deepClone(saveFile));
      setResolvedSaveFile(deepClone(newResolvedSaveFile));

      handleWrite();

      return { error: null };
    },
    [saveFile, resolvedSaveFile, resolveSaveFile, handleWrite],
  );

  const renameChat = useCallback(
    (id: string, newName: string) => {
      if (!saveFile) {
        return { error: 'No save file loaded' };
      }

      const chat = saveFile.chats.find((c) => c.id === id);

      if (!chat) {
        return { error: `Chat with id ${id} not found` };
      }

      chat.title = newName;

      const resolvedSaveFile = resolveSaveFile(saveFile);

      setSaveFile(deepClone(saveFile));
      setResolvedSaveFile(deepClone(resolvedSaveFile));

      handleWrite();

      return { error: null };
    },
    [saveFile, resolveSaveFile, handleWrite],
  );

  const renamePrompt = useCallback(
    (id: string, newName: string) => {
      if (!saveFile) {
        return { error: 'No save file loaded' };
      }

      const prompt = saveFile.prompts.find((p) => p.id === id);

      if (!prompt) {
        return { error: `Prompt with id ${id} not found` };
      }

      prompt.title = newName;

      const resolvedSaveFile = resolveSaveFile(saveFile);

      setSaveFile(deepClone(saveFile));
      setResolvedSaveFile(deepClone(resolvedSaveFile));

      handleWrite();

      return { error: null };
    },
    [saveFile, resolveSaveFile, handleWrite],
  );

  const renameFolder = useCallback(
    (id: string, newName: string) => {
      if (!saveFile) {
        return { error: 'No save file loaded' };
      }

      const folder = saveFile.folders.find((f) => f.id === id);

      if (!folder) {
        return { error: `Folder with id ${id} not found` };
      }

      folder.name = newName;

      const resolvedSaveFile = resolveSaveFile(saveFile);

      setSaveFile(deepClone(saveFile));
      setResolvedSaveFile(deepClone(resolvedSaveFile));

      handleWrite();

      return { error: null };
    },
    [saveFile, resolveSaveFile, handleWrite],
  );

  const duplicateChat = useCallback(
    (id: string) => {
      if (!saveFile) {
        return { error: 'No save file loaded', newId: null };
      }

      const chat = saveFile.chats.find((c) => c.id === id);

      if (!chat) {
        return { error: `Chat with id ${id} not found`, newId: null };
      }

      const newId = generateUUID('c');
      const newTitle = `${chat.title} (Copy)`.substring(0, 50); // Limit to 50 characters
      const t = Date.now();

      const newChat: Chat = {
        ...chat,
        id: newId,
        title: newTitle,
        modified: t,
        messages: deepClone(chat.messages),
      };

      saveFile.chats.unshift(newChat);

      const resolvedSaveFile = resolveSaveFile(saveFile);

      setSaveFile(deepClone(saveFile));
      setResolvedSaveFile(deepClone(resolvedSaveFile));

      handleWrite();

      return { error: null, newId };
    },
    [saveFile, resolveSaveFile, handleWrite],
  );

  const duplicatePrompt = useCallback(
    (id: string) => {
      if (!saveFile) {
        return { error: 'No save file loaded', newId: null };
      }

      const prompt = saveFile.prompts.find((p) => p.id === id);

      if (!prompt) {
        return { error: `Prompt with id ${id} not found`, newId: null };
      }

      const newId = generateUUID('p');
      const newTitle = `${prompt.title} (Copy)`.substring(0, 50); // Limit to 50 characters
      const t = Date.now();

      const newPrompt: Prompt = {
        ...prompt,
        id: newId,
        title: newTitle,
        modified: t,
        content: prompt.content, // Duplicate content
      };

      saveFile.prompts.unshift(newPrompt);

      const resolvedSaveFile = resolveSaveFile(saveFile);

      setSaveFile(deepClone(saveFile));
      setResolvedSaveFile(deepClone(resolvedSaveFile));

      handleWrite();

      return { error: null, newId };
    },
    [saveFile, resolveSaveFile, handleWrite],
  );

  const editPromptContent = useCallback(
    (id: string, newContent: string) => {
      if (!saveFile) {
        return { error: 'No save file loaded' };
      }

      const prompt = saveFile.prompts.find((p) => p.id === id);

      if (!prompt) {
        return { error: `Prompt with id ${id} not found` };
      }

      prompt.content = newContent;

      const resolvedSaveFile = resolveSaveFile(saveFile);

      setSaveFile(deepClone(saveFile));
      setResolvedSaveFile(deepClone(resolvedSaveFile));

      handleWrite();

      return { error: null };
    },
    [saveFile, resolveSaveFile, handleWrite],
  );

  const changePromptFolder = useCallback(
    (promptId: string, folderId: string) => {
      if (!saveFile) {
        return { error: 'No save file loaded' };
      }

      const prompt = saveFile.prompts.find((p) => p.id === promptId);

      if (!prompt) {
        return { error: `Prompt with id ${promptId} not found` };
      }

      // Check if folder exists
      const folder = saveFile.folders.find((f) => f.id === folderId);
      if (!folder) {
        return { error: `Folder with id ${folderId} not found` };
      }

      prompt.folderId = folderId;

      const resolvedSaveFile = resolveSaveFile(saveFile);

      setSaveFile(deepClone(saveFile));
      setResolvedSaveFile(deepClone(resolvedSaveFile));

      handleWrite();

      return { error: null };
    },
    [saveFile, resolveSaveFile, handleWrite],
  );

  const changePromptType = useCallback(
    (id: string, newType: Prompt['type']) => {
      if (!saveFile) {
        return { error: 'No save file loaded' };
      }

      const prompt = saveFile.prompts.find((p) => p.id === id);

      if (!prompt) {
        return { error: `Prompt with id ${id} not found` };
      }

      prompt.type = newType;

      const resolvedSaveFile = resolveSaveFile(saveFile);

      setSaveFile(deepClone(saveFile));
      setResolvedSaveFile(deepClone(resolvedSaveFile));

      handleWrite();

      return { error: null };
    },
    [saveFile, resolveSaveFile, handleWrite],
  );

  // const controller = useMemo<SaveFileController>(
  //   () => ({
  //     saveFile: {
  //       write: handleWrite,
  //       reload: load,
  //     },
  //     chats: {
  //       messages: {
  //         add: addMessage,
  //         addChoice: addMessageChoice,
  //         setChoice: setMessageChoice,
  //         delete: deleteMessage,
  //         deleteChoice: deleteMessageChoice,
  //         modify: modifyMessage,
  //       },
  //       add: addChat,
  //       delete: deleteChat,
  //       rename: renameChat,
  //       duplicate: duplicateChat,
  //     },
  //     prompts: {
  //       add: addPrompt,
  //       delete: deletePrompt,
  //       rename: renamePrompt,
  //       duplicate: duplicatePrompt,
  //       editContent: editPromptContent,
  //       changeFolder: changePromptFolder,
  //       changeType: changePromptType,
  //     },
  //     folders: {
  //       add: addFolder,
  //       delete: deleteFolder,
  //       rename: renameFolder,
  //     },
  //   }),
  //   [
  //     addChat,
  //     addFolder,
  //     addMessage,
  //     addMessageChoice,
  //     addPrompt,
  //     changePromptFolder,
  //     changePromptType,
  //     deleteChat,
  //     deleteFolder,
  //     deleteMessage,
  //     deleteMessageChoice,
  //     deletePrompt,
  //     duplicateChat,
  //     duplicatePrompt,
  //     editPromptContent,
  //     handleWrite,
  //     load,
  //     modifyMessage,
  //     renameChat,
  //     renameFolder,
  //     renamePrompt,
  //     setMessageChoice,
  //   ],
  // );

const controller = useMemo<SaveFileController>(
    () => ({
      saveFile: {
        write: ()=>{},
        reload: ()=>{},
      },
      chats: {
        messages: {
          add: ()=>{},
          addChoice: ()=>{},
          setChoice: ()=>{},
          delete: ()=>{},
          deleteChoice: ()=>{},
          modify: ()=>{},
        },
        add: ()=>{},
        delete: ()=>{},
        rename: ()=>{},
        duplicate: ()=>{},
      },
      prompts: {
        add: ()=>{},
        delete: ()=>{},
        rename: ()=>{},
        duplicate: ()=>{},
        editContent: ()=>{},
        changeFolder: ()=>{},
        changeType: ()=>{},
      },
      folders: {
        add: ()=>{},
        delete: ()=>{},
        rename: ()=>{},
      },
    }),
    [],
  );

  return {
    loading: false,
    chats: [],
    prompts: [],
    folders: [],
    controller,
    error: null,
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (saveFile && resolvedSaveFile && loading && !error) setLoading(false);
  }, [error, loading, resolvedSaveFile, saveFile]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Return the state

  // If there is an error, return it
  if (error) {
    return {
      loading: false,
      chats: null,
      prompts: null,
      folders: null,
      controller,
      error,
    };
  }

  // If still loading, return loading state
  if (loading) {
    return {
      loading: true,
      chats: null,
      prompts: null,
      folders: null,
      controller,
      error: null,
    };
  }

  // If resolvedSaveFile is null, return error state
  // This should not happen, but in case it does, handle it gracefully
  if (!resolvedSaveFile) {
    return {
      loading: false,
      chats: null,
      prompts: null,
      folders: null,
      controller,
      error: 'Failed to resolve save file',
    };
  }

  // Everything smooth af
  return {
    loading: false,
    chats: resolvedSaveFile.chats,
    prompts: resolvedSaveFile.prompts,
    folders: resolvedSaveFile.folders,
    controller,
    error: null,
  };
};

export default useSaveFile;
