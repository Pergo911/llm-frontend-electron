import { contextBridge, ipcRenderer } from 'electron';
import { Config, SaveFile } from '@/common/types';

const electronHandler = {
  fileOperations: {
    getConfig: () => ipcRenderer.invoke('get-config') as Promise<Config>,
    setConfig: (key: keyof Config, value: Config[keyof Config]) =>
      ipcRenderer.invoke('set-config', key, value) as Promise<{
        error: string | null;
      }>,
    getSaveFile: () =>
      ipcRenderer.invoke('get-savefile') as Promise<{
        saveFile: SaveFile | null;
        error: string | null;
      }>,
    setSaveFile: (saveFile: SaveFile) =>
      ipcRenderer.invoke('set-savefile', saveFile) as Promise<{
        error: string | null;
      }>,
    openSaveFilePickerModal: () =>
      ipcRenderer.invoke('open-savefile-picker-modal') as Promise<{
        canceled: boolean;
        filePath: string;
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
