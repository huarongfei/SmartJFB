@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo 专业体育比分系统 - Professional Sports Scoreboard System
echo ========================================
echo.

:: 检查依赖
if not exist "node_modules\express" (
    echo [INFO] 正在安装依赖...
    call npm install
    if errorlevel 1 (
        echo [ERROR] 依赖安装失败，请检查网络连接或运行: npm install
        pause
        exit /b 1
    )
    echo [SUCCESS] 依赖安装完成
    echo.
)

:: 检查端口占用
echo [INFO] 检查端口占用情况...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    set PID=%%a
)
if defined PID (
    echo [INFO] 端口 3001 被占用，尝试释放...
    taskkill /F /PID !PID! >nul 2>&1
    if errorlevel 1 (
        echo [WARNING] 无法释放端口 3001，请手动检查
    ) else (
        echo [SUCCESS] 端口 3001 已释放
    )
)
echo.

:: 创建导出目录
if not exist "exports" mkdir exports

echo [INFO] 启动服务器...
echo [INFO] 访问地址: http://localhost:3001
echo [INFO] 按 Ctrl+C 停止服务器
echo.

node server/index.js

pause
