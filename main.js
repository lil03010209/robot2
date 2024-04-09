const { app, BrowserWindow, ipcMain } = require('electron');
const hello = require('./hello.js');
const { dialog } = require('electron');

function createWindow() {
    let win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });
    win.loadFile('index.html');
}

app.whenReady().then(createWindow);

ipcMain.on('login-and-import-excel', async (event, arg) => {
    try {
        const result = await hello.run(arg.phoneNumber, arg.password, arg.filePath);
        event.reply('login-result', result);
    } catch (error) {
        console.error('Error executing run function:', error);
        event.reply('login-error', error.message);
    }
});

app.on('window-all-closed', () => {
    app.quit();
});
