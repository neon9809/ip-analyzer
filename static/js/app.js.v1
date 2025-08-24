// IP地址安全分析工具 JavaScript

let currentTaskId = null;
let analysisResults = [];
let statusCheckInterval = null;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 从localStorage恢复API密钥
    const savedApiKey = localStorage.getItem('abuseipdb_api_key');
    if (savedApiKey) {
        document.getElementById('apiKey').value = savedApiKey;
        updateApiStatus('已配置', 'success');
    }
    
    // API密钥输入事件
    document.getElementById('apiKey').addEventListener('input', function() {
        const apiKey = this.value.trim();
        if (apiKey) {
            localStorage.setItem('abuseipdb_api_key', apiKey);
            updateApiStatus('已配置', 'success');
        } else {
            localStorage.removeItem('abuseipdb_api_key');
            updateApiStatus('未配置', 'secondary');
        }
    });
    
    // IP输入框事件
    document.getElementById('ipInput').addEventListener('input', countIPs);
});

// 更新API状态显示
function updateApiStatus(text, type) {
    const statusElement = document.getElementById('apiStatus');
    statusElement.className = `alert alert-${type}`;
    statusElement.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i> ${text}`;
}

// 加载示例IP
function loadSampleIPs() {
    const sampleIPs = `101.133.148.169
103.203.56.1, 103.203.57.3
104.28.89.57 106.75.30.104
112.4.101.27; 13.86.115.177
165.232.117.4
2001:4860:4860::8888
2001:4860:4860::8844
::1
2001:db8::1, 2001:db8::2`;
    
    document.getElementById('ipInput').value = sampleIPs;
    countIPs();
}

// 清空IP输入
function clearIPs() {
    document.getElementById('ipInput').value = '';
    document.getElementById('ipCount').style.display = 'none';
}

// 统计IP数量
function countIPs() {
    const ipText = document.getElementById('ipInput').value.trim();
    if (!ipText) {
        document.getElementById('ipCount').style.display = 'none';
        return;
    }
    
    const ipList = parseIPs(ipText);
    const countElement = document.getElementById('ipCountText');
    const countContainer = document.getElementById('ipCount');
    
    countElement.textContent = `${ipList.length}个IP地址`;
    countContainer.style.display = 'block';
    
    // 检查API限制
    if (ipList.length > 1000) {
        countContainer.className = 'mt-3 alert alert-warning';
        countElement.innerHTML = `${ipList.length}个IP地址 <br><small>⚠️ 超过每日API限制(1000次)</small>`;
    } else if (ipList.length > 800) {
        countContainer.className = 'mt-3 alert alert-warning';
        countElement.innerHTML = `${ipList.length}个IP地址 <br><small>⚠️ 接近每日API限制</small>`;
    } else {
        countContainer.className = 'mt-3 alert alert-info';
    }
}

// 解析IP地址
function parseIPs(ipText) {
    const ipList = [];
    
    // 预处理：统一分隔符，支持多种格式
    let processedText = ipText
        .replace(/[,;|]/g, ' ')  // 将逗号、分号、竖线替换为空格
        .replace(/\s+/g, ' ')    // 多个空格合并为一个
        .trim();
    
    // 按行和空格分割
    const lines = processedText.split('\n');
    
    for (const line of lines) {
        const cleanLine = line.trim();
        if (cleanLine) {
            // 按空格分割每行
            const ips = cleanLine.split(/\s+/);
            for (const ip of ips) {
                const cleanIP = ip.trim();
                if (cleanIP && isValidIP(cleanIP)) {
                    ipList.push(cleanIP);
                }
            }
        }
    }
    
    return [...new Set(ipList)]; // 去重
}

// 增强的IP地址验证（支持IPv4和IPv6）
function isValidIP(ip) {
    // IPv4 正则表达式
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    
    // IPv6 正则表达式（简化版，支持常见格式）
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$|^(?:[0-9a-fA-F]{1,4}:)*::(?:[0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:)*::[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:)*::$/;
    
    // IPv6 映射的IPv4地址
    const ipv6MappedRegex = /^::ffff:(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/i;
    
    return ipv4Regex.test(ip) || ipv6Regex.test(ip) || ipv6MappedRegex.test(ip);
}

// 格式化IP地址显示
function formatIPForDisplay(ip) {
    // IPv6地址可能很长，需要特殊处理显示
    if (ip.includes(':')) {
        // 这是IPv6地址
        if (ip.length > 20) {
            return ip.substring(0, 17) + '...';
        }
    }
    return ip;
}

// 开始分析
async function startAnalysis() {
    const ipText = document.getElementById('ipInput').value.trim();
    const apiKey = document.getElementById('apiKey').value.trim();
    
    if (!ipText) {
        alert('请输入IP地址');
        return;
    }
    
    if (!apiKey) {
        alert('请输入AbuseIPDB API密钥');
        return;
    }
    
    const ipList = parseIPs(ipText);
    if (ipList.length === 0) {
        alert('未找到有效的IP地址');
        return;
    }
    
    if (ipList.length > 1000) {
        if (!confirm(`您输入了${ipList.length}个IP地址，超过了每日API限制(1000次)。是否继续？`)) {
            return;
        }
    }
    
    try {
        // 发送分析请求
        const response = await fetch('/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ips: ipText,
                api_key: apiKey
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || '分析请求失败');
        }
        
        const data = await response.json();
        currentTaskId = data.task_id;
        
        // 显示进度区域
        showProgressSection();
        
        // 开始检查状态
        startStatusCheck();
        
    } catch (error) {
        alert('分析启动失败: ' + error.message);
    }
}

// 显示进度区域
function showProgressSection() {
    document.getElementById('progressSection').style.display = 'block';
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('stopBtn').style.display = 'inline-block';
    
    // 重置进度
    updateProgress(0, 0, 0, '准备中...', '-');
}

// 开始状态检查
function startStatusCheck() {
    if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
    }
    
    statusCheckInterval = setInterval(checkAnalysisStatus, 2000);
    checkAnalysisStatus(); // 立即检查一次
}

// 检查分析状态
async function checkAnalysisStatus() {
    if (!currentTaskId) return;
    
    try {
        const response = await fetch(`/status/${currentTaskId}`);
        if (!response.ok) {
            throw new Error('状态检查失败');
        }
        
        const status = await response.json();
        
        if (status.status === 'running') {
            const progress = status.total > 0 ? (status.completed / status.total) * 100 : 0;
            updateProgress(
                progress,
                status.completed || 0,
                status.total || 0,
                '分析中...',
                status.current_ip || '-'
            );
        } else if (status.status === 'completed') {
            // 分析完成
            clearInterval(statusCheckInterval);
            await loadResults();
        } else if (status.status === 'error') {
            clearInterval(statusCheckInterval);
            alert('分析失败: ' + (status.error || '未知错误'));
            hideProgressSection();
        }
        
    } catch (error) {
        console.error('状态检查错误:', error);
    }
}

// 更新进度显示
function updateProgress(percentage, completed, total, status, currentIP) {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    progressBar.style.width = percentage + '%';
    progressText.textContent = Math.round(percentage) + '%';
    
    document.getElementById('currentStatus').textContent = status;
    document.getElementById('currentIP').textContent = currentIP;
    document.getElementById('completedCount').textContent = completed;
    document.getElementById('totalCount').textContent = total;
    
    // 估算剩余时间
    if (completed > 0 && completed < total) {
        const avgTimePerIP = 1.2; // 秒
        const remaining = (total - completed) * avgTimePerIP;
        const minutes = Math.floor(remaining / 60);
        const seconds = Math.floor(remaining % 60);
        document.getElementById('estimatedTime').textContent = 
            minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
    } else {
        document.getElementById('estimatedTime').textContent = '计算中...';
    }
}

// 加载分析结果
async function loadResults() {
    try {
        const response = await fetch(`/results/${currentTaskId}`);
        if (!response.ok) {
            throw new Error('结果加载失败');
        }
        
        analysisResults = await response.json();
        
        // 隐藏进度，显示结果
        hideProgressSection();
        showResults();
        
    } catch (error) {
        alert('结果加载失败: ' + error.message);
    }
}

// 隐藏进度区域
function hideProgressSection() {
    document.getElementById('progressSection').style.display = 'none';
    document.getElementById('stopBtn').style.display = 'none';
}

// 显示分析结果
function showResults() {
    document.getElementById('resultsSection').style.display = 'block';
    
    // 更新统计摘要
    updateSummaryStats();
    
    // 更新结果表格
    updateResultsTable();
}

// 更新统计摘要
function updateSummaryStats() {
    const stats = {
        total: analysisResults.length,
        high: 0,
        medium: 0,
        low: 0
    };
    
    analysisResults.forEach(result => {
        switch (result.risk_level) {
            case '高风险':
                stats.high++;
                break;
            case '中风险':
                stats.medium++;
                break;
            case '低风险':
                stats.low++;
                break;
            default:
                stats.low++;
        }
    });
    
    document.getElementById('totalAnalyzed').textContent = stats.total;
    document.getElementById('highRiskCount').textContent = stats.high;
    document.getElementById('mediumRiskCount').textContent = stats.medium;
    document.getElementById('lowRiskCount').textContent = stats.total - stats.high - stats.medium;
}

// 更新结果表格
function updateResultsTable() {
    const tbody = document.getElementById('resultsTableBody');
    tbody.innerHTML = '';
    
    analysisResults.forEach((result, index) => {
        const row = document.createElement('tr');
        
        // 风险等级颜色
        const riskClass = getRiskClass(result.risk_level);
        
        row.innerHTML = `
            <td class="ip-cell">${result.ip}</td>
            <td><span class="badge ${riskClass}">${result.risk_level || '未知'}</span></td>
            <td>${result.abuse_confidence || 'N/A'}</td>
            <td>${result.total_reports || 'N/A'}</td>
            <td>${result.country || 'N/A'}</td>
            <td>${result.city || 'N/A'}</td>
            <td class="text-truncate" style="max-width: 200px;" title="${result.org || 'N/A'}">${result.org || 'N/A'}</td>
            <td class="text-truncate" style="max-width: 150px;" title="${result.dns_ptr || 'N/A'}">${result.dns_ptr || 'N/A'}</td>
            <td>
                <button class="btn btn-sm btn-outline-info" onclick="showDetails(${index})">
                    <i class="fas fa-info-circle"></i> 详情
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// 获取风险等级CSS类
function getRiskClass(riskLevel) {
    switch (riskLevel) {
        case '高风险': return 'bg-danger';
        case '中风险': return 'bg-warning text-dark';
        case '低风险': return 'bg-info';
        default: return 'bg-success';
    }
}

// 显示详细信息
function showDetails(index) {
    const result = analysisResults[index];
    const modal = new bootstrap.Modal(document.getElementById('detailModal'));
    const modalBody = document.getElementById('detailModalBody');
    
    modalBody.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <h6>基本信息</h6>
                <table class="table table-sm">
                    <tr><td><strong>IP地址:</strong></td><td class="ip-cell">${result.ip}</td></tr>
                    <tr><td><strong>风险等级:</strong></td><td><span class="badge ${getRiskClass(result.risk_level)}">${result.risk_level || '未知'}</span></td></tr>
                    <tr><td><strong>风险评分:</strong></td><td>${result.risk_score || 0}</td></tr>
                    <tr><td><strong>风险因素:</strong></td><td>${result.risk_factors || '无'}</td></tr>
                </table>
                
                <h6>地理位置</h6>
                <table class="table table-sm">
                    <tr><td><strong>国家:</strong></td><td>${result.country || 'N/A'}</td></tr>
                    <tr><td><strong>地区:</strong></td><td>${result.region || 'N/A'}</td></tr>
                    <tr><td><strong>城市:</strong></td><td>${result.city || 'N/A'}</td></tr>
                    <tr><td><strong>经纬度:</strong></td><td>${result.location || 'N/A'}</td></tr>
                    <tr><td><strong>时区:</strong></td><td>${result.timezone || 'N/A'}</td></tr>
                </table>
            </div>
            <div class="col-md-6">
                <h6>安全信息</h6>
                <table class="table table-sm">
                    <tr><td><strong>恶意置信度:</strong></td><td>${result.abuse_confidence || 'N/A'}</td></tr>
                    <tr><td><strong>举报次数:</strong></td><td>${result.total_reports || 'N/A'}</td></tr>
                    <tr><td><strong>最后举报:</strong></td><td>${result.last_reported || 'N/A'}</td></tr>
                    <tr><td><strong>使用类型:</strong></td><td>${result.usage_type || 'N/A'}</td></tr>
                    <tr><td><strong>白名单:</strong></td><td>${result.is_whitelisted || 'N/A'}</td></tr>
                </table>
                
                <h6>网络信息</h6>
                <table class="table table-sm">
                    <tr><td><strong>ASN:</strong></td><td>${result.asn || 'N/A'}</td></tr>
                    <tr><td><strong>组织/ISP:</strong></td><td>${result.org || 'N/A'}</td></tr>
                    <tr><td><strong>DNS反向解析:</strong></td><td>${result.dns_ptr || 'N/A'}</td></tr>
                </table>
            </div>
        </div>
        <div class="row mt-3">
            <div class="col-12">
                <small class="text-muted">分析时间: ${result.timestamp || 'N/A'}</small>
            </div>
        </div>
    `;
    
    modal.show();
}

// 停止分析
function stopAnalysis() {
    if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
    }
    
    currentTaskId = null;
    hideProgressSection();
    
    alert('分析已停止');
}

// 下载结果
function downloadResults() {
    if (!currentTaskId) {
        alert('没有可下载的结果');
        return;
    }
    
    window.open(`/download/${currentTaskId}`, '_blank');
}

// 导出JSON
function exportJSON() {
    if (analysisResults.length === 0) {
        alert('没有可导出的结果');
        return;
    }
    
    const dataStr = JSON.stringify(analysisResults, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `ip_analysis_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
}



// 表格排序功能
let currentSortField = null;
let currentSortDirection = 'asc';

// 初始化排序功能
function initializeSorting() {
    const sortableHeaders = document.querySelectorAll('.sortable');
    sortableHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const sortField = this.getAttribute('data-sort');
            sortTable(sortField);
        });
        
        // 添加排序提示
        header.setAttribute('title', '点击排序');
    });
}

// 排序表格
function sortTable(field) {
    if (analysisResults.length === 0) return;
    
    // 确定排序方向
    if (currentSortField === field) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortDirection = 'asc';
        currentSortField = field;
    }
    
    // 更新表头样式
    updateSortHeaders(field, currentSortDirection);
    
    // 排序数据
    const sortedResults = [...analysisResults].sort((a, b) => {
        return compareValues(a[field], b[field], currentSortDirection);
    });
    
    // 更新表格显示
    updateResultsTableWithSortedData(sortedResults);
}

// 比较函数
function compareValues(a, b, direction) {
    // 处理空值
    if (a === null || a === undefined || a === 'N/A') a = '';
    if (b === null || b === undefined || b === 'N/A') b = '';
    
    // 数字类型处理
    if (typeof a === 'string' && a.includes('%')) {
        a = parseFloat(a.replace('%', '')) || 0;
        b = parseFloat(b.replace('%', '')) || 0;
    } else if (!isNaN(a) && !isNaN(b)) {
        a = parseFloat(a) || 0;
        b = parseFloat(b) || 0;
    } else {
        // 字符串比较
        a = String(a).toLowerCase();
        b = String(b).toLowerCase();
    }
    
    let result = 0;
    if (a < b) result = -1;
    else if (a > b) result = 1;
    
    return direction === 'desc' ? -result : result;
}

// 更新排序表头样式
function updateSortHeaders(activeField, direction) {
    const headers = document.querySelectorAll('.sortable');
    headers.forEach(header => {
        const field = header.getAttribute('data-sort');
        header.classList.remove('sort-asc', 'sort-desc');
        
        if (field === activeField) {
            header.classList.add(`sort-${direction}`);
        }
    });
}

// 使用排序后的数据更新表格
function updateResultsTableWithSortedData(sortedResults) {
    const tbody = document.getElementById('resultsTableBody');
    tbody.innerHTML = '';
    
    sortedResults.forEach((result, index) => {
        const row = document.createElement('tr');
        
        // 风险等级颜色
        const riskClass = getRiskClass(result.risk_level);
        
        row.innerHTML = `
            <td class="ip-cell">${result.ip}</td>
            <td><span class="badge ${riskClass}">${result.risk_level || '未知'}</span></td>
            <td>${result.abuse_confidence || 'N/A'}</td>
            <td>${result.total_reports || 'N/A'}</td>
            <td>${result.country || 'N/A'}</td>
            <td>${result.city || 'N/A'}</td>
            <td class="text-truncate" style="max-width: 200px;" title="${result.org || 'N/A'}">${result.org || 'N/A'}</td>
            <td class="text-truncate" style="max-width: 150px;" title="${result.dns_ptr || 'N/A'}">${result.dns_ptr || 'N/A'}</td>
            <td>
                <button class="btn btn-sm btn-outline-info" onclick="showDetails(${analysisResults.indexOf(result)})">
                    <i class="fas fa-info-circle"></i> 详情
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// 重置排序状态
function resetSorting() {
    currentSortField = null;
    currentSortDirection = 'asc';
    
    const headers = document.querySelectorAll('.sortable');
    headers.forEach(header => {
        header.classList.remove('sort-asc', 'sort-desc');
    });
}

// 修改原有的showResults函数，添加排序初始化
function showResults() {
    document.getElementById('resultsSection').style.display = 'block';
    
    // 更新统计摘要
    updateSummaryStats();
    
    // 更新结果表格
    updateResultsTable();
    
    // 初始化排序功能
    initializeSorting();
    
    // 重置排序状态
    resetSorting();
}

// 添加快速排序按钮功能
function quickSortByRisk() {
    if (analysisResults.length === 0) return;
    sortTable('abuse_confidence');
    if (currentSortDirection === 'asc') {
        sortTable('abuse_confidence'); // 再次点击变为降序
    }
}

function quickSortByReports() {
    if (analysisResults.length === 0) return;
    sortTable('total_reports');
    if (currentSortDirection === 'asc') {
        sortTable('total_reports'); // 再次点击变为降序
    }
}

function quickSortByCountry() {
    if (analysisResults.length === 0) return;
    sortTable('country');
}

