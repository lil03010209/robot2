const puppeteer = require('puppeteer');
const XLSX = require('xlsx');

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchRiskAssessmentForPhoneNumber(page, phoneNumber) {

    const phoneNumber1 = String(phoneNumber);

    // 等待电话号码输入框出现
    await page.waitForSelector('.ivu-input-default[placeholder="请输入电话号码"]', {visible: true});

    // 清空可能存在的电话号码输入框内容
    await page.evaluate(() => document.querySelector('.ivu-input-default[placeholder="请输入电话号码"]').value = '');

    // 输入新的电话号码
    await page.type('.ivu-input-default[placeholder="请输入电话号码"]', phoneNumber1);

    // 点击“查询”按钮
    await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            if (button.innerText.includes('查询')) {
                button.click();
            }
        });
    });

    // 等待网络闲置，确保加载完成
    await page.waitForNetworkIdle();

    // 检查是否有风险评估信息或“暂无数据”
    const riskAssessment = await page.evaluate(() => {
        const noDataElement = document.querySelector('.ivu-table-tip');
        if (noDataElement && (noDataElement.offsetParent !== null || getComputedStyle(noDataElement).display !== 'none') && noDataElement.textContent.includes('暂无数据')) {
            return '暂无数据';
        }

        const riskElement = document.querySelector('div.risk-type span');
        return riskElement ? riskElement.innerText : '未找到风险评估信息';
    });

    return riskAssessment;
}



async function run(phoneNumber, password) {



    const browser = await puppeteer.launch({
        headless: false, // 以非无头模式运行
        args: ['--window-size=2560,1440'], // 设置浏览器窗口大小为2K分辨率
        defaultViewport: null, // 使用args中指定的窗口大小
    });
    const page = await browser.newPage();
    await page.goto('https://hnasp.cup.com.cn/'); // 替换为实际的登录页面URL

    // 填写账号
    await page.type('input[placeholder="请输入电话号码进行登录"]', phoneNumber);

    // 填写密码
    await page.type('input[type="password"][placeholder="请输入密码"]', password);

    // console.log('请在浏览器中手动输入验证码...');

    // 在页面中注入提示信息
    await page.evaluate(() => {
        const body = document.querySelector('body');
        const message = document.createElement('div');
        message.setAttribute('style', `
            position: fixed; 
            top: 50%; 
            left: 50%; 
            transform: translate(-50%, -50%); 
            background-color: yellow; 
            padding: 20px; 
            z-index: 10000; 
            font-size: 20px; 
            border-radius: 10px; 
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);`);
        message.textContent = '请在12秒内输入验证码，如果输入验证码有误，会重复计时12秒';
        body.appendChild(message);

        // 12秒后自动移除提示信息
        setTimeout(() => {
            body.removeChild(message);
        }, 12000);
    });




    let loginSuccess = false; // 初始化登录成功标志为false

    while (!loginSuccess) {
        console.log('请在浏览器中手动输入验证码，并点击登录...');

        // 等待用户输入验证码并点击登录，这里假设用户能在12秒内完成
        await wait(12000);

        // 点击登录按钮
        await page.click('button.login-btn');

        console.log('已点击登录按钮，等待页面响应...');

        // 等待网络活动减少，页面加载完成
        await page.waitForNetworkIdle();

        try {
            // 检查登录成功的标志是否出现，这里以`.ivu-modal-confirm-footer .ivu-btn-primary`为例
            // 注意调整选择器以匹配实际页面元素
            await page.waitForSelector('.ivu-modal-confirm-footer .ivu-btn-primary', { visible: true, timeout: 5000 });

            // 如果成功找到标志，说明登录成功
            loginSuccess = true;
            console.log('登录成功，继续后续操作...');

            // 点击确认按钮或进行其他操作
            await page.click('.ivu-modal-confirm-footer .ivu-btn-primary');

        } catch (error) {
            // 如果等待超时，说明登录未成功，可能是验证码错误
            console.log('登录未成功，可能是验证码错误或其他原因，重新尝试...');
            // 这里不需要额外的代码，循环会继续，等待用户重新操作
        }
    }





    await page.waitForNetworkIdle();
    await wait(1000); // 等待60秒


    // 点击导航栏的“业务数据”按钮
    await page.evaluate(() => {
        const button = [...document.querySelectorAll('span')].find(el => el.textContent.trim() === '业务数据');
        if (button) button.click();
    });

    // 增加显式等待确保日期选择器完全加载
    await page.waitForNetworkIdle();
    await wait(1000); // 等待60秒 // 根据实际情况调整等待时间


    // 点击日期选择框
    await page.click('input[placeholder="请选择..."]');

    // 增加显式等待确保日期选择器完全加载
    await page.waitForNetworkIdle();
    await wait(1000); // 等待60秒 // 根据实际情况调整等待时间


    // 点击“本月内”快捷方式，假设它可以通过文本内容定位
    await page.evaluate(() => {
        const options = Array.from(document.querySelectorAll('.ivu-picker-panel-shortcut'));
        const targetOption = options.find(option => option.textContent.includes('近三月'));
        if(targetOption) targetOption.click();
    });

    // 等待并点击确定按钮
    await page.evaluate(() => {
        // 查找所有的按钮
        const buttons = document.querySelectorAll('button');
        // 遍历按钮，找到文本内容为“确定”的那个按钮并点击
        buttons.forEach(button => {
            if (button.innerText === '确定') {
                button.click();
            }
        });
    });

    // 读取Excel文件
    const workbook = XLSX.readFile('./number.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    // 确保列名被正确解析
    let phoneNumbers = XLSX.utils.sheet_to_json(worksheet, { header: 1 });


    // 跳过第一行的列名
    for (let i = 1; i < phoneNumbers.length; i++) {
        const phoneNumber = phoneNumbers[i][0]; // 假设电话号码在第一列
        const riskAssessment = await fetchRiskAssessmentForPhoneNumber(page, phoneNumber);
        phoneNumbers[i][1] = riskAssessment; // 假设状态在第二列
        // 实时更新 Excel 文件，每次循环时都写入
        const newWorksheet = XLSX.utils.aoa_to_sheet(phoneNumbers);
        workbook.Sheets[sheetName] = newWorksheet;
        XLSX.writeFile(workbook, './number.xlsx'); // 每次获取结果后都重新写入文件

        console.log(`电话号码 ${i}: ${phoneNumber} 的风险评估：`, riskAssessment);
    }

    // 循环结束后关闭浏览器实例
    await browser.close();
}

module.exports = { run };
