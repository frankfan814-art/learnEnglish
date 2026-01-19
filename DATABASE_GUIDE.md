# 数据库使用指南

## 概述

本应用已经集成了 SQLite 数据库用于持久化存储学习进度，不再需要每次都重新开始学习。数据库提供了比 localStorage 更可靠的数据存储方案。

## 数据库架构

### 表结构

1. **user_progress** - 用户学习进度
   - `current_index`: 当前学习位置
   - `total_words`: 总单词数
   - `today_studied`: 今日学习数量
   - `today_target`: 每日目标
   - `completed_rounds`: 完成轮数
   - `start_time`: 开始学习时间
   - `last_study_time`: 最后学习时间

2. **user_favorites** - 用户收藏的单词
   - `word_id`: 单词ID
   - `word`: 单词文本
   - `created_at`: 收藏时间

3. **study_history** - 学习历史记录
   - `word_id`: 单词ID
   - `word`: 单词文本
   - `studied_at`: 学习时间
   - `session_round`: 学习轮次

4. **user_settings** - 用户设置
   - `key`: 设置键
   - `value`: 设置值（JSON格式）

5. **daily_stats** - 每日学习统计
   - `study_date`: 学习日期
   - `words_studied`: 学习单词数
   - `words_reviewed`: 复习单词数
   - `study_duration_seconds`: 学习时长

## 安装和初始化

### 1. 安装依赖

```bash
npm install
```

### 2. 初始化数据库

```bash
npm run db:init
```

这将创建 `database/learning_progress.db` 文件并初始化所有表结构。

### 3. 测试数据库功能

```bash
node database/test.mjs
```

## 在应用中使用

### 方式 1: 使用新的数据库存储管理器（推荐）

导入数据库存储管理器：

```javascript
// 在组件中使用数据库存储
import {
  databaseProgressManager,
  databaseFavoritesManager,
  databaseSettingsManager
} from '@/utils/databaseStorage';

// 使用进度管理器
const currentIndex = databaseProgressManager.getCurrentIndex();
databaseProgressManager.setCurrentIndex(100, 20000);

// 使用收藏管理器
databaseFavoritesManager.addFavorite('word_123', 'hello');
const favorites = databaseFavoritesManager.getFavorites();

// 使用设置管理器
const settings = databaseSettingsManager.getSettings();
databaseSettingsManager.updateSetting('theme', 'dark');
```

### 方式 2: 继续使用 localStorage（现有方式）

现有的 localStorage 管理器（`@/utils/storage.js`）仍然可用，数据库存储作为可选的增强功能。

```javascript
// 现有代码无需修改
import { progressManager } from '@/utils/storage';

const currentIndex = progressManager.getCurrentIndex();
```

### 方式 3: 混合使用（逐步迁移）

可以在应用中同时使用两种存储方式，数据库作为主要存储，localStorage 作为备用缓存。

## 数据库命令

### 初始化数据库

```bash
npm run db:init
```

### 备份数据库

```bash
npm run db:backup
```

备份文件将保存在 `database/backups/` 目录下，文件名格式为 `backup_YYYY-MM-DDTHH-mm-ss.json`。

## 数据导出和导入

### 导出进度数据

```javascript
import { exportProgressData, downloadProgressFile } from '@/utils/databaseStorage';

// 导出为对象
const data = exportProgressData();

// 下载为 JSON 文件
downloadProgressFile();
```

### 导入进度数据

```javascript
import { importProgressData, readProgressFile } from '@/utils/databaseStorage';

// 从对象导入
const result = importProgressData(data);

// 从文件导入
const file = event.target.files[0];
readProgressFile(file).then(result => {
  console.log(result.message);
});
```

## 获取学习历史和统计

### 获取学习历史

```javascript
import { getStudyHistory } from '@/utils/databaseStorage';

// 获取最近 100 条学习历史
const history = getStudyHistory(100);
console.log(history);
```

### 获取每日统计

```javascript
import { getDailyStats } from '@/utils/databaseStorage';

// 获取最近 30 天的统计数据
const stats = getDailyStats(30);
console.log(stats);
```

## 数据库维护

### 查看数据库文件

数据库文件位置：`database/learning_progress.db`

### 备份文件

备份文件位置：`database/backups/`

建议定期运行 `npm run db:backup` 备份数据库。

### 重置数据库

如需重置数据库，删除数据库文件后重新初始化：

```bash
rm database/learning_progress.db
npm run db:init
```

⚠️ **警告**：这将删除所有学习进度数据！

## 数据库特性

### 优势

- ✅ **持久化存储**：数据不会因为浏览器清理缓存而丢失
- ✅ **高性能**：SQLite 是轻量级数据库，查询速度快
- ✅ **事务支持**：支持 ACID 事务，保证数据一致性
- ✅ **完整历史**：保存完整的学习历史记录
- ✅ **每日统计**：自动记录每日学习数据
- ✅ **易于备份**：支持一键备份到 JSON 文件

### 与 localStorage 的区别

| 特性 | localStorage | SQLite 数据库 |
|------|-------------|--------------|
| 存储容量 | 5-10 MB | 受磁盘空间限制 |
| 查询能力 | 键值对 | SQL 查询 |
| 历史记录 | 需手动实现 | 原生支持 |
| 统计功能 | 需手动实现 | 原生支持 |
| 数据导出 | 需手动实现 | 内置导出功能 |
| 性能 | 小数据量快 | 大数据量快 |
| 可靠性 | 浏览器清理后丢失 | 持久化存储 |

## 常见问题

### Q: 数据库会同步到云端吗？

A: 当前版本只支持本地存储。如需云端同步，可以定期备份数据库文件并上传到云存储。

### Q: 如何在多个设备间同步进度？

A: 使用备份和恢复功能：
1. 在设备 A 上运行 `npm run db:backup`
2. 将备份文件传输到设备 B
3. 在设备 B 上导入备份文件

### Q: 数据库文件可以删除吗？

A: 可以，但会丢失所有进度数据。删除后需要重新运行 `npm run db:init` 初始化。

### Q: 如何查看数据库内容？

A: 可以使用 SQLite 客户端工具，如：
- DB Browser for SQLite (https://sqlitebrowser.org/)
- DBeaver (https://dbeaver.io/)
- VS Code SQLite 扩展

### Q: 数据库会拖慢应用启动速度吗？

A: 不会。数据库连接非常快，且使用了 WAL 模式优化性能。

## 下一步

1. **在组件中使用数据库存储管理器**
   - 修改 `LearningPage.jsx` 使用 `databaseProgressManager`
   - 修改 `WordCard.jsx` 使用 `databaseFavoritesManager`

2. **添加数据统计页面**
   - 创建统计页面展示学习历史
   - 使用每日统计数据生成图表

3. **设置定期备份**
   - 在设置页面添加备份按钮
   - 实现自动备份功能

## 技术细节

### 依赖包

- `better-sqlite3`: ^9.2.2 - SQLite 数据库驱动

### 数据库配置

- 模式：WAL (Write-Ahead Logging)
- 外键约束：启用
- 编码：UTF-8

### 性能优化

- 使用索引加速查询
- WAL 模式提高并发性能
- 预处理语句防止 SQL 注入

## 更新日志

### v1.0.0 (2026-01-19)

- ✨ 初始版本
- ✅ 支持 SQLite 数据库
- ✅ 进度、收藏、设置持久化
- ✅ 学习历史记录
- ✅ 每日统计功能
- ✅ 数据导出/导入功能
