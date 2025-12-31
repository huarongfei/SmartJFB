# 体育比分工具 - SmartJFB

一个功能完整的篮球/足球比分记录工具，支持实时双端同步：后台管理 + 前台展示。

## ✨ 功能特性

### 核心功能
- 🏀 **篮球模式**: 3分、2分、罚球记录
- ⏱️ **精确计时器**: 支持开始、暂停、重置
- 👥 **队员管理**: 添加、导入队员信息
- 📊 **动作记录**: 实时记录得分/射门情况（拉线展示）
- 📝 **判罚记录**: 篮球犯规、足球红黄牌
- 📥 **Excel导出**: 导出比赛记录和统计数据

### 双端同步
- 🎮 **后台管理**: 用于数据录入和比赛管理
- 📺 **前台展示**: 用于大屏实时展示比分
- 🔄 **实时同步**: 所有操作实时同步到展示端

### 界面功能
- 🌓 **主题切换**: 黑白主题自由切换
- 🌐 **多语言支持**: 中英文双语切换
- 📱 **响应式设计**: 支持各种设备尺寸

## 📦 安装

### 环境要求
- Node.js >= 14.0.0
- npm 或 yarn

### 安装步骤

1. 克隆或下载项目
```bash
cd SmartJFB
```

2. 安装依赖
```bash
npm install
```

3. 启动应用

**Windows:**
```cmd
start-all.bat
```

**Linux/Mac:**
```bash
chmod +x start-all.sh
./start-all.sh
```

4. 停止应用（可选）

**Windows:**
```cmd
stop.bat
```

**Linux/Mac:**
```bash
chmod +x stop.sh
./stop.sh
```

**或手动启动:**
```bash
# 终端1 - 启动后端API
node backend-server.js

# 终端2 - 启动前端服务器
node frontend-server.js
```

### 故障排除

#### 端口被占用
如果出现 "EADDRINUSE" 错误，说明端口已被占用。可以：

1. 运行停止脚本：
   ```cmd
   stop.bat
   ```

2. 或者手动查找并停止占用端口的进程：
   ```cmd
   netstat -ano | findstr :3000
   taskkill /F /PID <进程ID>
   ```

3. `start-all.bat` 会自动检测并尝试释放占用的端口。

## 🚀 使用说明

### 访问地址

启动后会自动打开两个服务器：

- **主页面**: http://localhost:3000
  - 显示功能选择菜单

- **后台管理**: http://localhost:3000/backend.html
  - 用于数据录入和管理

- **前台展示**: http://localhost:3000/display.html
  - 用于大屏实时展示

### 使用流程

1. **打开后台管理界面**
   - 访问 http://localhost:3000/backend.html

2. **激活产品**
   - 点击右上角"激活"按钮
   - 查看机器码
   - 使用激活码生成脚本生成激活码
   - 输入激活码完成激活

3. **打开前台展示界面**
   - 访问 http://localhost:3000/display.html
   - 连接状态会显示在顶部

4. **开始比赛**
   - 在后台管理界面添加队员
   - 选择运动类型（篮球/足球）
   - 启动计时器
   - 记录得分/射门
   - 记录判罚

5. **查看实时同步**
   - 前台展示界面会自动显示所有操作
   - 比分、计时器、队员统计实时更新

## 🔑 激活码生成

### 使用脚本

**Windows:**
```cmd
generate_activation.cmd standard <机器码> 365
generate_activation.cmd dev
```

**Linux/Mac:**
```bash
chmod +x generate_activation.sh
./generate_activation.sh standard <机器码> 365
./generate_activation.sh dev
```

### 使用Node.js


## 📁 项目结构

```
SmartJFB/
├── backend.html                # 后台管理界面
├── backend.js                  # 后台管理逻辑
├── backend-server.js           # 后端API服务器 (端口3001)
├── display.html                 # 前台展示界面
├── display.js                  # 前台展示逻辑
├── frontend-server.js           # 前端服务器 (端口3000)
├── styles.css                  # 样式文件
├── generate_activation.js      # 激活码生成器
├── generate_activation.sh      # Shell脚本
├── generate_activation.cmd     # CMD脚本
├── start-all.bat              # Windows完整启动脚本
├── start-all.sh               # Linux/Mac完整启动脚本
├── package.json               # 项目配置
├── batch_example.json         # 批量生成示例
├── README.md                  # 说明文档
└── QUICKSTART.md             # 快速入门指南
```

## 📊 数据流程

```
后台管理界面 (backend.html)
    ↓ HTTP请求
后端API服务器 (backend-server.js:3001)
    ↓ 内存存储
前台展示界面 (display.html)
    ↓ 定期轮询
实时更新显示
```

## 🎯 典型使用场景

### 场景1: 单机使用
1. 启动服务器
2. 打开后台管理界面
3. 进行比赛记录和导出

### 场景2: 比赛现场展示
1. 启动服务器
2. 在管理电脑打开后台管理界面
3. 在大屏打开前台展示界面
4. 实时同步所有操作

### 场景3: 直播推流
1. 启动服务器
2. 后台管理界面录入数据
3. 使用前台展示界面进行直播推流
4. 观众实时看到比赛进度

## 🔧 技术栈

- **前端**: 原生 JavaScript + CSS3
- **后端**: Node.js + Express
- **数据存储**: 内存存储（生产环境建议使用数据库）
- **通信**: HTTP轮询（可升级为WebSocket）
- **加密**: Crypto (SHA256, HMAC)

## 🛠️ 开发

### 启动开发服务器

```bash
npm run dev
```

使用 nodemon 自动重启

### API接口

**后端API (端口3001):**

- `GET /api/health` - 健康检查
- `GET /api/machine-id` - 获取机器码
- `POST /api/activate` - 验证激活码
- `GET /api/data` - 获取全部数据
- `POST /api/data` - 更新数据
- `POST /api/players` - 添加队员
- `DELETE /api/players/:team/:playerId` - 删除队员
- `POST /api/actions` - 添加动作
- `DELETE /api/actions/:actionId` - 删除动作
- `POST /api/clear` - 清空数据

**前端服务器 (端口3000):**

- 静态文件服务
- 默认路由: `/`

## 📝 更新日志

### v2.0.0 (2025-12-30)
- ✅ 双端架构（后台+前台）
- ✅ 实时数据同步
- ✅ 独立前后端服务器
- ✅ 大屏展示优化
- ✅ 连接状态监控

### v1.0.0 (2025-12-30)
- ✅ 初始版本发布
- ✅ 篮球/足球双模式
- ✅ 队员管理和导入
- ✅ 实时比分记录
- ✅ 判罚记录
- ✅ Excel导出
- ✅ 黑白主题切换
- ✅ 中英文切换
- ✅ 激活码系统

## 📄 许可证

MIT License

## 👨‍💻 作者

SmartJFB Team

## 💬 支持

如有问题，请查看快速入门指南 `QUICKSTART.md`

---

**⚠️ 注意**:
- 机器码与设备硬件绑定，更换设备需要重新激活
- 激活码有有效期限制，到期后需要续费
- 开发版仅供开发和测试使用
- 前后端需要同时运行才能正常工作
