@echo off
@echo off
chcp 65001 >nul
color 0A

echo.
echo ========================
echo    SmartJFB Application Launcher
echo ========================
echo.

echo Checking port usage...

REM Check port 3000 usage
netstat -ano | findstr :3000 >nul
if %errorlevel% == 0 (
    echo Port 3000 is occupied, terminating the process...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
        taskkill /f /pid %%a >nul 2>&1
    )
    timeout /t 2 /nobreak >nul
) else (
    echo Port 3000 is free
)

REM Check port 3002 usage
netstat -ano | findstr :3002 >nul
if %errorlevel% == 0 (
    echo Port 3002 is occupied, terminating the process...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3002') do (
        taskkill /f /pid %%a >nul 2>&1
    )
    timeout /t 2 /nobreak >nul
) else (
    echo Port 3002 is free
)

echo.
echo Starting SmartJFB Application...
echo.

REM Start backend server in a new window
start "SmartJFB Backend" cmd /k "cd /d f:\SmartJFB\backend && echo Starting backend server... && node server.js"

echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo.

REM Start frontend server in a new window
start "SmartJFB Frontend" cmd /k "cd /d f:\SmartJFB\frontend && echo Starting frontend server... && npx http-server -p 3002 -c-1"

echo.
echo ===========================================
echo SmartJFB Application Started Successfully!
echo ===========================================
echo Backend API: http://localhost:3000
echo Frontend UI: http://localhost:3002
echo Default Account: admin
echo Default Password: password123
echo ===========================================
echo.
echo Press any key to exit...
pause >nul