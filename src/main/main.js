const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, '../../public/images/icon.png')
  });

  // Démarrer le serveur
  startServer();

  // Charger l'interface après un délai pour laisser le serveur démarrer
  setTimeout(() => {
    mainWindow.loadURL('http://localhost:3000');
  }, 2000);

  // Ouvrir les outils de développement en mode dev
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (serverProcess) {
      serverProcess.kill();
    }
  });
}

function startServer() {
  const serverPath = path.join(__dirname, '../server/server.js');
  serverProcess = spawn('node', [serverPath], {
    cwd: process.cwd(),
    stdio: 'inherit'
  });

  serverProcess.on('error', (err) => {
    console.error('Erreur du serveur:', err);
  });
}

function createMenu() {
  const template = [
    {
      label: 'Fichier',
      submenu: [
        {
          label: 'Nouveau document',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('new-document');
          }
        },
        {
          label: 'Rechercher',
          accelerator: 'CmdOrCtrl+F',
          click: () => {
            mainWindow.webContents.send('search-focus');
          }
        },
        { type: 'separator' },
        {
          label: 'Quitter',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Gestion',
      submenu: [
        {
          label: 'Documents',
          click: () => {
            mainWindow.webContents.send('navigate-to', 'documents');
          }
        },
        {
          label: 'Utilisateurs',
          click: () => {
            mainWindow.webContents.send('navigate-to', 'users');
          }
        },
        {
          label: 'Emprunts',
          click: () => {
            mainWindow.webContents.send('navigate-to', 'loans');
          }
        }
      ]
    },
    {
      label: 'Aide',
      submenu: [
        {
          label: 'À propos',
          click: () => {
            mainWindow.webContents.send('show-about');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createWindow();
  createMenu();
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Gérer les messages IPC
ipcMain.on('get-app-version', (event) => {
  event.reply('app-version', app.getVersion());
});

ipcMain.on('minimize-window', () => {
  mainWindow.minimize();
});

ipcMain.on('maximize-window', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.on('close-window', () => {
  mainWindow.close();
});