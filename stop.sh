#!/bin/bash

# 体育比分工具 - 停止所有服务器 (Linux/Mac)
# Sports Score Tracker - Stop All Servers

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;91m'
NC='\033[0m' # No Color

echo ""
echo -e "${YELLOW}正在停止所有服务器...${NC}"
echo ""

# 停止端口3000的进程
PIDS=$(lsof -ti:3000 2>/dev/null || netstat -tlnp 2>/dev/null | grep :3000 | awk '{print $7}' | cut -d/ -f1)
if [ -n "$PIDS" ]; then
    echo -e "${YELLOW}停止端口 3000 的进程...${NC}"
    kill -9 $PIDS 2>/dev/null
    echo -e "${GREEN}端口 3000 已停止${NC}"
fi

# 停止端口3001的进程
PIDS=$(lsof -ti:3001 2>/dev/null || netstat -tlnp 2>/dev/null | grep :3001 | awk '{print $7}' | cut -d/ -f1)
if [ -n "$PIDS" ]; then
    echo -e "${YELLOW}停止端口 3001 的进程...${NC}"
    kill -9 $PIDS 2>/dev/null
    echo -e "${GREEN}端口 3001 已停止${NC}"
fi

echo ""
echo -e "${GREEN}所有服务器已停止${NC}"
echo ""
