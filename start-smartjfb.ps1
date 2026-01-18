# SmartJFB PowerShell启动脚本
Write-Host "========================" -ForegroundColor Green
Write-Host "   SmartJFB 应用启动器" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green

Write-Host "`n检测端口占用情况..." -ForegroundColor Yellow

# 检查端口3000占用情况
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($port3000) {
    Write-Host "端口 3000 已被占用，正在终止占用进程..." -ForegroundColor Red
    $port3000.OwningProcess -split ',' | ForEach-Object {
        $pid = $_.Trim()
        if ($pid -and $pid -ne '') {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
    }
    Start-Sleep -Seconds 2
} else {
    Write-Host "端口 3000 空闲" -ForegroundColor Green
}

# 检查端口3002占用情况
$port3002 = Get-NetTCPConnection -LocalPort 3002 -ErrorAction SilentlyContinue
if ($port3002) {
    Write-Host "端口 3002 已被占用，正在终止占用进程..." -ForegroundColor Red
    $port3002.OwningProcess -split ',' | ForEach-Object {
        $pid = $_.Trim()
        if ($pid -and $pid -ne '') {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
    }
    Start-Sleep -Seconds 2
} else {
    Write-Host "端口 3002 空闲" -ForegroundColor Green
}

Write-Host "`n正在启动 SmartJFB 应用程序..." -ForegroundColor Yellow

# 设置当前目录
Set-Location -Path "f:\SmartJFB"

# 启动后端服务器（异步）
Write-Host "启动后端服务器..." -ForegroundColor Cyan
Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory "f:\SmartJFB\backend" -WindowStyle Normal

# 等待后端启动
Start-Sleep -Seconds 5

# 启动前端服务器（异步）
Write-Host "启动前端服务器..." -ForegroundColor Cyan
Start-Process -FilePath "npx" -ArgumentList "http-server", "-p", "3002", "-c-1" -WorkingDirectory "f:\SmartJFB\frontend" -WindowStyle Normal

Write-Host "`n===========================================" -ForegroundColor Green
Write-Host "SmartJFB 应用程序启动成功！" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host "后端 API 地址: http://localhost:3000" -ForegroundColor Green
Write-Host "前端 UI 地址: http://localhost:3002" -ForegroundColor Green
Write-Host "默认账号: admin" -ForegroundColor Green
Write-Host "默认密码: password123" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green

Write-Host "`n按任意键继续..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")