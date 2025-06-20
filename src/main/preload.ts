import { contextBridge, ipcRenderer } from 'electron';
import {
  ChatEntry,
  Config,
  PromptEntry,
  Chat,
  Prompt,
  Folder,
  RequestMessage,
} from '@/common/types';

const electronHandler = {
  fileOperations: {
    getConfig: () => ipcRenderer.invoke('get-config') as Promise<Config>,
    setConfig: (key: keyof Config, value: Config[keyof Config]) =>
      ipcRenderer.invoke('set-config', key, value) as Promise<{
        error: string | null;
      }>,
    openSaveFilePickerModal: () =>
      ipcRenderer.invoke('open-savefile-picker-modal') as Promise<{
        canceled: boolean;
        filePath: string;
      }>,
    getEntries: () =>
      ipcRenderer.invoke('get-entries') as Promise<{
        chatEntries: ChatEntry[];
        promptEntries: PromptEntry[];
        error: string | null;
      }>,
    getChatById: (id: string) =>
      ipcRenderer.invoke('get-chat-by-id', id) as Promise<{
        chat: Chat | null;
        error: string | null;
      }>,
    getPromptById: (id: string) =>
      ipcRenderer.invoke('get-prompt-by-id', id) as Promise<{
        prompt: Prompt | null;
        folder: Folder | null;
        error: string | null;
      }>,
    getFolderById: (id: string) =>
      ipcRenderer.invoke('get-folder-by-id', id) as Promise<{
        folder: Folder | null;
        error: string | null;
      }>,
    writeChat: (chat: Chat) =>
      ipcRenderer.invoke('write-chat', chat) as Promise<{
        error: string | null;
      }>,
    writePrompt: (prompt: Prompt) =>
      ipcRenderer.invoke('write-prompt', prompt) as Promise<{
        error: string | null;
      }>,
    writeFolder: (folder: Folder) =>
      ipcRenderer.invoke('write-folder', folder) as Promise<{
        error: string | null;
      }>,
    create: (
      itemType: 'chat' | 'prompt' | 'folder',
      title: string,
      folderId?: string,
      promptType?: 'user' | 'system',
    ) =>
      ipcRenderer.invoke(
        'create',
        itemType,
        title,
        folderId,
        promptType,
      ) as Promise<{
        id: string | null;
        error: string | null;
      }>,
    remove: (itemType: 'chat' | 'prompt' | 'folder', id: string) =>
      ipcRenderer.invoke('remove', itemType, id) as Promise<{
        error: string | null;
      }>,
  },
  windowStyle: {
    setWindowControlsTheme: (theme: 'dark' | 'light') => {
      ipcRenderer.send('update-titlebar-colors', {
        background:
          theme === 'dark'
            ? 'hsla(100, 10%, 11.8%, 0)'
            : 'hsla(80, 22%, 92%, 0)',
        symbol:
          theme === 'dark'
            ? 'hsla(240, 4.8%, 95.9%, 1)'
            : 'hsla(240, 5.3%, 26.1%, 1)',
      });
    },
    setNativeTheme: (theme: 'system' | 'light' | 'dark') => {
      ipcRenderer.send('update-native-theme', theme);
    },
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
