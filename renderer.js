const { ipcRenderer } = require('electron');

document.getElementById('start').addEventListener('click', () => {
    const phoneNumber = document.getElementById('phoneNumber').value;
    const password = document.getElementById('password').value;
    const fileInput = document.getElementById('excelFile');
    const chromePath = document.getElementById('chromePath').value;

    if (fileInput.files.length > 0) {
        const filePath = fileInput.files[0].path;
        // 发送用户输入的电话号码、密码和Excel文件的路径到主进程
        ipcRenderer.send('login-and-import-excel', { phoneNumber, password, filePath,chromePath });
    } else {
        // 如果用户没有选择Excel文件，则弹出提示
        alert('请选择一个 Excel 文件！');
    }
});

// 监听来自主进程的进度更新消息
ipcRenderer.on('update-progress', (event, progress) => {
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `${progress}%`;
});

// 接收执行结果的消息
ipcRenderer.on('login-result', (event, result) => {
    console.log('Login result:', result);
    // 将结果显示到页面上
    document.getElementById('log').textContent = result;
});

// 接收错误信息的消息
ipcRenderer.on('login-error', (event, error) => {
    console.error('Login error:', error);
    // 将错误信息显示到页面上
    document.getElementById('log').textContent = `Error: ${error}`;
});
