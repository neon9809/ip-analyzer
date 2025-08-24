

FROM python:3.11-slim


ARG TARGETPLATFORM
ARG BUILDPLATFORM
ARG TARGETOS
ARG TARGETARCH
ARG BUILDTIME
ARG VERSION

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_APP=app.py \
    FLASK_ENV=production \
    TZ=UTC

# 添加标签信息
LABEL org.opencontainers.image.title="IP Analyzer" \
      org.opencontainers.image.description="Multi-architecture IP security analysis tool" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.created="${BUILDTIME}" \
      org.opencontainers.image.source="https://github.com/neon9809/ip-analyzer"

# 显示构建信息
RUN echo "🏗️  Building IP Analyzer..." && \
    echo "   Target Platform: ${TARGETPLATFORM:-unknown}" && \
    echo "   Build Platform: ${BUILDPLATFORM:-unknown}" && \
    echo "   Target OS: ${TARGETOS:-unknown}" && \
    echo "   Target Arch: ${TARGETARCH:-unknown}" && \
    echo "   Version: ${VERSION:-dev}" && \
    echo "   Build Time: ${BUILDTIME:-unknown}"

# 根据目标架构安装系统依赖
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        gcc \
        curl \
        ca-certificates && \
    # ARM架构需要额外的编译工具
    if [ "${TARGETARCH}" = "arm64" ] || [ "${TARGETARCH}" = "arm" ]; then \
        echo "🔧 Installing ARM-specific build tools..." && \
        apt-get install -y --no-install-recommends g++; \
    fi && \
    # 清理APT缓存
    rm -rf /var/lib/apt/lists/* && \
    apt-get clean

# 复制requirements文件
COPY requirements.txt .

# 根据架构优化Python包安装
RUN echo "📦 Installing Python packages for ${TARGETARCH:-unknown} architecture..." && \
    if [ "${TARGETARCH}" = "arm64" ] || [ "${TARGETARCH}" = "arm" ]; then \
        echo "   Using ARM-optimized installation..." && \
        pip install --no-cache-dir --prefer-binary --timeout 300 -r requirements.txt; \
    else \
        echo "   Using standard installation..." && \
        pip install --no-cache-dir --timeout 300 -r requirements.txt; \
    fi && \
    # 验证关键包安装
    python -c "import flask, requests, pandas; print('✅ Key packages installed successfully')" && \
    # 清理pip缓存
    pip cache purge

# 复制应用代码
COPY . .

# 创建非root用户并设置权限
RUN groupadd -r app && \
    useradd -r -g app -d /app -s /bin/bash app && \
    chown -R app:app /app && \
    chmod +x /app/*.py

# 切换到非root用户
USER app

# 暴露端口
EXPOSE 5000

# 健康检查 - 确保应用正常运行
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5000/ || exit 1

# 启动命令
CMD ["python", "app.py"]

