import { ConfigSchema, Config, SaveFile } from '@/common/types';
import { BrowserWindow, dialog, ipcMain } from 'electron';
import Store from 'electron-store';
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';

const store = new Store({ schema: ConfigSchema, watch: true });

async function getSaveFile(): Promise<{
  saveFile: SaveFile | null;
  error: string | null;
}> {
  // @ts-ignore
  const path = store.get('saveFilePath') as string;

  try {
    if (!existsSync(path)) {
      return { saveFile: null, error: 'Savefile not found' };
    }

    const saveFileContents = await readFile(path, 'utf-8');
    const saveFile: SaveFile = JSON.parse(saveFileContents);
    return { saveFile, error: null };
  } catch (e) {
    return { saveFile: null, error: (e as Error).message };
  }
}

async function setSaveFile(
  saveFile: SaveFile,
): Promise<{ error: string | null }> {
  // @ts-ignore
  const path = store.get('saveFilePath') as string;

  try {
    await writeFile(path, JSON.stringify(saveFile, null, 2), 'utf-8');
    return { error: null };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

async function openSaveFilePickerModal(window: BrowserWindow) {
  const { canceled, filePath } = await dialog.showSaveDialog(window, {
    title: 'Open or create savefile',
    defaultPath: 'savefile.json',
    buttonLabel: 'Open / Create',
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['createDirectory', 'dontAddToRecent'],
  });

  if (!canceled && filePath) {
    try {
      if (!existsSync(filePath)) {
        const emptySaveFile: SaveFile = {
          chats: [],
          prompts: [],
          folders: [],
        };
        await writeFile(
          filePath,
          JSON.stringify(emptySaveFile, null, 2),
          'utf-8',
        );
      }
    } catch (e) {
      return { canceled: true, filePath: '' };
    }
  }

  return { canceled, filePath };
}

export function getConfig(): Config {
  const config: Config = {
    // @ts-ignore
    baseUrl: store.get('baseUrl') as string,
    // @ts-ignore
    apiKey: store.get('apiKey') as string,
    // @ts-ignore
    modelSelection: store.get('modelSelection') as string[],
    // @ts-ignore
    theme: store.get('theme') as 'system' | 'light' | 'dark',
    // @ts-ignore
    saveFilePath: store.get('saveFilePath') as string,
    // @ts-ignore
    sidebarState: store.get('sidebarState') as boolean,
    // @ts-ignore
    useLegacyRoleNames: store.get('useLegacyRoleNames') as boolean,
    // @ts-ignore
    genSettings: (store.get('genSettings') as {
      max_tokens: number;
      temperature: number;
      top_p: number;
      stop: string[];
    }) ?? {
      max_tokens: 4096,
      temperature: 0.9,
      top_p: 0.9,
      stop: [],
    },
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

// async function writeChat(chat: Chat) {
//   const { saveFile, error } = await getSaveFile();

//   if (error || !saveFile) {
//     return { error };
//   }

//   const chatIndex = saveFile.chats.findIndex((c) => c.id === chat.id);

//   if (chatIndex === -1) {
//     return { error: 'Chat not found' };
//   }

//   saveFile.chats[chatIndex] = chat;

//   try {
//     await writeFile(
//       // @ts-ignore
//       store.get('saveFilePath') as string,
//       JSON.stringify(saveFile, null, 2),
//       'utf-8',
//     );
//     return { error: null as string | null };
//   } catch (e) {
//     return { error: (e as Error).message };
//   }
// }

// async function writePrompt(prompt: Prompt) {
//   const { saveFile, error } = await getSaveFile();

//   if (error || !saveFile) {
//     return { error };
//   }

//   const promptIndex = saveFile.prompts.findIndex((p) => p.id === prompt.id);

//   if (promptIndex === -1) {
//     return { error: 'Prompt not found' };
//   }

//   saveFile.prompts[promptIndex] = prompt;

//   try {
//     await writeFile(
//       // @ts-ignore
//       store.get('saveFilePath') as string,
//       JSON.stringify(saveFile, null, 2),
//       'utf-8',
//     );
//     return { error: null as string | null };
//   } catch (e) {
//     return { error: (e as Error).message };
//   }
// }

// async function writeTag(tag: Tag) {
//   const { saveFile, error } = await getSaveFile();

//   if (error || !saveFile) {
//     return { error };
//   }

//   const tagIndex = saveFile.tags.findIndex((t) => t.id === tag.id);

//   if (tagIndex === -1) {
//     return { error: 'Tag not found' };
//   }

//   saveFile.tags[tagIndex] = tag;

//   try {
//     await writeFile(
//       // @ts-ignore
//       store.get('saveFilePath') as string,
//       JSON.stringify(saveFile, null, 2),
//       'utf-8',
//     );
//     return { error: null as string | null };
//   } catch (e) {
//     return { error: (e as Error).message };
//   }
// }

// async function create(
//   itemType: 'chat' | 'prompt' | 'folder',
//   title: string,
//   folderId?: string,
//   promptType?: 'user' | 'system',
// ): Promise<{ id: string | null; error: string | null }> {
//   const { saveFile, error } = await getSaveFile();

//   if (error || !saveFile) {
//     return { id: null, error };
//   }

//   let id = '';

//   if (itemType === 'chat') {
//     id = generateUUID('c');

//     const item = {
//       title,
//       id,
//       timestamp: Date.now(),
//       messages: [],
//     } as Chat;

//     saveFile.chats.unshift(item);
//   } else if (itemType === 'prompt') {
//     if (!folderId || !promptType)
//       return {
//         id: null,
//         error: 'No `folderId` or `promptType` provided for prompt',
//       };

//     id = generateUUID('p');

//     const item = {
//       title,
//       id,
//       type: promptType,
//       folderId,
//       timestamp: Date.now(),
//       content: '',
//     } as Prompt;

//     saveFile.prompts.unshift(item);
//   } else if (itemType === 'folder') {
//     id = generateUUID('f');

//     const item = { id, title } as Folder;

//     saveFile.folders.unshift(item);
//   }

//   try {
//     await writeFile(
//       // @ts-ignore
//       store.get('saveFilePath') as string,
//       JSON.stringify(saveFile, null, 2),
//       'utf-8',
//     );
//     return { id, error: null };
//   } catch (e) {
//     return { id: null, error: (e as Error).message };
//   }
// }

// async function remove(itemType: 'chat' | 'prompt' | 'folder', id: string) {
//   const { saveFile, error } = await getSaveFile();

//   if (error || !saveFile) {
//     return { error };
//   }

//   if (itemType === 'chat') {
//     const index = saveFile.chats.findIndex((c) => c.id === id);

//     if (index === -1) {
//       return { error: 'Chat not found' };
//     }

//     saveFile.chats.splice(index, 1);
//   } else if (itemType === 'prompt') {
//     const index = saveFile.prompts.findIndex((p) => p.id === id);

//     if (index === -1) {
//       return { error: 'Prompt not found' };
//     }

//     saveFile.prompts.splice(index, 1);
//   } else if (itemType === 'folder') {
//     const index = saveFile.folders.findIndex((f) => f.id === id);

//     if (index === -1) {
//       return { error: 'Folder not found' };
//     }

//     saveFile.folders.splice(index, 1);

//     // Remove all prompts in the folder
//     saveFile.prompts = saveFile.prompts.filter((p) => p.folderId !== id);
//   }

//   try {
//     await writeFile(
//       // @ts-ignore
//       store.get('saveFilePath') as string,
//       JSON.stringify(saveFile, null, 2),
//       'utf-8',
//     );
//     return { error: null };
//   } catch (e) {
//     return { error: (e as Error).message };
//   }
// }

// async function duplicate(
//   itemType: 'chat' | 'prompt',
//   id: string,
// ): Promise<{ id: string | null; error: string | null }> {
//   const { saveFile, error } = await getSaveFile();

//   if (error || !saveFile) {
//     return { id: null, error };
//   }

//   if (itemType === 'chat') {
//     const existingChatIndex = saveFile.chats.findIndex((c) => c.id === id);
//     let existingChat: Chat | undefined;
//     if (existingChatIndex !== -1) {
//       existingChat = saveFile.chats[existingChatIndex];
//     }

//     if (!existingChat) {
//       return { id: null, error: 'Chat not found' };
//     }

//     const newId = generateUUID('c');
//     const duplicatedChat: Chat = {
//       ...existingChat,
//       id: newId,
//       title: `${existingChat.title} (Copy)`,
//       timestamp: Date.now(),
//     };

//     saveFile.chats.splice(existingChatIndex, 0, duplicatedChat);
//     id = newId;
//   } else if (itemType === 'prompt') {
//     const existingPromptId = saveFile.prompts.findIndex((p) => p.id === id);
//     let existingPrompt: Prompt | undefined;
//     if (existingPromptId !== -1) {
//       existingPrompt = saveFile.prompts[existingPromptId];
//     }

//     if (!existingPrompt) {
//       return { id: null, error: 'Prompt not found' };
//     }

//     const newId = generateUUID('p');
//     const duplicatedPrompt: Prompt = {
//       ...existingPrompt,
//       id: newId,
//       title: `${existingPrompt.title} (Copy)`,
//       timestamp: Date.now(),
//     };

//     saveFile.prompts.splice(existingPromptId, 0, duplicatedPrompt);
//     id = newId;
//   }

//   try {
//     await writeFile(
//       // @ts-ignore
//       store.get('saveFilePath') as string,
//       JSON.stringify(saveFile, null, 2),
//       'utf-8',
//     );
//     return { id, error: null };
//   } catch (e) {
//     return { id: null, error: (e as Error).message };
//   }
// }

export const registerFileOperations = () => {
  ipcMain.handle('get-config', () => {
    return getConfig();
  });

  ipcMain.handle(
    'set-config',
    (_event, key: keyof Config, value: Config[keyof Config]) => {
      return setConfigValue(key, value);
    },
  );

  ipcMain.handle('get-savefile', (_e) => {
    return getSaveFile();
  });

  ipcMain.handle('set-savefile', (_e, saveFile: SaveFile) => {
    return setSaveFile(saveFile);
  });

  ipcMain.handle('open-savefile-picker-modal', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);

    if (!window) {
      return Promise.resolve({ canceled: true, filePath: '' });
    }

    return openSaveFilePickerModal(window);
  });
};
