import { contextBridge, ipcRenderer } from 'electron';
import {
  ChatEntry,
  Config,
  PromptEntry,
  Chat,
  Prompt,
  Folder,
} from '@/common/types';

const electronHandler = {
  fileOperations: {
    getConfig: () => ipcRenderer.invoke('get-config') as Promise<Config>,
    setConfig: (key: keyof Config, value: Config[keyof Config]) =>
      ipcRenderer.invoke('set-config', key, value) as Promise<{
        error: string | null;
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
  },
  windowStyle: {
    setWindowControlsTheme: (theme: 'dark' | 'light') => {
      ipcRenderer.send('update-titlebar-colors', {
        background:
          theme === 'dark' ? 'hsla(240, 5.9%, 10%, 1)' : 'hsla(0, 0%, 98%, 1)',
        symbol:
          theme === 'dark'
            ? 'hsla(240, 4.8%, 95.9%, 1)'
            : 'hsla(240, 5.3%, 26.1%, 1)',
      });
    },
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
