# IP分析工具 - 部署指南

## 项目结构
```
ip-analyzer-app/
├── app.py                 # Flask主应用
├── requirements.txt       # Python依赖
├── Dockerfile            # Docker镜像构建文件
├── docker-compose.yml    # Docker Compose配置
├── deploy.sh             # 一键部署脚本
├── test_docker.sh        # Docker测试脚本
├── .env.example          # 环境变量模板
├── .gitignore           # Git忽略文件
├── .dockerignore        # Docker忽略文件
├── README.md            # 项目说明
├── DEPLOYMENT.md        # 部署指南
├── templates/           # HTML模板
│   └── index.html
└── static/             # 静态资源
    ├── css/
    │   └── style.css
    └── js/
        └── app.js
```

## 部署选项

### 1. 开发环境部署
适用于本地开发和测试：
```bash
python app.py
```

### 2. Docker单容器部署
适用于简单的生产环境：
```bash
docker build -t ip-analyzer .
docker run -d -p 5000:5000 \
  -e ABUSEIPDB_API_KEY="your_key" \
  --name ip-analyzer \
  ip-analyzer
```

### 3. Docker Compose部署 (推荐)
适用于生产环境，支持配置管理：
```bash
cp .env.example .env
# 编辑 .env 文件设置API密钥
docker-compose up -d
```

### 4. OpenWrt路由器部署
适用于内网部署，提供局域网IP分析服务：

#### 前置要求
- OpenWrt 19.07+ 
- 至少512MB RAM
- 至少1GB存储空间

#### 安装步骤
```bash
# 1. 更新软件包
opkg update

# 2. 安装Docker
opkg install docker docker-compose

# 3. 启动Docker服务
/etc/init.d/docker start
/etc/init.d/docker enable

# 4. 部署应用
./deploy.sh
```

## 配置说明

### 环境变量
- `ABUSEIPDB_API_KEY`: AbuseIPDB API密钥 (必需)
- `FLASK_ENV`: Flask环境 (production/development)
- `APP_HOST`: 绑定主机 (默认: 0.0.0.0)
- `APP_PORT`: 绑定端口 (默认: 5000)

### 端口配置
- 默认端口: 5000
- 可通过docker-compose.yml修改端口映射
- OpenWrt防火墙需要开放对应端口

### 数据持久化
- 日志文件: `./logs/`
- 配置文件: `./config/`
- 可通过volumes挂载到宿主机

## 性能优化

### 资源需求
- 最小内存: 256MB
- 推荐内存: 512MB+
- CPU: 单核即可
- 存储: 100MB+

### 优化建议
1. 使用nginx反向代理
2. 启用gzip压缩
3. 配置适当的缓存策略
4. 监控API使用量

## 故障排除

### 常见问题
1. **容器启动失败**
   ```bash
   docker-compose logs
   ```

2. **API密钥无效**
   - 检查.env文件中的API密钥
   - 验证AbuseIPDB账户状态

3. **端口冲突**
   - 修改docker-compose.yml中的端口映射
   - 检查防火墙设置

4. **内存不足**
   - 增加swap空间
   - 优化Docker镜像

### 日志查看
```bash
# 查看应用日志
docker-compose logs -f

# 查看系统资源
docker stats

# 查看容器状态
docker-compose ps
```

## 安全建议

1. **API密钥保护**
   - 不要将API密钥提交到版本控制
   - 使用环境变量管理敏感信息

2. **网络安全**
   - 配置防火墙规则
   - 使用HTTPS (建议配置nginx)
   - 限制访问IP范围

3. **容器安全**
   - 定期更新基础镜像
   - 使用非root用户运行
   - 启用容器安全扫描

## 监控和维护

### 健康检查
- 内置健康检查端点: `/`
- Docker健康检查自动配置
- 可集成外部监控系统

### 备份策略
- 配置文件备份
- 日志文件轮转
- 定期更新镜像

### 更新流程
```bash
# 1. 拉取最新代码
git pull

# 2. 重新构建镜像
docker-compose build

# 3. 重启服务
docker-compose up -d
```

