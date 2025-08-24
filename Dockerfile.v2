
FROM python:3.11-slim

# 设置构建参数
ARG TARGETPLATFORM
ARG BUILDPLATFORM
ARG TARGETOS
ARG TARGETARCH

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=app.py
ENV FLASK_ENV=production

# 显示构建信息
RUN echo "Building for $TARGETPLATFORM on $BUILDPLATFORM"

# 根据架构安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && if [ "$TARGETARCH" = "arm" ] || [ "$TARGETARCH" = "arm64" ]; then \
        apt-get install -y g++; \
    fi \
    && rm -rf /var/lib/apt/lists/*

# 复制requirements文件
COPY requirements.txt .

# 安装Python依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 创建非root用户
RUN useradd --create-home --shell /bin/bash app \
    && chown -R app:app /app
USER app

# 暴露端口
EXPOSE 5000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/ || exit 1

# 启动命令
CMD ["python", "app.py"]

