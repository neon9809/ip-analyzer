// IP地址安全分析工具 JavaScript

let currentTaskId = null;
let analysisResults = [];
let statusCheckInterval = null;
let selectedIPs = new Set(); // 用于存储选中的IP地址

// 全局变量：API验证状态
let isApiKeyValid = false;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 从localStorage恢复API密钥
    const savedApiKey = localStorage.getItem('abuseipdb_api_key');
    if (savedApiKey) {
        document.getElementById('apiKey').value = savedApiKey;
        // 不自动设置为已配置，需要重新验证
        updateApiStatus('需要重新验证', 'warning');
    }

    // API密钥输入事件 - 移除自动保存逻辑
    document.getElementById('apiKey').addEventListener('input', function() {
        // 输入变化时重置验证状态
        isApiKeyValid = false;
        updateApiStatus('未验证', 'secondary');
        hideQuotaInfo();
        updateAnalyzeButtonState();
    });

    // IP输入框事件
    document.getElementById('ipInput').addEventListener('input', countIPs);

    // 初始化分析按钮状态
    updateAnalyzeButtonState();
});

// API密钥验证功能
async function validateApiKey() {
    const apiKey = document.getElementById('apiKey').value.trim();
    const validateBtn = document.getElementById('validateApiBtn');

    if (!apiKey) {
        updateApiStatus('请输入API密钥', 'danger');
        return;
    }

    // 显示验证中状态
    validateBtn.disabled = true;
    validateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 验证中...';
    updateApiStatus('验证中...', 'info');

    try {
        const response = await fetch('/validate_api', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                api_key: apiKey
            })
        });

        const result = await response.json();

        if (result.valid) {
            // 验证成功
            isApiKeyValid = true;
            localStorage.setItem('abuseipdb_api_key', apiKey);
            updateApiStatus('✅ API密钥验证成功', 'success');

            // 显示配额信息
            if (result.quota_info) {
                showQuotaInfo(result.quota_info);
            }

            updateAnalyzeButtonState();

        } else {
            // 验证失败
            isApiKeyValid = false;
            localStorage.removeItem('abuseipdb_api_key');
            updateApiStatus('❌ ' + (result.error || 'API密钥验证失败'), 'danger');
            hideQuotaInfo();
            updateAnalyzeButtonState();
        }

    } catch (error) {
        isApiKeyValid = false;
        updateApiStatus('❌ 验证请求失败: ' + error.message, 'danger');
        hideQuotaInfo();
        updateAnalyzeButtonState();
    } finally {
        // 恢复按钮状态
        validateBtn.disabled = false;
        validateBtn.innerHTML = '<i class="fas fa-check-circle"></i> 验证';
    }
}

// 显示API配额信息
function showQuotaInfo(quotaInfo) {
    const quotaElement = document.getElementById('apiQuotaInfo');
    const quotaDetails = document.getElementById('quotaDetails');

    if (quotaInfo.remaining && quotaInfo.limit) {
        quotaDetails.textContent = `剩余 ${quotaInfo.remaining}/${quotaInfo.limit} 次查询`;
        quotaElement.style.display = 'block';
    }
}

// 隐藏API配额信息
function hideQuotaInfo() {
    document.getElementById('apiQuotaInfo').style.display = 'none';
}

// 更新分析按钮状态
function updateAnalyzeButtonState() {
    const analyzeBtn = document.getElementById('analyzeBtn');

    if (analyzeBtn) {
        if (isApiKeyValid) {
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = '<i class="fas fa-search"></i> 开始分析';
            analyzeBtn.className = 'btn btn-primary';
        } else {
            analyzeBtn.disabled = true;
            analyzeBtn.innerHTML = '<i class="fas fa-lock"></i> 请先验证API密钥';
            analyzeBtn.className = 'btn btn-secondary';
        }
    }
}

// 更新API状态显示
function updateApiStatus(text, type) {
    const statusElement = document.getElementById('apiStatus');
    statusElement.className = `alert alert-${type}`;
    statusElement.innerHTML = `<i class="fas fa-info-circle"></i> ${text}`;
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
        countElement.innerHTML = `${ipList.length}个IP地址 <br>⚠️ 超过每日API限制(1000次)`;
    } else if (ipList.length > 800) {
        countContainer.className = 'mt-3 alert alert-warning';
        countElement.innerHTML = `${ipList.length}个IP地址 <br>⚠️ 接近每日API限制`;
    } else {
        countContainer.className = 'mt-3 alert alert-info';
    }
}

// 解析IP地址
function parseIPs(ipText) {
    const ipList = [];

    // 预处理：统一分隔符，支持多种格式
    let processedText = ipText
        .replace(/[,;|]/g, ' ') // 将逗号、分号、竖线替换为空格
        .replace(/\s+/g, ' ') // 多个空格合并为一个
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

// 开始分析 - 修改版本
async function startAnalysis() {
    const ipText = document.getElementById('ipInput').value.trim();
    const apiKey = document.getElementById('apiKey').value.trim();

    if (!ipText) {
        alert('请输入IP地址');
        return;
    }

    if (!isApiKeyValid) {
        alert('请先验证API密钥');
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

        // 清空选中的IP
        selectedIPs.clear();

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

    // 初始化排序功能
    initializeSorting();

    // 重置排序状态
    resetSorting();

    // 更新选择状态显示
    updateSelectionStatus();
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
            <td>
                <div class="form-check">
                    <input class="form-check-input ip-checkbox" type="checkbox" 
                           value="${result.ip}" id="ip_${index}" 
                           onchange="handleIPSelection('${result.ip}', this.checked)">
                    <label class="form-check-label" for="ip_${index}">
                        ${result.ip}
                    </label>
                </div>
            </td>
            <td><span class="badge ${riskClass}">${result.risk_level || '未知'}</span></td>
            <td>${result.abuse_confidence || 'N/A'}</td>
            <td>${result.total_reports || 'N/A'}</td>
            <td>${result.country || 'N/A'}</td>
            <td>${result.city || 'N/A'}</td>
            <td>${result.org || 'N/A'}</td>
            <td>${result.dns_ptr || 'N/A'}</td>
            <td><button class="btn btn-sm btn-outline-info" onclick="showDetails(${index})"><i class="fas fa-info-circle"></i></button></td>
        `;

        tbody.appendChild(row);
    });
}

// 处理IP选择
function handleIPSelection(ip, isSelected) {
    if (isSelected) {
        selectedIPs.add(ip);
    } else {
        selectedIPs.delete(ip);
    }
    updateSelectionStatus();
}

// 全选/取消全选功能
function toggleSelectAll() {
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const ipCheckboxes = document.querySelectorAll('.ip-checkbox');
    const isSelectAll = selectAllCheckbox.checked;

    selectedIPs.clear();

    ipCheckboxes.forEach(checkbox => {
        checkbox.checked = isSelectAll;
        if (isSelectAll) {
            selectedIPs.add(checkbox.value);
        }
    });

    updateSelectionStatus();
}

// 更新选择状态显示
function updateSelectionStatus() {
    const selectedCount = selectedIPs.size;
    const selectionStatus = document.getElementById('selectionStatus');
    const copySelectedBtn = document.getElementById('copySelectedBtn');

    if (selectedCount > 0) {
        selectionStatus.textContent = `已选择 ${selectedCount} 个IP地址`;
        selectionStatus.className = 'text-primary fw-bold';
        copySelectedBtn.disabled = false;
        copySelectedBtn.className = 'btn btn-primary';
        copySelectedBtn.innerHTML = `<i class="fas fa-copy"></i> 复制选中IP (${selectedCount})`;
    } else {
        selectionStatus.textContent = '未选择IP地址';
        selectionStatus.className = 'text-muted';
        copySelectedBtn.disabled = true;
        copySelectedBtn.className = 'btn btn-secondary';
        copySelectedBtn.innerHTML = '<i class="fas fa-copy"></i> 复制选中IP';
    }
}

// 复制选中的IP地址到剪贴板
async function copySelectedIPs() {
    if (selectedIPs.size === 0) {
        alert('请先选择要复制的IP地址');
        return;
    }

    const ipList = Array.from(selectedIPs).join('\n');
    
    try {
        await navigator.clipboard.writeText(ipList);
        
        // 显示成功提示
        const copyBtn = document.getElementById('copySelectedBtn');
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fas fa-check"></i> 已复制!';
        copyBtn.className = 'btn btn-success';
        
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
            copyBtn.className = 'btn btn-primary';
        }, 2000);
        
        // 可选：显示一个临时提示
        showCopyNotification(`已复制 ${selectedIPs.size} 个IP地址到剪贴板`);
        
    } catch (err) {
        console.error('复制失败:', err);
        
        // 降级方案：使用旧的复制方法
        try {
            const textArea = document.createElement('textarea');
            textArea.value = ipList;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            showCopyNotification(`已复制 ${selectedIPs.size} 个IP地址到剪贴板`);
        } catch (fallbackErr) {
            alert('复制失败，请手动复制以下内容：\n\n' + ipList);
        }
    }
}

// 显示复制成功通知
function showCopyNotification(message) {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = 'alert alert-success position-fixed';
    notification.style.cssText = `
        top: 20px;
        right: 20px;
        z-index: 1050;
        min-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i> ${message}
    `;
    
    document.body.appendChild(notification);
    
    // 3秒后自动移除
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
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
            <div class="col-12">
                <h6>基本信息</h6>
                <table class="table table-sm">
                    <tr><td><strong>IP地址:</strong></td><td>${result.ip}</td></tr>
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
        header.style.cursor = 'pointer';
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
        const icon = header.querySelector('i');

        if (field === activeField) {
            icon.className = direction === 'asc' ? 'fas fa-sort-up' : 'fas fa-