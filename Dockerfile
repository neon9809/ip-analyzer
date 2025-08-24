# 单阶段构建版本 - 更简单可靠的方案
FROM python:3.11-alpine

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

# 安装系统依赖并在同一层清理
RUN apk add --no-cache \
    curl \
    gcc \
    musl-dev \
    linux-headers \
    && pip install --no-cache-dir --upgrade pip

# 复制requirements文件
COPY requirements.txt .

# 安装Python依赖并清理
RUN pip install --no-cache-dir -r requirements.txt \
    && apk del gcc musl-dev linux-headers

# 复制应用代码
COPY app.py .
COPY templates/ templates/
COPY static/ static/

# 创建必要目录
RUN mkdir -p logs config

# 创建非root用户
RUN adduser -D -s /bin/sh app && \
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
