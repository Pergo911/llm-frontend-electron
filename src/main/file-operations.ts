import { ConfigSchema, Config, SaveFile } from '@/common/types';
import { ipcMain } from 'electron';
import Store from 'electron-store';
import { readFile } from 'fs/promises';

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
    return false;
  }
}

async function getEntries() {
  // @ts-ignore
  const path = store.get('saveFilePath') as string;

  try {
    const saveFileContents = await readFile(path, 'utf-8');
    const saveFile: SaveFile = JSON.parse(saveFileContents);

    return {
      chatEntries: saveFile.chatEntries,
      promptEntries: saveFile.promptEntries,
      error: null as string | null,
    };
  } catch (e) {
    console.error(e);
    return {
      chatEntries: [],
      promptEntries: [],
      error: (e as Error).message,
    };
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
};
