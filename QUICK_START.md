# 🚀 英语单词学习 App - 快速开始指南

## ✅ 当前状态

恭喜！你的应用已经成功配置并启动！

### 已完成的配置
- ✅ **Ollama** - AI 服务已安装并运行
- ✅ **Node.js** - v25.3.0 已安装
- ✅ **项目依赖** - 已安装
- ✅ **应用** - 正在运行中
- ⏳ **qwen2.5:3b 模型** - 正在下载中（约 1.9GB）

## 🎯 立即开始使用

### 1. 打开应用
应用已在浏览器中打开：**http://localhost:3000**

如果没有自动打开，请手动访问该地址。

### 2. 使用应用

#### 首页
- 查看今日学习进度
- 查看学习统计
- 检查 AI 连接状态
- 点击"开始学习"进入学习页面

#### 学习页面
- **上一个/下一个** - 浏览单词（也可使用键盘 ← → 键）
- **播放发音** - 点击音频按钮听单词发音
- **查看详情** - 点击"展开详情"查看例句、搭配等
- **收藏单词** - 点击星标按钮收藏喜欢的单词
- **AI 生成例句** - 点击"AI 生成例句"按钮生成新的例句（需要模型下载完成）

#### 设置页面
- 调整每日学习目标
- 设置发音类型（美式/英式）
- 配置 Ollama 连接
- 测试 AI 连接

## 📝 关于 AI 功能

### 当前可用模型
由于 qwen2.5:3b 模型还在下载中，你暂时可以使用以下已安装的模型：
- `qwen2:1.5b` - 轻量级模型（1.5GB）
- `gemma2:2b` - Google 模型（2.6GB）

### 使用步骤
1. 等待 qwen2.5:3b 模型下载完成（约 15-20 分钟）
2. 进入"设置"页面
3. 在"AI 功能设置"中选择模型
4. 点击"测试连接"验证
5. 在单词卡片中点击"AI 生成例句"

## 🛠️ 常用命令

### 启动应用
```bash
# 方式1: 使用启动脚本
./start.sh

# 方式2: 手动启动
npm run dev
```

### 检查状态
```bash
./check-status.sh
```

### Ollama 管理
```bash
# 查看模型下载进度
ollama list

# 重启 Ollama 服务
brew services restart ollama

# 测试 AI 生成
ollama run qwen2.5:3b "Generate 3 English example sentences for the word 'happy'"
```

## 📚 项目结构

```
englishLearn/
├── src/
│   ├── components/      # React 组件
│   │   ├── WordCard.jsx           # 单词卡片（含 AI 生成）
│   │   ├── NavigationControls.jsx # 导航控制
│   │   ├── LearningPage.jsx       # 学习页面
│   │   └── AIGenerateButton.jsx   # AI 生成按钮
│   ├── pages/          # 页面组件
│   │   ├── HomePage.jsx           # 首页
│   │   └── SettingsPage.jsx       # 设置页面
│   ├── data/           # 单词数据库
│   ├── types/          # TypeScript 类型定义
│   ├── utils/          # 工具函数
│   │   ├── storage.js            # 存储管理
│   │   ├── speech.js             # 语音合成
│   │   ├── ollama.ts             # Ollama 客户端
│   │   └── wordLoader.ts         # 词库加载器
│   └── styles/         # 样式文件
├── start.sh            # 快速启动脚本 ⚡
├── check-status.sh     # 状态检查脚本 🔍
├── package.json
├── README.md           # 项目说明
└── OLLAMA_SETUP.md     # Ollama 配置指南
```

## 🎨 功能特性

### 核心功能
- ✅ 10000 个单词学习（当前 20 个示例）
- ✅ 卡片式学习界面
- ✅ 上一个/下一个导航
- ✅ 键盘快捷键支持（← →）
- ✅ 单词和例句发音
- ✅ 进度自动保存
- ✅ 今日学习统计
- ✅ 收藏功能
- ✅ 响应式设计

### AI 功能
- ✅ 本地 Ollama 集成
- ✅ 智能生成例句
- ✅ 多模型支持
- ✅ 自定义配置

## 🔄 下一步

### 1. 扩展词库
当前只有 20 个示例单词。要扩展到 10000 个：

**方式1：手动添加**
编辑 `src/data/wordDatabase.js` 添加更多单词

**方式2：AI 批量生成**
使用 Ollama 批量生成单词数据

**方式3：导入词典**
从开源词典项目导入数据

### 2. 优化体验
- 调整每日学习目标
- 设置个人偏好的发音类型
- 个性化显示设置

### 3. 探索功能
- 尝试 AI 生成例句（模型下载完成后）
- 收藏重点单词
- 使用键盘快捷键提高效率

## ❓ 常见问题

### Q: 如何重置学习进度？
A: 在首页点击"重置进度"按钮（⚠️ 不可恢复）

### Q: AI 生成很慢怎么办？
A:
- 使用更小的模型（qwen2:1.5b）
- 关闭其他占用资源的程序
- 确保使用较快的设备

### Q: 如何更换模型？
A:
1. 进入"设置"页面
2. 在"AI 功能设置"中选择其他模型
3. 点击"测试连接"

### Q: 进度会丢失吗？
A:
- 进度保存在浏览器 localStorage
- 清除浏览器数据会丢失
- 建议定期备份

### Q: 如何查看模型下载进度？
A:
```bash
# 查看后台进程
ps aux | grep ollama

# 或者直接测试连接
curl http://localhost:11434/api/tags
```

## 📞 需要帮助？

查看详细文档：
- [README.md](README.md) - 项目说明
- [OLLAMA_SETUP.md](OLLAMA_SETUP.md) - Ollama 配置指南
- [requirements.md](requirements.md) - 需求文档
- [tech-stack.md](tech-stack.md) - 技术栈设计

## 🎉 开始学习吧！

现在就打开 http://localhost:3000 开始你的英语学习之旅吧！

记住：每天进步一点点，坚持就是胜利！💪
