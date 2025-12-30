@echo off
chcp 65001 >nul
title SmartJFB 停止服务
color 0C

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║              SmartJFB 专业体育比分系统 - 停止服务              ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo [1/2] 查找正在运行的Node.js进程...
for /f "tokens=2" %%a in ('tasklist /FI "IMAGENAME eq node.exe" /FO csv ^| findstr /C:"node.exe"') do (
    set PID=%%~a
    echo [信息] 找到进程 PID: !PID!
    taskkill /F /PID !PID! >nul 2>&1
    if %errorlevel% equ 0 (
        echo [成功] 已终止进程 !PID!
    )
)

echo.
echo [2/2] 检查端口3001占用...
netstat -ano | findstr ":3001" >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001" ^| findstr "LISTENING"') do (
        echo [信息] 强制关闭端口3001占用 PID: %%a
        taskkill /F /PID %%a >nul 2>&1
    )
)

echo.
echo [完成] 所有服务已停止
pause
