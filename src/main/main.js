const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const StoreManager = require('./store');
const GodotService = require('./godotService');

let mainWindow;
const store = new StoreManager();
const godotService = new GodotService(store);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Godot Version Manager',
    backgroundColor: '#181b20',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  mainWindow.setMenu(null);

  const isDev = !app.isPackaged && process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Register IPC Handlers
ipcMain.handle('settings:get', () => {
  return store.getSettings();
});

ipcMain.handle('settings:save', async (event, newSettings) => {
  const current = store.getSettings();
  const updated = store.saveSettings(newSettings);

  if (newSettings.defaultInstallDir && newSettings.defaultInstallDir !== current.defaultInstallDir) {
    const discovered = await godotService.scanDirectoryForInstalls(newSettings.defaultInstallDir);
    return { settings: updated, discoveredCount: discovered.length };
  }
  return { settings: updated, discoveredCount: 0 };
});

ipcMain.handle('settings:select-dir', async () => {
  const selectedDir = await godotService.selectDirectory();
  if (selectedDir) {
    const discovered = await godotService.scanDirectoryForInstalls(selectedDir);
    return { path: selectedDir, discoveredCount: discovered.length };
  }
  return null;
});

ipcMain.handle('releases:get', async (event, forceRefresh) => {
  return await godotService.fetchReleases(forceRefresh);
});

ipcMain.handle('installed:get', () => {
  return store.getInstalledVersions();
});

ipcMain.handle('installed:launch', (event, exePath) => {
  return godotService.launchVersion(exePath);
});

ipcMain.handle('installed:open-folder', async (event, folderPath) => {
  return await godotService.openFolder(folderPath);
});

ipcMain.handle('installed:uninstall', async (event, id) => {
  return await godotService.uninstallVersion(id);
});

ipcMain.handle('installed:add-custom', async () => {
  const exePath = await godotService.selectExecutable();
  if (exePath) {
    return await godotService.addCustomVersion(exePath);
  }
  return null;
});

ipcMain.handle('installed:toggle-favorite', (event, id) => {
  return store.toggleFavorite(id);
});

ipcMain.handle('installed:create-shortcut', async (event, { versionData, alias }) => {
  return await godotService.createDesktopShortcut(versionData, alias);
});

ipcMain.handle('download:start', async (event, { asset, customTargetDir, createShortcut, shortcutAlias }) => {
  const onProgress = (progressData) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('download:progress', progressData);
    }
  };

  return await godotService.downloadAndInstall(asset, customTargetDir, createShortcut, shortcutAlias, onProgress);
});
