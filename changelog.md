## 主要改动说明：

### 1. 新增UI元素
- 在IP地址输入区域添加了IP过滤选项框
- 包含"跳过保留地址"复选框，默认选中
- 添加了详细的说明文字

### 2. 新增保留地址检测功能
- `isPrivateIP(ip)`: 检测IP是否为保留地址
- `getPrivateIPType(ip)`: 获取保留地址的具体类型

### 3. 支持的保留地址类型
**IPv4：**
- RFC1918私有地址：10.0.0.0/8, 192.168.0.0/16, 172.16.0.0/12
- 回环地址：127.0.0.0/8
- 链路本地地址：169.254.0.0/16
- 组播地址：224.0.0.0/4
- 特殊用途地址：0.0.0.0/8
- 广播地址：255.0.0.0/8

**IPv6：**
- 回环地址：::1
- 未指定地址：::
- 链路本地地址：fe80::/10
- 唯一本地地址：fc00::/7, fd00::/8
- 组播地址：ff00::/8
- IPv4映射地址：::ffff:0:0/96
- 文档地址：2001:db8::/32
- 6to4地址：2002::/16

### 4. 修改的功能
- `countIPs()`: 现在会统计并显示被过滤的保留地址数量
- `loadSampleIPs()`: 新增了一些保留地址作为演示
- `startAnalysis()`: 在分析前会根据选项过滤保留地址

### 5. 用户体验改进
- 显示过滤的保留地址统计信息
- 支持查看被过滤地址的详细类型分布
- 在开始分析前会确认过滤的地址数量

#### 本次更新的代码主要由[Claude AI](https://claude.ai) (Sonnet 4)完成。


**支持的设备架构:**
- ✅ ARM64
- ✅ x86_64

#### Docker

Docker run:
```bash
docker run -d \
--name ip-analyzer \
        -p 8888:5000 \
        -e FLASK_ENV=production \
        -v /path/to/file/config:/app/config:ro \
        -v /path/to/file/logs:/app/logs \
        ghcr.io/neon9809/ip-analyzer:latest
```

Docker compose
```bash
version: '3.8'

services:
  ip-analyzer:
    container_name: ip-analyzer
    image: ghcr.io/neon9809/ip-analyzer:latest
    ports:
      - "8008:5000"
    environment:
      - FLASK_ENV=production
    volumes:
      # 可选：挂载配置文件
      - ./config:/app/config:ro
      # 可选：挂载日志目录
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```
