import {
  ConfigSchema,
  Config,
  SaveFile,
  ChatEntry,
  PromptEntry,
  Chat,
} from '@/common/types';
import { ipcMain } from 'electron';
import Store from 'electron-store';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';

const store = new Store({ schema: ConfigSchema });

async function getSaveFile(): Promise<{
  saveFile: SaveFile | null;
  error: string | null;
}> {
  // @ts-ignore
  const path = store.get('saveFilePath') as string;

  try {
    if (!existsSync(path)) {
      const emptySaveFile: SaveFile = {
        chats: [],
        prompts: [],
        folders: [],
      };
      await writeFile(path, JSON.stringify(emptySaveFile, null, 2), 'utf-8');
      return { saveFile: emptySaveFile, error: null };
    }

    const saveFileContents = await readFile(path, 'utf-8');
    const saveFile: SaveFile = JSON.parse(saveFileContents);
    return { saveFile, error: null };
  } catch (e) {
    return { saveFile: null, error: (e as Error).message };
  }
}

function getConfig(): Config {
  const config: Config = {
    // @ts-ignore
    baseUrl: store.get('baseUrl') as string,
    // @ts-ignore
    apiKey: store.get('apiKey') as string,
    // @ts-ignore
    lastUsedModel: store.get('lastUsedModel') as string,
    // @ts-ignore
    theme: store.get('theme') as 'system' | 'light' | 'dark',
    // @ts-ignore
    saveFilePath: store.get('saveFilePath') as string,
  };

  return config;
}

function setConfigValue(key: keyof Config, value: Config[keyof Config]) {
  try {
    // @ts-ignore
    store.set(key, value);
    return { error: null as string | null };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

async function getEntries() {
  const { saveFile, error } = await getSaveFile();

  if (error || !saveFile) {
    return {
      chatEntries: [],
      promptEntries: [],
      error,
    };
  }

  const chatEntries = saveFile.chats.map((i) => {
    return { id: i.id, title: i.title } as ChatEntry;
  });

  const promptEntries = saveFile.folders.map((f) => {
    return {
      id: f.id,
      title: f.title,
      items: saveFile.prompts.filter((i) => i.folderId === f.id),
    } as PromptEntry;
  });

  return {
    chatEntries,
    promptEntries,
    error: null as string | null,
  };
}

async function getChatById(id: string) {
  const { saveFile, error } = await getSaveFile();

  if (error || !saveFile) {
    return { chat: null, error };
  }

  const chat = saveFile.chats.find((c) => c.id === id);

  return {
    chat: chat || null,
    error: null as string | null,
  };
}

async function getPromptById(id: string) {
  const { saveFile, error } = await getSaveFile();

  if (error || !saveFile) {
    return { prompt: null, folder: null, error };
  }

  const prompt = saveFile.prompts.find((p) => p.id === id);

  if (!prompt) {
    return { prompt: null, folder: null, error: 'Prompt not found' };
  }

  const folder =
    saveFile.folders.find((f) => f.id === prompt?.folderId) ?? null;

  return {
    prompt: prompt || null,
    folder,
    error: null as string | null,
  };
}

async function writeChat(chat: Chat) {
  const { saveFile, error } = await getSaveFile();

  if (error || !saveFile) {
    return { error };
  }

  const chatIndex = saveFile.chats.findIndex((c) => c.id === chat.id);

  if (chatIndex === -1) {
    return { error: 'Chat not found' };
  }

  saveFile.chats[chatIndex] = chat;

  try {
    await writeFile(
      // @ts-ignore
      store.get('saveFilePath') as string,
      JSON.stringify(saveFile, null, 2),
      'utf-8',
    );
    return { error: null as string | null };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export const registerFileOperations = () => {
  ipcMain.handle('get-config', () => {
    return getConfig();
  });

  ipcMain.handle(
    'set-config',
    (event, key: keyof Config, value: Config[keyof Config]) => {
      return setConfigValue(key, value);
    },
  );

  ipcMain.handle('get-entries', () => {
    return getEntries();
  });

  ipcMain.handle('get-chat-by-id', (event, id: string) => {
    return getChatById(id);
  });

  ipcMain.handle('get-prompt-by-id', (event, id: string) => {
    return getPromptById(id);
  });

  ipcMain.handle('write-chat', (event, chat: Chat) => {
    return writeChat(chat);
  });
};
