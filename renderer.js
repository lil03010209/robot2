const { ipcRenderer } = require('electron');

document.getElementById('start').addEventListener('click', () => {
    const phoneNumber = document.getElementById('phoneNumber').value;
    const password = document.getElementById('password').value;
    const fileInput = document.getElementById('excelFile');

    if (fileInput.files.length > 0) {
        const filePath = fileInput.files[0].path;
        ipcRenderer.send('login-and-import-excel', { phoneNumber, password, filePath });
    } else {
        alert('请选择一个 Excel 文件！');
    }
});

// 接收执行结果
ipcRenderer.on('login-result', (event, result) => {
    console.log('Login result:', result);
    document.getElementById('log').textContent = result; // 显示结果
});

// 接收错误信息
ipcRenderer.on('login-error', (event, error) => {
    console.error('Login error:', error);
    document.getElementById('log').textContent = `Error: ${error}`; // 显示错误信息
});
