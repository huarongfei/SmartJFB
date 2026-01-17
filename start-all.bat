@echo off
echo Starting SmartJFB Application...

REM Start the backend server in a separate window
start cmd /k "cd /d f:\SmartJFB && node backend/server.js"

REM Wait a moment for the backend to start
timeout /t 3 /nobreak >nul

REM Start the frontend server in another window
start cmd /k "cd /d f:\SmartJFB\frontend && npx live-server --port=3000 --open=index.html"

echo Both servers should now be running.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
pause