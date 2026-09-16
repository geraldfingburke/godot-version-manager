const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  selectDirectory: () => ipcRenderer.invoke('settings:select-dir'),
  getReleases: (forceRefresh) => ipcRenderer.invoke('releases:get', forceRefresh),
  getInstalled: () => ipcRenderer.invoke('installed:get'),
  launchVersion: (exePath) => ipcRenderer.invoke('installed:launch', exePath),
  openFolder: (folderPath) => ipcRenderer.invoke('installed:open-folder', folderPath),
  uninstallVersion: (id) => ipcRenderer.invoke('installed:uninstall', id),
  addCustomVersion: () => ipcRenderer.invoke('installed:add-custom'),
  toggleFavorite: (id) => ipcRenderer.invoke('installed:toggle-favorite', id),
  createShortcut: (versionData, alias) => ipcRenderer.invoke('installed:create-shortcut', { versionData, alias }),
  startDownload: (asset, customTargetDir, createShortcut, shortcutAlias) => ipcRenderer.invoke('download:start', { asset, customTargetDir, createShortcut, shortcutAlias }),
  onDownloadProgress: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('download:progress', handler);
    return () => ipcRenderer.removeListener('download:progress', handler);
  }
});
