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
  /**
   * Sets up a listener for navigation commands from the main process.
   * @param {function(string): void} callback The function to call with the direction ('back' or 'forward').
   * @returns {() => void} A cleanup function to remove the listener.
   */
  onNavigateCommand: (callback: (direction: 'back' | 'forward') => void) => {
    const listener = (_event: any, direction: 'back' | 'forward') =>
      callback(direction);
    ipcRenderer.on('navigate-command', listener);

    // Return a cleanup function to be called when the component unmounts
    return () => {
      ipcRenderer.removeListener('navigate-command', listener);
    };
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
