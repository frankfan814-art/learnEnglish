# 云端运行补全脚本文档（Ollama）

本脚本使用本地/云端 Ollama，为单词自动补齐 **词义** 和 **例句**，并写入本地文件 `src/data/words_with_examples.json`。

## 1. 前置条件
- Node.js 18+
- Ollama 已安装并运行（本机或同一台云主机）
- 后端服务已启动（提供 `/api/definitions` 和 `/api/examples`）

## 1.1 未安装 Ollama（下载与启动）
### macOS / Linux
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### Windows
下载并安装：
https://ollama.com/download

### 启动服务
```bash
ollama serve
```

### 拉取模型（示例）
```bash
ollama pull qwen2.5:3b
```

## 2. 安装与启动
```bash
npm install
npm run server
```

确认后端已启动：
```bash
curl http://localhost:3001/api/health
```

## 3. 运行脚本
```bash
npm run enrich:ollama
```

## 4. 常用环境变量（可选）
```bash
# 后端地址
API_BASE=http://localhost:3001

# Ollama 配置
OLLAMA_ENDPOINT=http://localhost:11434
OLLAMA_MODEL=qwen2.5:3b

# 每个单词例句数量
EXAMPLES_PER_WORD=10

# 处理范围（用于分批跑）
START_INDEX=0
LIMIT=50

# 重试次数
RETRY=2
RETRY_DELAY=1500
```

示例：分批跑第 1000 开始的 200 个单词
```bash
START_INDEX=1000 LIMIT=200 npm run enrich:ollama
```

## 5. 输出结果
- 结果写入：`src/data/words_with_examples.json`
- 日志会输出每个单词的处理结果

## 6. 常见问题
- `fetch failed`：确认后端 `npm run server` 正在运行，并检查 `API_BASE` 是否正确
- `Ollama API 错误`：确认 Ollama 服务和模型已拉取
