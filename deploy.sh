#!/bin/bash

# IP分析工具Docker部署脚本
# 适用于OpenWrt等Linux环境

set -e

echo "🚀 开始部署IP分析工具..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    exit 1
fi

# 检查docker-compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "⚠️  docker-compose未安装，尝试使用docker compose..."
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

# 创建必要的目录
mkdir -p logs config

# 检查环境变量文件
if [ ! -f .env ]; then
    echo "📝 创建环境变量文件..."
    cp .env.example .env
    echo "⚠️  请编辑 .env 文件，设置您的AbuseIPDB API密钥"
    echo "   编辑命令: nano .env"
    read -p "按回车键继续..."
fi

# 构建并启动服务
echo "🔨 构建Docker镜像..."
$COMPOSE_CMD build

echo "🚀 启动服务..."
$COMPOSE_CMD up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
if $COMPOSE_CMD ps | grep -q "Up"; then
    echo "✅ 服务启动成功！"
    echo ""
    echo "🌐 访问地址:"
    echo "   本地: http://localhost:5000"
    echo "   局域网: http://$(hostname -I | awk '{print $1}'):5000"
    echo ""
    echo "📊 查看日志: $COMPOSE_CMD logs -f"
    echo "🛑 停止服务: $COMPOSE_CMD down"
    echo "🔄 重启服务: $COMPOSE_CMD restart"
else
    echo "❌ 服务启动失败，请检查日志:"
    $COMPOSE_CMD logs
    exit 1
fi

