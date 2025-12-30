# 数据导出功能使用指南

## 概述

专业体育比分系统提供完整的数据导出功能，支持将比赛数据导出为多种格式，适用于数据分析、存档、报告生成等场景。

## 支持的导出格式

| 格式 | 扩展名 | 特点 | 适用场景 |
|------|--------|------|----------|
| **Excel** | .xlsx | 专业表格，支持多工作表、样式、公式 | 深度分析、专业报告 |
| **CSV** | .csv | 纯文本，通用性强 | 数据导入其他系统 |
| **PDF** | .pdf | 文档格式，适合打印 | 归档、打印、分享 |

## 导出内容类型

### 1. 比赛摘要（Match Summary）

**包含内容**：
- 比赛基本信息（类型、日期、状态）
- 当前比分
- 主客队信息
- 最佳球员

**导出示例**：
```excel
项目           值
比赛类型       篮球
比赛日期       2025-12-30
比赛状态       进行中
当前比分       85 - 92
比赛时间       第4节 03:45
主队           湖人队
客队           勇士队
```

### 2. 球队技术统计（Team Statistics）

**包含内容**：

**篮球模式**：
- 总得分
- 投篮命中（命中率）
- 三分命中（命中率）
- 罚球命中（命中率）
- 助攻
- 篮板（进攻/防守）
- 抢断
- 盖帽
- 失误
- 犯规

**足球模式**：
- 总得分
- 射门次数
- 射正次数
- 角球
- 任意球
- 越位
- 换人
- 黄牌/红牌

### 3. 球员个人数据（Player Statistics）

**包含内容**：

**篮球模式**：
- 号码、姓名、出场时间
- 得分
- 投篮命中率%
- 三分命中率%
- 罚球命中率%
- 助攻
- 篮板
- 抢断
- 盖帽
- 失误
- 犯规

**足球模式**：
- 号码、姓名、出场时间
- 射门次数
- 射正次数
- 助攻
- 黄牌
- 红牌

### 4. 完整比赛事件序列（Play-by-Play）

**包含内容**：
- 每一秒发生的所有事件
- 时间戳
- 节次/半场
- 队伍
- 事件类型
- 球员
- 详细描述

**导出示例**：
```excel
时间    节次    队伍    事件类型    球员    详细描述                    时间戳
09:45   第2节   湖人队   得分        勒布朗   勒布朗 2分球命中         2025-12-30 15:30:45
09:42   第2节   勇士队   犯规        库里     库里 个人犯规             2025-12-30 15:30:48
09:40   第2节   湖人队   助攻        戴维斯   戴维斯 助攻勒布朗       2025-12-30 15:30:50
```

## 使用方法

### 方法1：Web界面导出（推荐）

1. **访问导出页面**
   ```
   http://localhost:3001/export.html
   ```

2. **选择导出内容**
   - 比赛摘要
   - 球队技术统计
   - 球员个人数据
   - 比赛事件序列

3. **选择导出格式**
   - 📗 Excel - 专业表格
   - 📄 CSV - 纯文本
   - 📕 PDF - 文档格式

4. **点击导出按钮**
   - 文件自动下载
   - 保存到默认下载目录

5. **批量导出**（可选）
   - 点击"批量导出所有格式"
   - 一次性导出所有可用格式
   - 适合完整备份

### 方法2：API导出

#### JavaScript 示例

```javascript
// 导出比赛摘要
const response = await fetch('http://localhost:3001/api/export/summary', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ format: 'excel' })
});

// 获取文件名
const filename = response.headers.get('Content-Disposition')
  ?.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)?.[1]
  || `export_${Date.now()}.xlsx`;

// 下载文件
const blob = await response.blob();
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = filename;
a.click();
```

#### cURL 示例

```bash
# 导出比赛摘要
curl -X POST http://localhost:3001/api/export/summary \
  -H "Content-Type: application/json" \
  -d '{"format":"excel"}' \
  -o match_summary.xlsx

# 导出球队统计
curl -X POST http://localhost:3001/api/export/team-stats \
  -H "Content-Type: application/json" \
  -d '{"format":"csv"}' \
  -o team_stats.csv

# 导出球员统计
curl -X POST http://localhost:3001/api/export/player-stats \
  -H "Content-Type: application/json" \
  -d '{"format":"pdf"}' \
  -o player_stats.pdf

# 导出 Play-by-Play
curl -X POST http://localhost:3001/api/export/playbyplay \
  -H "Content-Type: application/json" \
  -d '{"format":"excel"}' \
  -o play_by_play.xlsx

# 导出所有数据
curl -X POST http://localhost:3001/api/export/all \
  -H "Content-Type: application/json" \
  -d '{"format":"excel"}' \
  -o full_match_data.xlsx
```

## 导出历史

系统会自动记录导出历史，最多保留20条记录。

查看历史：
1. 访问导出页面
2. 滚动到"导出历史"区域
3. 查看最近的导出记录

历史记录包含：
- 导出类型
- 导出格式
- 文件名
- 导出时间

## 文件保存位置

### 服务端
导出文件会保存在：
```
d:/SmartJFB/exports/
```

### 客户端
下载的文件保存在浏览器的默认下载目录。

## 格式对比

### Excel (.xlsx)

**优点**：
- 支持多工作表
- 保留格式和样式
- 支持公式和图表
- 适合专业分析

**缺点**：
- 文件较大
- 需要Excel或其他表格软件打开

### CSV (.csv)

**优点**：
- 文件小
- 通用性强
- 易于导入其他系统
- 纯文本，易于处理

**缺点**：
- 不支持格式
- 不支持多工作表
- 数据类型单一

### PDF (.pdf)

**优点**：
- 适合打印
- 格式固定
- 易于分享
- 跨平台兼容

**缺点**：
- 不易编辑
- 不支持数据提取
- 文件较大

## 常见问题

### Q1: 导出失败怎么办？

**A**: 请检查：
1. 服务器是否正常运行
2. 比赛数据是否存在
3. 浏览器是否允许下载文件

### Q2: 可以导出空数据的比赛吗？

**A**: 可以，系统会导出包含表头的空数据结构。

### Q3: Excel文件打开乱码怎么办？

**A**: 请使用支持UTF-8的Excel版本（2010及以上）。

### Q4: 导出的数据不完整？

**A**: 请确保比赛已记录完整的事件数据。

### Q5: 可以自定义导出格式吗？

**A**: 可以通过修改 `server/export-service.js` 自定义导出格式。

## 高级用法

### 自定义导出服务

编辑 `server/export-service.js`：

```javascript
async exportCustomReport(data, filename) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('自定义报告');

  // 添加你的自定义内容
  worksheet.addRow(['自定义数据', '值']);
  worksheet.addRow(['项目1', data.custom1]);
  worksheet.addRow(['项目2', data.custom2]);

  const filepath = path.join(this.exportDir, `${filename}.xlsx`);
  await workbook.xlsx.writeFile(filepath);
  return filepath;
}
```

### 定时导出

```javascript
// 每隔5分钟自动导出
setInterval(async () => {
  const data = dataStore.getAll();
  await exportService.exportMatchSummaryExcel(data, `auto_export_${Date.now()}`);
}, 5 * 60 * 1000);
```

## 技术实现

### 导出服务模块

**文件位置**：`server/export-service.js`

**核心类**：`ExportService`

**主要方法**：
- `exportMatchSummary()` - 导出比赛摘要
- `exportTeamStatistics()` - 导出球队统计
- `exportPlayerStatistics()` - 导出球员统计
- `exportPlayByPlay()` - 导出事件序列
- `exportAllData()` - 导出所有数据

### 前端导出管理器

**文件位置**：`public/js/export.js`

**核心类**：`ExportManager`

**主要方法**：
- `exportData(type, format)` - 导出指定数据
- `batchExport()` - 批量导出
- `addToHistory()` - 添加到历史记录

## 性能优化

- 导出文件自动清理（7天后）
- 支持大文件导出
- 异步处理，不阻塞主线程
- 批量导出使用并发处理

## 安全性

- 导出文件使用随机文件名
- 限制导出频率
- 支持权限控制（待实现）

## 总结

数据导出功能为专业体育比分系统提供了完整的数据导出解决方案，支持多种格式和内容类型，满足不同的使用场景需求。

如有问题或建议，请联系开发团队。
