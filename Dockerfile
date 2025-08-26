# 替代方案：使用系统级安装的多阶段构建

# ==================== 第一阶段：构建阶段 ====================
FROM python:3.11-alpine AS builder

# 安装构建依赖
RUN apk add --no-cache --virtual .build-deps \
    gcc \
    musl-dev \
    linux-headers \
    libffi-dev \
    openssl-dev

# 复制requirements文件
COPY requirements.txt .

# 🔑 方案2关键点: 使用系统级安装而不是用户级
RUN pip install --no-cache-dir -r requirements.txt

# 验证安装
RUN python -c "import flask; print('✅ Builder stage Flask:', flask.__version__)"

# ==================== 第二阶段：运行阶段 ====================
FROM python:3.11-alpine

# 设置环境变量
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=app.py
ENV FLASK_ENV=production

# 安装运行时依赖
RUN apk add --no-cache curl

# 🔑 方案2关键点: 复制整个Python安装目录
COPY --from=builder /usr/local/lib/python3.11/site-packages/ /usr/local/lib/python3.11/site-packages/
COPY --from=builder /usr/local/bin/ /usr/local/bin/

# 设置工作目录
WORKDIR /app

# 验证复制结果
RUN python -c "import flask; print('✅ Runtime stage Flask:', flask.__version__)"

# 复制应用代码
COPY app.py .
COPY templates/ templates/
COPY static/ static/

# 创建必要目录和用户
RUN mkdir -p logs config && \
    adduser -D -s /bin/sh app && \
    chown -R app:app /app

# 切换到非root用户
USER app

# 最终验证
RUN python -c "import flask; print('✅ Final Flask verification:', flask.__version__)"

# 暴露端口
EXPOSE 5000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/ || exit 1

# 启动命令
CMD ["python", "app.py"]