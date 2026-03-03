const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // Check if we are in development mode by checking environment variable or arguments
    const isDev = process.env.NODE_ENV === 'development' || process.defaultApp;

    if (isDev) {
        // In dev, load the Vite dev server
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        // In production, load the built React app index.html
        mainWindow.loadFile(path.join(__dirname, 'frontend/dist/index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function startBackend() {
    const backendPath = path.join(__dirname, 'backend');

    // Use node to spawn the backend's index.js
    backendProcess = spawn('node', ['index.js'], {
        cwd: backendPath,
        shell: true,
        stdio: 'inherit' // Helps with debugging by passing stdio to the electron console if started from terminal
    });

    backendProcess.on('error', (err) => {
        console.error('Failed to start backend process:', err);
    });

    backendProcess.on('exit', (code, signal) => {
        console.log(`Backend process exited with code ${code} and signal ${signal}`);
    });
}

app.whenReady().then(() => {
    // 1. Kick off the node backend immediately
    startBackend();

    // 2. Open the desktop UI
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Make sure to forcefully kill the backend when Electron closes so it doesn't leave a zombie port 5000 process
app.on('will-quit', () => {
    if (backendProcess) {
        console.log('Terminating backend process...');
        backendProcess.kill('SIGTERM');
    }
});
