/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain, nativeTheme } from 'electron';
import { resolveHtmlPath } from './util';
import { registerFileOperations } from './file-operations';
const windowStateKeeper = require('electron-window-state');

let mainWindow: BrowserWindow | null = null;
let titleBarColors = {
  background: 'hsla(100, 10%, 11.8%, 0)',
  symbol: 'hsla(0, 0%, 95%, 1)',
};

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const createWindow = () => {
  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  let mainWindowState = windowStateKeeper({
    defaultWidth: 1024,
    defaultHeight: 728,
  });

  mainWindow = new BrowserWindow({
    show: false,
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    minWidth: 800,
    minHeight: 600,
    backgroundMaterial: 'tabbed',
    icon: getAssetPath('icon.png'),
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: titleBarColors.background,
      symbolColor: titleBarColors.symbol,
      height: 48,
    },
    autoHideMenuBar: true,
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
      webSecurity: true,
      allowRunningInsecureContent: false,
      navigateOnDragDrop: false,
    },
  });

  mainWindowState.manage(mainWindow);

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const parsedUrl = new URL(url);
    // Allow only your app's internal pages
    if (!url.startsWith('file://') && !url.startsWith('http://localhost')) {
      event.preventDefault();

      shell.openExternal(url);
    }
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.webContents.on('dom-ready', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }

    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('app-command', (e, cmd) => {
    if (!mainWindow) {
      return;
    }
    if (cmd === 'browser-backward') {
      mainWindow.webContents.send('navigate-command', 'back');
    } else if (cmd === 'browser-forward') {
      mainWindow.webContents.send('navigate-command', 'forward');
    }
  });

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    return { action: 'deny' };
  });
};

app.on('window-all-closed', () => {
  app.quit();
});

app
  .whenReady()
  .then(() => {
    createWindow();
  })
  .catch(console.log);

ipcMain.on(
  'update-titlebar-colors',
  (_event, colors: { background: string; symbol: string }) => {
    titleBarColors = colors;
    if (mainWindow) {
      mainWindow.setTitleBarOverlay({
        color: titleBarColors.background,
        symbolColor: titleBarColors.symbol,
        height: 48,
      });
    }
  },
);

ipcMain.on(
  'update-native-theme',
  (_event, theme: 'system' | 'light' | 'dark') => {
    nativeTheme.themeSource = theme;
  },
);

registerFileOperations();
