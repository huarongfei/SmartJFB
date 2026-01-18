@chcp 65001 >nul
@echo off
color 0A

echo.
echo ========================
echo    SmartJFB 应用启动器
echo ========================
echo.

echo 检测端口占用情况...

REM 检查端口3000占用情况
netstat -ano | findstr :3000 >nul
if %errorlevel% == 0 (
    echo 端口 3000 已被占用，正在终止占用进程...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
        taskkill /f /pid %%a >nul 2>&1
    )
    timeout /t 2 /nobreak >nul
) else (
    echo 端口 3000 空闲
)

REM 检查端口3002占用情况
netstat -ano | findstr :3002 >nul
if %errorlevel% == 0 (
    echo 端口 3002 已被占用，正在终止占用进程...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3002') do (
        taskkill /f /pid %%a >nul 2>&1
    )
    timeout /t 2 /nobreak >nul
) else (
    echo 端口 3002 空闲
)

echo.
echo 正在启动 SmartJFB 应用程序...
echo.

echo 启动后端服务器...
start "" /d "f:\SmartJFB\backend" cmd /k "chcp 65001 >nul && echo 后端服务启动中... && node server.js"

timeout /t 5 /nobreak >nul

echo.
echo 启动前端服务器...
start "" /d "f:\SmartJFB\frontend" cmd /k "chcp 65001 >nul && echo 前端服务启动中... && npx http-server -p 3002 -c-1"

echo.
echo ===========================================
echo SmartJFB 应用程序启动成功！
echo ===========================================
echo 后端 API 地址: http://localhost:3000
echo 前端 UI 地址: http://localhost:3002
echo 默认账号: admin
echo 默认密码: password123
echo ===========================================
echo.
echo 服务已在新窗口中启动
pause