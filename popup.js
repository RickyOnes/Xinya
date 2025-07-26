// 在文件顶部添加Supabase配置
const SUPABASE_URL = 'https://iglmqwpagzjadwauvchh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnbG1xd3BhZ3pqYWR3YXV2Y2hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4ODk4NDAsImV4cCI6MjA2NjQ2NTg0MH0.Mtiwp31mJvbLRTotbrb4_DobjjpM4kg9f4-G8oWz85E';

document.addEventListener('DOMContentLoaded', () => {
    const extractBtn = document.getElementById('extractBtn');
    const statusDiv = document.getElementById('status');
    const finishBtn = document.getElementById('finishBtn');

    let collectedData = []; // 初始化：从 chrome.storage 加载已收集的数据
    let counts = 0;
    chrome.storage.local.get(['collectedData'], (result) => {
        if (result.collectedData) {
            collectedData = result.collectedData;
            counts = collectedData.length;
            statusDiv.innerHTML = 
                `已收集<span style="font-weight: bold;color: red;"> ${counts} </span>条商品数据。` +
                `<button id="deleteDataBtn" class="deleteDataBtn">删除数据</button>` +
                `<br>如果全部网页数据收集完毕，请点击<span style="font-weight: bold;color: green;">【完成抓取更新Excel】</span>按钮更新数据。`;
            finishBtn.disabled = false;
            statusDiv.className = 'success';
        }
    }); 
    
    // 添加全局事件监听器（只需绑定一次）
    document.addEventListener('click', (e) => {
        // 处理删除按钮
        if (e.target.id === 'deleteDataBtn') {
            deleteCollectedData();
        }
        // 处理上传按钮
        else if (e.target.id === 'uploadDataBtn') {
            handleUpload(e);
        }
        // 处理打开文件按钮
        else if (e.target.id === 'openFileBtn') {
            handleOpenFile(e);
        }
        // 处理重试按钮
        else if (e.target.id === 'retryBtn') {
            sendData();
        }
    });

    // 上传数据到Supabase
    async function uploadToSupabase(data) {
        try {
            // 转换日期格式为YYYY-MM-DD
            const formattedData = data.map(item => ({
                sale_date: formatDate(item.date), // 使用原始英文字段
                product_id: item.id.replace('ID:', ''),
                product_name: item.name,
                warehouse: item.warehouse,
                quantity: item.quantity,
                unit_price: item.price
            }));

            const response = await fetch(`${SUPABASE_URL}/rest/v1/sales_records`, {
                method: 'POST',
                headers: { 
                    'apikey': SUPABASE_KEY, // 添加apikey
                    'Authorization': `Bearer ${SUPABASE_KEY}`, // 添加 Authorization 头
                    'Content-Type': 'application/json', // 指定请求头
                    'Prefer': 'return=minimal' // 成功时不返回数据
                },
                body: JSON.stringify(formattedData) // 将数据转换为JSON
            });

            // 处理空响应
            if (response.status === 204) {
                console.log('上传成功（无内容返回）');
                return { success: true };
            }
            
            // 添加详细的错误日志
            if (!response.ok) {
                const errorBody = await response.text();
                console.error('Supabase错误详情:', {
                    status: response.status,
                    statusText: response.statusText,
                    url: response.url,
                    errorBody
                });
                throw new Error(`上传失败: ${response.status} ${response.statusText}`);
            }

            // 如果有内容则尝试解析
            const contentLength = response.headers.get('Content-Length');
            if (contentLength && parseInt(contentLength) > 0) {
                return await response.json();
            } else {
                return { success: true };
            }
        } catch (error) {
            console.error('上传到Supabase失败:', error);
            throw error;
        }
    }

    // 日期格式化辅助函数
    function formatDate(dateString) {
        // 假设原始日期格式为 "YYYY/MM/DD" 或 "YYYY-MM-DD"
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // 添加删除按钮事件监听
    document.addEventListener('click', (e) => {
        if (e.target.id === 'deleteDataBtn') {
            deleteCollectedData();
        }
    });    

    function deleteCollectedData() {
        // 删除所有相关数据
        chrome.storage.local.remove(['collectedData' ], () => {
            statusDiv.innerHTML = '已删除所有抓取的数据'; 
            statusDiv.className = 'success';
            extractBtn.disabled = false;
            extractBtn.classList.remove('loading');
            extractBtn.innerHTML = '抓取当前<br>页面数据';
            finishBtn.disabled = true;
            collectedData = [];
        });
    }
    
    // 打开文件处理函数
    function handleOpenFile(e) {
        chrome.runtime.sendNativeMessage(
            'com.excel_updater2',
            { type: "open_file", filePath: window.currentResponse.filePath },
            (openResponse) => {
                if (!openResponse || openResponse.status !== "success") {
                    console.error('打开文件失败:', openResponse?.message);
                }
            }
        );
    }

    // 上传处理函数
    async function handleUpload(e) {
        const uploadBtn = e.target;
        uploadBtn.disabled = true;
        uploadBtn.textContent = '上传中...';
        
        try {
            // 分批上传数据
            const batchSize = 100;
            const totalItems = collectedData.length;
            for (let i = 0; i < collectedData.length; i += batchSize) {
                const batch = collectedData.slice(i, i + batchSize);
                await uploadToSupabase(batch);
                
                // 更新状态显示
                statusDiv.innerHTML = `${window.currentResponse.message}<br>已上传 ${Math.min(i + batchSize, collectedData.length)}/${collectedData.length} 条数据` +
                    `<br><br><button id="uploadDataBtn" class="deleteDataBtn" disabled>上传中...</button>` +
                    `<button id="openFileBtn" class="deleteDataBtn">打开文件</button>`;
            }
            
            statusDiv.innerHTML = `${window.currentResponse.message}<br>数据上传服务器成功！共上传 ${totalItems}/${totalItems} 条数据` +
                `<br><br><button id="openFileBtn" class="deleteDataBtn">打开文件</button>`;
        } catch (uploadError) {
            console.error('上传到Supabase失败:', uploadError);
            statusDiv.innerHTML = `${window.currentResponse.message}<br>数据上传失败: ${uploadError.message}` +
                `<br><br><button id="uploadDataBtn" class="deleteDataBtn">重新上传</button>` +
                `<button id="openFileBtn" class="deleteDataBtn">打开文件</button>`;
        }
    }

    // 抓取当前页面数据
    extractBtn.addEventListener('click', async () => {
        statusDiv.innerHTML = '正在抓取页面数据...';
        extractBtn.disabled = true;
        extractBtn.innerHTML = `<span class="spinner"></span> 提取中...`;

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (tab) {
                const scrapeResults = await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: scrapeDataFromPage,
                });

                const scrapedData = scrapeResults[0]?.result;

                if (!scrapedData || Object.keys(scrapedData).length === 0) {
                    statusDiv.textContent = '不是【多多买菜】订货管理页面，或查询超过7天';
                    statusDiv.className = 'error';
                }

                // 合并数据,并去重
                //collectedData = collectedData.concat(scrapedData); 这里存在问题，数据会重复
                counts = collectedData.length;
                const seenKeys = new Map();
                collectedData = [...collectedData, ...scrapedData].filter(item => 
                    !seenKeys.has(`${item.id}|${item.warehouse}|${item.price}`) &&  // 不存在则保留
                    seenKeys.set(`${item.id}|${item.warehouse}|${item.price}`, true) // 已存在则过滤
                );
                
                // 持久化存储
                chrome.storage.local.set({ collectedData: collectedData }, () => {
                statusDiv.innerHTML = 
                    `已收集<span style="font-weight: bold;color: red;"> ${collectedData.length} </span>条商品数据，本次重复收集<span style="font-weight: bold;color: red;"> ${scrapedData.length-collectedData.length+counts} </span>条
                    <button id="deleteDataBtn" class="deleteDataBtn">删除数据</button>
                    如果全部网页数据收集完毕，请点击<span style="font-weight: bold;color: green;">【完成抓取更新Excel】</span>按钮更新数据。`;
                    statusDiv.className = 'processing';
                    extractBtn.disabled = false;
                    finishBtn.disabled = false;
                    extractBtn.innerHTML = `抓取当前<br>页面数据`;
                });
            }
        } catch (error) {
            statusDiv.textContent = `错误: ${error.message}`;
            statusDiv.className = 'error';
            console.error('数据处理失败:', error);

        }
    });

    // 完成抓取，发送所有数据
    finishBtn.addEventListener('click', () => { 
        if (collectedData.length === 0) {
            statusDiv.textContent = '还未抓取网页数据，请先点击【抓取当前页面数据】按扭';
            statusDiv.className = 'error';
            return;
        }   
        
        // 开始发送数据
        sendData();
    });            
    function sendData() {
        statusDiv.textContent = '正在更新Excel...';
        statusDiv.className = 'processing';
        extractBtn.disabled = true;

        // 修改按钮状态
        finishBtn.classList.add('loading');
        finishBtn.innerHTML = `<span class="spinner"></span> 正在更新Excel...`;
        finishBtn.disabled = true;

        chrome.runtime.sendNativeMessage(
            'com.excel_updater2',
            { type: "update_excel", data: collectedData },
            async (response) => {
                if (response && response.status === "success") {
                    // 存储响应数据供后续使用
                    window.currentResponse = response;
                    
                    // 删除本地数据
                    chrome.storage.local.remove('collectedData', () => {
                        // 显示操作按钮
                        statusDiv.innerHTML = 
                            `${response.message}` +
                            `<br><br><button id="uploadDataBtn" class="deleteDataBtn">上传到服务器</button>` +
                            `<button id="openFileBtn" class="deleteDataBtn">打开文件</button>`;
                        statusDiv.className = 'success';
                        
                        // 添加红色退出按钮
                        finishBtn.disabled = false;
                        finishBtn.classList.remove('loading');
                        finishBtn.innerHTML = '退出';
                        finishBtn.style.backgroundColor = '#e74c3c';
                    }); 

                    // 绑定退出按钮
                    finishBtn.addEventListener('click', () => {
                        window.close();
                    });                    

                } else {
                    // 更新失败
                    let remaining = 8;
                    const errorMsg = response?.message || "端口配置错误";

                    if (errorMsg.includes("[Errno 13]")) {
                        statusDiv.innerHTML = 
                            `Excel文件保存失败！` +
                            `<button id="retryBtn" class="retry-button">重试</button>` +
                            `<br><br>请检查要更新的文件是否已被打开或占用？`;
                        statusDiv.className = 'error';
                    } else {
                        statusDiv.textContent = `错误: ${errorMsg}`;
                        statusDiv.className = 'error';
                    }

                    finishBtn.innerHTML = `更新错误！<br>${remaining}秒后关闭`;
                    finishBtn.disabled = true;

                    const countdownInterval = setInterval(() => {
                        remaining--;
                        if (remaining > 0) {
                            finishBtn.innerHTML = `更新错误！<br>${remaining}秒后关闭`;
                        } else {
                            clearInterval(countdownInterval);
                            document.body.style.animation = 'fadeOut 0.3s forwards';
                            setTimeout(() => window.close(), 300);
                        }
                    }, 1000);

                    // 绑定重试事件
                    if (document.getElementById('retryBtn')) {
                        document.getElementById('retryBtn').addEventListener('click', () => {
                            clearInterval(countdownInterval); 
                            sendData();
                        });
                    }
                }
            }
        );
    }
});

function scrapeDataFromPage() {
    const results = [];

    try {
        const table = document.querySelector('.TB_outerWrapper_5-157-0.TB_bordered_5-157-0.TB_notTreeStriped_5-157-0');

        if (table) {
            const tbody = table.querySelector('tbody');
            const rows = tbody.querySelectorAll('tr');

            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                const rowData = [];

                for (let i = 0; i < 13; i++) {
                    rowData.push(cells[i].textContent.trim());
                }

                // 拆分销售数和商家报价
                const salesNumbers = rowData[11].match(/\d+/g)?.map(Number) || [];
                const prices = rowData[12].match(/\d+(\.\d+)?/g)?.map(Number) || [];

                if (salesNumbers.length !== prices.length) {
                    console.error('销售数和价格数量不一致', rowData);
                    return;
                }

                // 提取商品 ID 和名称
                const idMatch = rowData[0].match(/^(.*?)ID:(\d+).*$/);
                const id = idMatch ? `ID:${idMatch[2]}` : '';

                // 商品名称 + 去除多余文本
                const name = idMatch ? idMatch[1].trim() : "";

                // 仓库信息处理
                const warehouse = rowData[2].replace('查看地址', '').trim();
 
                // 处理商品规格
                const specs = rowData[5].trim();

                // 处理销售日期
                const date = rowData[4].trim();

                // 构造每条记录
                for (let i = 0; i < salesNumbers.length; i++) {
                    const quantity = parseInt(salesNumbers[i]) || 0;
                    const price = parseFloat(prices[i]) || 0;

                    if (!id || !name || !warehouse) continue;

                    results.push({
                        date,
                        id,
                        name,
                        specs,
                        warehouse,
                        quantity,
                        price
                    });
                }
            });
        }

        console.log('抓取到的数据:', results);
        return results;

    } catch (error) {
        console.error('数据抓取出错:', error);
        return [];
    }
}