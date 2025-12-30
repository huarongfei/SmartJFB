@echo off
chcp 65001 >nul
title SmartJFB 快速访问
color 0E

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║            SmartJFB 专业体育比分系统 - 快速访问                ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo 请选择要访问的功能：
echo.
echo [1] 主页 - 功能导航
echo [2] 主记分牌
echo [3] 管理面板（技术台）
echo [4] 实时统计面板
echo [5] 技术台监控器
echo [6] 现场大屏控制
echo [7] 辅助信息屏
echo [8] 数据导出
echo [9] 广告管理
echo [10] 布局编辑器
echo [0] 全部打开
echo [Q] 退出
echo.

set /p choice="请输入选项 (0-10, Q): "

if "%choice%"=="1" (
    start http://localhost:3001/
    goto end
)
if "%choice%"=="2" (
    start http://localhost:3001/scoreboard.html
    goto end
)
if "%choice%"=="3" (
    start http://localhost:3001/admin.html
    goto end
)
if "%choice%"=="4" (
    start http://localhost:3001/statistics.html
    goto end
)
if "%choice%"=="5" (
    start http://localhost:3001/monitor.html
    goto end
)
if "%choice%"=="6" (
    start http://localhost:3001/stadium-screen.html
    goto end
)
if "%choice%"=="7" (
    start http://localhost:3001/auxiliary-screen.html
    goto end
)
if "%choice%"=="8" (
    start http://localhost:3001/export.html
    goto end
)
if "%choice%"=="9" (
    start http://localhost:3001/ad-manager.html
    goto end
)
if "%choice%"=="10" (
    start http://localhost:3001/layout-editor.html
    goto end
)
if "%choice%"=="0" (
    echo.
    echo [提示] 正在打开所有页面...
    start http://localhost:3001/
    start http://localhost:3001/scoreboard.html
    start http://localhost:3001/admin.html
    start http://localhost:3001/statistics.html
    start http://localhost:3001/monitor.html
    start http://localhost:3001/stadium-screen.html
    start http://localhost:3001/auxiliary-screen.html
    start http://localhost:3001/export.html
    start http://localhost:3001/ad-manager.html
    start http://localhost:3001/layout-editor.html
    goto end
)
if /i "%choice%"=="Q" (
    exit
)

echo.
echo [错误] 无效的选项
pause

:end
