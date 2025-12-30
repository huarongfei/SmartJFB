@echo off
chcp 65001 >nul
title SmartJFB 专业体育比分系统
color 0A

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║           SmartJFB 专业体育比分系统 - 一键启动             ║
echo ║                  Professional Scoreboard                    ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

:: 检查Node.js是否安装
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到Node.js，请先安装Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

echo [1/5] 检查依赖...
if not exist "node_modules\" (
    echo [提示] 首次启动，正在安装依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
)
echo [完成] 依赖检查通过

echo.
echo [2/5] 创建必要目录...
if not exist "exports\" mkdir exports
if not exist "layouts\" mkdir layouts
if not exist "uploads\ads" mkdir uploads\ads
echo [完成] 目录创建完成

echo.
echo [3/5] 检查端口占用...
netstat -ano | findstr ":3001" >nul 2>&1
if %errorlevel% equ 0 (
    echo [警告] 端口3001已被占用，尝试关闭旧进程...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001" ^| findstr "LISTENING"') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    timeout /t 2 /nobreak >nul
)
echo [完成] 端口检查完成

echo.
echo [4/5] 启动服务器...
node server/index.js
if %errorlevel% neq 0 (
    echo.
    echo [错误] 服务器启动失败
    echo 请检查错误信息或查看日志
    pause
    exit /b 1
)

pause
