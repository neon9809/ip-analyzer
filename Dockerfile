# 多阶段构建优化的Dockerfile
# 第一阶段：构建阶段
FROM python:3.11-alpine AS builder

# 设置构建参数
ARG TARGETPLATFORM
ARG BUILDPLATFORM  
ARG TARGETOS
ARG TARGETARCH

# 设置工作目录
WORKDIR /build

# 显示构建信息
RUN echo "Building for $TARGETPLATFORM on $BUILDPLATFORM"

# 安装构建依赖（在一层中安装和清理）
RUN apk add --no-cache --virtual .build-deps \
    gcc \
    musl-dev \
    linux-headers \
    && apk add --no-cache curl

# 复制requirements文件
COPY requirements.txt .

# 安装Python依赖到用户目录
RUN pip install --user --no-cache-dir --no-warn-script-location \
    -r requirements.txt

# 清理构建依赖
RUN apk del .build-deps

# 第二阶段：运行阶段
FROM python:3.11-alpine

# 设置环境变量
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=app.py
ENV FLASK_ENV=production
ENV PATH=/root/.local/bin:$PATH

# 安装运行时依赖
RUN apk add --no-cache curl

# 创建非root用户
RUN adduser -D -s /bin/sh app

# 设置工作目录
WORKDIR /app

# 从构建阶段复制Python包
COPY --from=builder /root/.local /root/.local

# 复制应用代码（只复制必要文件）
COPY app.py .
COPY templates/ templates/
COPY static/ static/

# 创建必要目录并设置权限
RUN mkdir -p logs config && \
    chown -R app:app /app

# 切换到非root用户
USER app

# 暴露端口
EXPOSE 5000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/ || exit 1

# 启动命令
CMD ["python", "app.py"]