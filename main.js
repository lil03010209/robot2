const { app, BrowserWindow, ipcMain } = require('electron');
const hello = require('./hello.js'); // 引入 hello.js
function createWindow() {
    let win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // 注意安全风险
            enableRemoteModule: true // 如果需要使用 remote 模块
        }
    });

    win.loadFile('index.html');
}

app.whenReady().then(createWindow);

ipcMain.on('login', async (event, arg) => {
    try {
        const result = await hello.run(arg.phoneNumber, arg.password); // 使用 arg 中的电话号码和密码调用 run 函数
        event.reply('login-result', result); // 发送执行结果回渲染进程
    } catch (error) {
        console.error('Error executing run function:', error);
        event.reply('login-error', error.message); // 发送错误信息回渲染进程
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
