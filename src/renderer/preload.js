const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  onNavigate: (callback) => ipcRenderer.on('navigate-to', (event, page) => callback(page)),
  onNewDocument: (callback) => ipcRenderer.on('new-document', () => callback()),
  onSearchFocus: (callback) => ipcRenderer.on('search-focus', () => callback()),
  onShowAbout: (callback) => ipcRenderer.on('show-about', () => callback()),
});
