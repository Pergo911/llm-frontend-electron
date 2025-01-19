import { contextBridge, ipcRenderer } from 'electron';
import { Config } from '@/common/types';

const electronHandler = {
  fileOperations: {
    getConfig: () => ipcRenderer.invoke('get-config') as Promise<Config>,
    setConfig: (key: keyof Config, value: Config[keyof Config]) =>
      ipcRenderer.invoke('set-config', key, value) as Promise<boolean>,
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
