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
