import { contextBridge, ipcRenderer } from 'electron';
import { ChatEntry, Config, PromptEntry } from '@/common/types';

const electronHandler = {
  fileOperations: {
    getConfig: () => ipcRenderer.invoke('get-config') as Promise<Config>,
    setConfig: (key: keyof Config, value: Config[keyof Config]) =>
      ipcRenderer.invoke('set-config', key, value) as Promise<boolean>,
    getEntries: () =>
      ipcRenderer.invoke('get-entries') as Promise<{
        chatEntries: ChatEntry[];
        promptEntries: PromptEntry[];
        error: string | null;
      }>,
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
