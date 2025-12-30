@echo off
chcp 65001 >nul

:: 体育比分工具 - 启动脚本 (双端口版本)
:: Sports Score Tracker - Startup Script (Dual Port)

set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "RED=[91m"
set "NC=[0m"

echo.
echo %BLUE%================================================%NC%
echo %BLUE%体育比分工具 - SmartJFB (双端口版本)%NC%
echo %BLUE%Sports Score Tracker - Dual Port Version%NC%
echo %BLUE%================================================%NC%
echo.

:: 检查Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo %RED%错误: 未找到Node.js%NC%
    echo %YELLOW%请先安装Node.js: https://nodejs.org/%NC%
    pause
    exit /b 1
)

:: 检查依赖
if not exist "node_modules" (
    echo %YELLOW%首次运行，正在安装依赖...%NC%
    call npm install
    if errorlevel 1 (
        echo %RED%依赖安装失败%NC%
        pause
        exit /b 1
    )
    echo %GREEN%依赖安装完成%NC%
)

echo.
echo %GREEN%正在启动服务器...%NC%
echo.
echo %BLUE%================================================%NC%
echo %BLUE%访问地址:%NC%
echo %BLUE%================================================%NC%
echo.
echo %GREEN%后台管理界面 (端口 3000):%NC%
echo   http://localhost:3000/backend.html
echo.
echo %GREEN%前台展示界面 (独立文件):%NC%
echo   file:///%cd%/display.html
echo.
echo %BLUE%================================================%NC%
echo %YELLOW%说明:%NC%
echo   - 后台管理: 用于输入数据、管理比赛
echo   - 前台展示: 用于大屏展示比分
echo   - 后台运行在端口 3000
echo   - 前台直接打开 HTML 文件即可
echo %BLUE%================================================%NC%
echo.
echo %YELLOW%按 Ctrl+C 停止服务器%NC%
echo.

:: 启动后端服务器
node backend-server.js

pause
