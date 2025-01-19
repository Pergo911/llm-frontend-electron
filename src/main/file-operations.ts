import { ConfigSchema, Config } from '@/common/types';
import { ipcMain } from 'electron';
import Store from 'electron-store';

const store = new Store({ schema: ConfigSchema });

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
    return true;
  } catch (e) {
    console.error(e);
    return false;
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
};
