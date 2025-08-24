#!/bin/bash

# Docker部署测试脚本

set -e

echo "🧪 开始测试Docker部署..."

# 检查Docker是否运行
if ! docker info &> /dev/null; then
    echo "❌ Docker未运行，请启动Docker服务"
    exit 1
fi

# 构建镜像
echo "🔨 构建Docker镜像..."
docker build -t ip-analyzer:test .

# 运行容器测试
echo "🚀 启动测试容器..."
docker run -d --name ip-analyzer-test -p 5001:5000 \
    -e ABUSEIPDB_API_KEY="test_key" \
    ip-analyzer:test

# 等待容器启动
echo "⏳ 等待容器启动..."
sleep 5

# 测试健康检查
echo "🔍 测试应用响应..."
if curl -f http://localhost:5001/ &> /dev/null; then
    echo "✅ 应用响应正常"
else
    echo "❌ 应用响应异常"
    docker logs ip-analyzer-test
fi

# 清理测试容器
echo "🧹 清理测试环境..."
docker stop ip-analyzer-test
docker rm ip-analyzer-test
docker rmi ip-analyzer:test

echo "✅ Docker测试完成"

