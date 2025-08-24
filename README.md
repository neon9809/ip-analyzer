# IP地址安全分析工具

一个简答的Web应用，用于批量分析IP地址的安全威胁情况，集成了AbuseIPDB API获取真实的恶意IP报告。

## 功能特性

### 🔍 全面的IP分析
- **IPv4和IPv6支持**: 完全支持IPv4和IPv6地址分析
- **地理位置信息**: 获取IP的国家、地区、城市、时区等信息
- **网络信息**: ASN、ISP、组织信息
- **DNS反向解析**: 获取PTR记录

### 🛡️ 安全威胁检测
- **AbuseIPDB集成**: 获取真实的恶意IP报告
- **恶意置信度**: 显示IP的恶意置信度百分比
- **举报统计**: 显示IP被举报的次数和最后举报时间
- **风险等级评估**: 自动计算并显示风险等级（高/中/低/正常）

### 📊 智能格式解析
- **多种分隔符支持**: 自动识别空格、逗号、分号、换行等分隔符
- **混合格式处理**: 支持IPv4和IPv6地址混合输入
- **自动去重**: 自动去除重复的IP地址
- **格式验证**: 实时验证IP地址格式的有效性

### 🚀 用户友好界面
- **实时进度监控**: 显示分析进度和当前处理的IP
- **响应式设计**: 支持桌面和移动设备
- **批量操作**: 支持一次分析多个IP地址
- **多种导出格式**: 支持CSV和JSON格式导出

## 技术架构

### 后端技术栈
- **Flask**: Python Web框架
- **AbuseIPDB API**: 恶意IP检测服务
- **IPinfo API**: IP地理位置信息服务
- **多线程处理**: 后台异步分析任务

### 前端技术栈
- **Bootstrap 5**: 响应式UI框架
- **JavaScript ES6**: 现代JavaScript特性
- **Font Awesome**: 图标库
- **实时更新**: AJAX轮询获取分析状态

## API限制说明

### AbuseIPDB免费账户限制
- **IP查询**: 1,000次/天
- **报告查询**: 100次/天
- **其他功能**: 5-100次/天

应用会自动监控API使用量并提供相应提醒。

## 安装和部署

### 环境要求
- Python 3.7+ (本地部署)
- Docker or Docker Compose (容器部署)
- AbuseIPDB API密钥

### 方法一：Docker部署 (推荐)

#### 快速部署
```bash
# 1. 克隆项目
git clone https://github.com/neon9809/ip-analyzer
cd ip-analyzer-app

# 2. 配置API密钥
cp .env.example .env
nano .env  # 编辑并设置ABUSEIPDB_API_KEY

# 3. 一键部署
./deploy.sh
```

#### 手动部署
```bash
# 1. 构建镜像
docker-compose build

# 2. 启动服务
docker-compose up -d

# 3. 查看状态
docker-compose ps
```

**支持的设备架构:**
- ✅ ARM64 (树莓派4、香橙派等)
- ✅ x86_64 (软路由、PC等)

#### docker run

Docker:
```bash
docker run -d \
--name ip-analyzer \
        -p 8888:5000 \
        -e FLASK_ENV=production \
        -v /path/to/file/config:/app/config:ro \
        -v /path/to/file/logs:/app/logs \
        ghcr.io/neon9809/ip-analyzer:latest
```

Apple Container:
```bash
container run -d \
--name ip-analyzer \
        -p 8888:5000 \
        -e FLASK_ENV=production \
        -v /path/to/file/config:/app/config:ro \
        -v /path/to/file/logs:/app/logs \
        ghcr.io/neon9809/ip-analyzer:latest
```



### 方法二：本地部署
```bash
# 1. 安装依赖
pip install -r requirements.txt

# 2. 设置环境变量
export ABUSEIPDB_API_KEY="your_api_key"

# 3. 运行应用
python app.py
```

### 访问应用
- 本地访问：http://localhost:5000
- 局域网访问：http://your-ip:5000

### Docker管理命令
```bash
# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 更新应用
git pull
docker-compose build
docker-compose up -d
```

## 使用指南

### 1. 配置API密钥
在界面上输入您的AbuseIPDB API密钥，系统会自动保存到本地存储。

### 2. 输入IP地址
支持多种输入格式：
```
# 单行单个IP
192.168.1.1

# 逗号分隔
8.8.8.8, 8.8.4.4, 1.1.1.1

# 空格分隔
192.168.1.1 10.0.0.1 172.16.0.1

# 分号分隔
192.168.1.1; 10.0.0.1; 172.16.0.1

# 换行分隔
192.168.1.1
10.0.0.1
172.16.0.1

# IPv6地址
2001:4860:4860::8888
::1
2001:db8::1

# 混合格式
192.168.1.1, 2001:db8::1
8.8.8.8 2001:4860:4860::8888
```

### 3. 开始分析
点击"开始分析"按钮，系统会：
- 解析和验证所有IP地址
- 显示实时分析进度
- 提供预计完成时间
- 支持中途停止分析

### 4. 查看结果
分析完成后会显示：
- 统计摘要（总数、高风险、中风险、正常）
- 详细结果表格
- 每个IP的详细信息
- 风险等级和安全评估

### 5. 导出数据
支持多种导出格式：
- **CSV格式**: 适合Excel等表格软件
- **JSON格式**: 适合程序化处理

## 风险等级说明

### 高风险 🔴
- 恶意置信度 ≥ 75%
- 已知恶意活动

### 中风险 🟡
- 恶意置信度 25-74%
- 可疑活动

### 低风险 🔵
- 恶意置信度 1-24%
- 轻微异常

### 正常 🟢
- 恶意置信度 0%
- 正常IP地址


## 故障排除

### 常见问题
1. **API密钥无效**: 请检查AbuseIPDB API密钥是否正确
2. **分析失败**: 可能是网络连接问题或API限制
3. **IP格式错误**: 请确保IP地址格式正确

### 技术支持
如遇到技术问题，请检查：
- 网络连接状态
- API密钥有效性
- 浏览器控制台错误信息



## 许可证

本项目采用MIT许可证，详见LICENSE文件。

## 贡献

欢迎提交Issue和Pull Request来改进这个项目。

## 致谢

本项目代码主要由Manus AI根据多轮指令生成，由Perplexity AI (Labs)根据多轮指令精简镜像依赖并设计多阶段构建指令（258MB > 74.8MB）。

---

**注意**: 本工具仅用于网络安全分析和研究目的，请遵守相关法律法规和API服务条款。

