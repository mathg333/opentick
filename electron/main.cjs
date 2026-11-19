const { app, BrowserWindow, shell, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

// Garante instância única
const gotTheLock = app.requestSingleInstanceLock();
let mainWindow = null;

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  function createWindow() {
    const icoPath = path.join(__dirname, '../public/icon.ico');
    const pngPath = path.join(__dirname, '../public/icon.png');
    const iconToUse = fs.existsSync(icoPath) ? icoPath : pngPath;

    mainWindow = new BrowserWindow({
      width: 1320,
      height: 880,
      minWidth: 960,
      minHeight: 640,
      backgroundColor: '#0c0c0e',
      title: 'OpenTask - Dark Minimalista',
      icon: iconToUse,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    // Abrir links externos no navegador padrão do sistema
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('https:') || url.startsWith('http:')) {
        shell.openExternal(url);
      }
      return { action: 'deny' };
    });

    // Carrega o build de produção Vite
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));

    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  }

  app.whenReady().then(() => {
    // Menu minimalista sem poluição visual
    Menu.setApplicationMenu(null);
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}

