# 故障排除指南 - Troubleshooting Guide

## 常见问题

### 1. 端口被占用 (EADDRINUSE)

**错误信息:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**解决方案:**

**方法1 - 使用停止脚本（推荐）:**
```cmd
stop.bat
```

**方法2 - 使用更新后的启动脚本:**
新的 `start-all.bat` 会自动检测并释放占用的端口。

**方法3 - 手动停止进程:**
```cmd
# 查看占用端口的进程
netstat -ano | findstr :3000

# 停止进程（替换 PID 为实际的进程ID）
taskkill /F /PID <进程ID>
```

**方法4 - 更改端口:**
编辑 `frontend-server.js` 或 `backend-server.js`，修改端口号：
```javascript
const PORT = 3001; // 改为其他端口
```

---

### 2. 依赖安装失败

**错误信息:**
```
npm ERR! code ECONNREFUSED
```

**解决方案:**

1. 检查网络连接
2. 使用国内镜像源：
```cmd
npm config set registry https://registry.npmmirror.com
npm install
```

3. 清除缓存后重试：
```cmd
npm cache clean --force
npm install
```

---

### 3. 找不到 Node.js

**错误信息:**
```
'node' 不是内部或外部命令
```

**解决方案:**

1. 确认已安装 Node.js: https://nodejs.org/
2. 重新安装并添加到 PATH
3. 检查版本:
```cmd
node --version
```

---

### 4. 前后台无法连接

**症状:**
- 后台管理界面正常
- 前台展示界面显示"未连接"

**解决方案:**

1. 确认两个服务器都已启动：
```cmd
netstat -ano | findstr :3000
netstat -ano | findstr :3001
```

2. 检查浏览器控制台是否有错误（F12）
3. 确认 API_BASE 配置正确（默认为 http://localhost:3001/api）
4. 尝试刷新页面
5. 检查防火墙设置

---

### 5. 激活码无效

**错误信息:**
```
激活失败: 激活码与此设备不匹配
```

**解决方案:**

1. 确认机器码正确
2. 激活码必须为此设备的机器码生成
3. 检查激活码是否过期
4. 生成新的激活码

---

### 6. 数据不同步

**症状:**
- 后台操作后前台没有更新

**解决方案:**

1. 检查后端服务器是否正常运行
2. 查看浏览器控制台网络请求是否成功
3. 刷新前台页面
4. 检查是否有JavaScript错误

---

### 7. 页面显示异常

**症状:**
- 页面样式错乱
- 按钮无响应

**解决方案:**

1. 清除浏览器缓存
2. 使用隐私模式打开
3. 检查 `styles.css` 文件是否存在
4. 查看浏览器控制台错误信息

---

## 快速测试

### 测试服务器启动
```cmd
test-server.bat
```
此脚本会：
1. 清理占用的端口
2. 启动两个服务器
3. 检查是否启动成功
4. 5秒后自动停止

### 手动测试

1. 启动后端API:
```cmd
node backend-server.js
```
访问 http://localhost:3001/api/health 应返回: `{"status":"ok","timestamp":"..."}`

2. 启动前端服务器:
```cmd
node frontend-server.js
```
访问 http://localhost:3000 应显示选择菜单

---

## 重置项目

如果遇到无法解决的问题，可以重置项目：

```cmd
# 1. 停止所有服务
stop.bat

# 2. 删除 node_modules
rmdir /s /q node_modules

# 3. 删除 package-lock.json
del /f /q package-lock.json

# 4. 重新安装
npm install

# 5. 重新启动
start-all.bat
```

---

## 日志和调试

### 查看服务器日志

启动时会显示服务器日志，包括：
- 服务器地址
- API端点
- 错误信息

### 浏览器调试

1. 按 F12 打开开发者工具
2. 查看 Console 标签页（JavaScript错误）
3. 查看 Network 标签页（网络请求）

### 常用日志命令

```cmd
# 查看所有 node 进程
tasklist | findstr node

# 查看端口占用
netstat -ano | findstr :3000
netstat -ano | findstr :3001
```

---

## 联系支持

如果以上方法都无法解决问题，请：

1. 记录完整的错误信息
2. 记录您的操作系统和版本
3. 记录 Node.js 版本 (`node --version`)
4. 提供浏览器控制台的错误截图

---

## 预防措施

1. **定期备份数据**: 使用 Excel 导出功能备份比赛数据
2. **使用停止脚本**: 在关闭前使用 `stop.bat` 优雅停止服务
3. **检查依赖**: 定期更新依赖包
4. **防火墙设置**: 确保端口 3000 和 3001 没有被防火墙阻止
