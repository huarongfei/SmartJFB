@echo off
echo Starting SmartJFB Application...

echo Terminating any existing node processes...
taskkill /f /im node.exe >nul 2>&1

echo Waiting for processes to terminate...
timeout /t 2 /nobreak >nul

REM Start the backend server in a separate window
echo Starting backend server on port 3000...
start "SmartJFB Backend" cmd /k "cd /d f:\SmartJFB\backend && node server.js"

echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

REM Start the frontend server in another window
echo Starting frontend server on port 3002...
start "SmartJFB Frontend" cmd /k "cd /d f:\SmartJFB\frontend && npx http-server -p 3002 -c-1"

echo.
echo ===========================================
echo SmartJFB Application Started Successfully!
echo ===========================================
echo Backend API: http://localhost:3000
echo Frontend UI: http://localhost:3002
echo ===========================================
echo.
echo Press any key to exit...
pause >nul