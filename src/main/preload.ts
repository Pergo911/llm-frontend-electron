import { contextBridge, ipcRenderer } from 'electron';
import { ChatEntry, Config, PromptEntry, Chat, Prompt } from '@/common/types';

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
        error: string | null;
      }>,
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
