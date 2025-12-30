#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║           SmartJFB 专业体育比分系统 - 一键启动             ║"
echo "║                  Professional Scoreboard                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo -e "${RED}[错误] 未检测到Node.js，请先安装Node.js${NC}"
    echo "下载地址: https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}[1/5]${NC} 检查依赖..."
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}[提示]${NC} 首次启动，正在安装依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}[错误]${NC} 依赖安装失败"
        exit 1
    fi
fi
echo -e "${GREEN}[完成]${NC} 依赖检查通过"

echo ""
echo -e "${GREEN}[2/5]${NC} 创建必要目录..."
mkdir -p exports layouts uploads/ads
echo -e "${GREEN}[完成]${NC} 目录创建完成"

echo ""
echo -e "${GREEN}[3/5]${NC} 检查端口占用..."
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}[警告]${NC} 端口3001已被占用，尝试关闭旧进程..."
    lsof -ti:3001 | xargs kill -9 2>/dev/null
    sleep 2
fi
echo -e "${GREEN}[完成]${NC} 端口检查完成"

echo ""
echo -e "${GREEN}[4/5]${NC} 启动服务器..."
node server/index.js
if [ $? -ne 0 ]; then
    echo ""
    echo -e "${RED}[错误]${NC} 服务器启动失败"
    echo "请检查错误信息或查看日志"
    exit 1
fi
