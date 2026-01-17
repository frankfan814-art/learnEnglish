# 学习英语 App 技术栈设计（简版）

## 1. 目标原则
- 轻量、易部署、易维护
- 纯前端即可运行（MVP）
- 支持桌面/移动端
- 后期可扩展到云端与多端同步

## 2. 推荐技术栈（MVP）
### 2.1 前端
- 框架：React + Vite
- 语言：JavaScript
- UI：自定义样式（CSS）
- 状态管理：React Hooks（useState/useEffect）
- 路由：无需（单页）

### 2.2 数据与存储
- 词库与例句：本地数据源 [src/data/generated/word_examples.json](src/data/generated/word_examples.json)
- 词性与翻译：构建阶段由词典与词性库生成写入
- 进度：浏览器 localStorage
- 每日计数：localStorage（按日期键存储）

### 2.3 发音
- 浏览器 Web Speech API（SpeechSynthesis）
- 单词/句子均可播放

### 2.4 生成用法句子（可选）
- 方案 A：在线生成（调用 DeepSeek API）
- 方案 B：本地大模型（Ollama）按需生成（可选）
- 用于用户手动“生成/补充例句”

### 2.5 本地大模型（Ollama）接入建议（可选）
- 目的：当用户点击“重新生成句子”时，本地调用模型生成新例句
- 方式：前端调用本地 API（Ollama HTTP）或通过轻量后端代理（推荐）
- 适用模型（轻量优先，建议先试）：
  - qwen2.5:3b / qwen2.5:7b（中文+英文表现稳定）
  - llama3.1:8b（英文输出流畅）
  - mistral:7b（英文例句质量高）
- 选择建议：
  - 设备性能一般：优先 3B 模型
  - 设备性能较好：7B/8B
- 接口示例（Ollama 本地）：
  - POST http://localhost:11434/api/generate
  - 请求包含：单词、词性、使用场景、期望例句数量
  - 返回：英文句子 + 中文翻译
-- 提示词策略（简版）：
  - 输入：word + partOfSpeech + scenarios
  - 输出：10 条生活场景句子，句子长度 6-14 词，附中文翻译 + 用法说明

## 3. 后续可扩展技术栈（可选）
### 3.1 后端
- Node.js + Express / Fastify
- 数据库：PostgreSQL（或 SQLite for small scale）

### 3.2 服务与部署
- 静态部署：Vercel / Netlify
- 后端部署：Render / Railway / Fly.io

### 3.3 账号与同步
- 认证：JWT / Supabase Auth
- 数据同步：Supabase / Firebase

## 4. 目录结构建议（前端）
```
englishLearn/
  src/
    components/
    data/
      generated/
    hooks/
    pages/
    styles/
    utils/
  public/
  index.html
```

## 5. 选择理由（简要）
- React + Vite 启动快、生态成熟
- JS 成本更低，当前项目采用 JS
- Web Speech API 无需额外依赖即可实现发音
- 本地 JSON + localStorage 适合 MVP

## 6. 版本建议
- Node.js：18+
- React：18+
- Vite：5+
