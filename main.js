const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const hello = require('./hello.js');

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

// 处理登录和导入Excel的请求
ipcMain.on('login-and-import-excel', async (event, arg) => {
    // 进度更新回调函数
    const updateProgressCallback = (progress) => {
        event.sender.send('update-progress', progress);
    };

    try {
        // 修改run函数调用，传入进度更新回调
        const result = await hello.run(arg.phoneNumber, arg.password, arg.filePath, updateProgressCallback);
        event.reply('login-result', result);
    } catch (error) {
        console.error('Error executing run function:', error);

        // 使用 dialog.showErrorBox 显示错误信息
        dialog.showErrorBox('错误', `执行失败: ${error.message}`);

        event.reply('login-error', error.message);
    }
});

app.on('window-all-closed', () => {
    app.quit();
});
