@echo off
chcp 65001 >nul

:: 体育比分工具 - 停止所有服务器
:: Sports Score Tracker - Stop All Servers

set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "NC=[0m"

echo.
echo %YELLOW%正在停止所有服务器...%NC%
echo.

:: 停止端口3000的进程
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    echo %YELLOW%停止端口 3000 的进程 (PID: %%a)...%NC%
    taskkill /F /PID %%a >nul 2>&1
    if errorlevel 1 (
        echo %RED%无法停止进程 %%a%NC%
    ) else (
        echo %GREEN%已停止进程 %%a%NC%
    )
)

:: 停止端口3001的进程
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    echo %YELLOW%停止端口 3001 的进程 (PID: %%a)...%NC%
    taskkill /F /PID %%a >nul 2>&1
    if errorlevel 1 (
        echo %RED%无法停止进程 %%a%NC%
    ) else (
        echo %GREEN%已停止进程 %%a%NC%
    )
)

echo.
echo %GREEN%所有服务器已停止%NC%
echo.
pause
