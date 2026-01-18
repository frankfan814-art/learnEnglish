# 云端运行补全脚本文档（豆包 API）

本脚本使用字节跳动豆包大模型 API，为单词自动补齐 **词义** 和 **例句**，并写入本地文件 `src/data/words_with_examples.json`。

## 为什么选择豆包？

- **价格优势**: 0.08元/百万tokens（输入），比其他国内厂商低 95%+
- **中文能力**: 字节跳动出品，中文理解和生成能力优秀
- **响应速度**: 云端 API，响应快，无需本地部署
- **稳定性**: 火山引擎提供企业级服务保障

## 1. 前置条件
- Node.js 18+
- 已获取豆包 API Key（[火山方舟控制台](https://console.volcengine.com/ark)）
- 后端服务已启动（提供 `/api/definitions` 和 `/api/examples`）

## 1.1 如何获取豆包 API Key

### 注册与开通
1. 访问 [火山引擎控制台](https://console.volcengine.com/ark)
2. 注册/登录账号，完成实名认证
3. 进入「API Key 管理」页面
4. 点击「创建 API Key」，生成密钥

### 开通模型服务
1. 在控制台选择「模型推理」→「开通管理」
2. 选择 `doubao-1.5-pro-32k` 或其他模型
3. 完成开通（新用户有免费额度）

### 获取 Endpoint
1. 在「推理接入点」页面获取预置接入点
2. 或创建自定义接入点
3. 默认 Endpoint: `https://ark.cn-beijing.volces.com/api/v3/chat/completions`

## 2. 安装与启动
```bash
npm install
npm run server
```

确认后端已启动：
```bash
curl http://localhost:3001/api/health
```

## 3. 配置环境变量

创建 `.env.local` 文件：
```bash
# 豆包配置
DOUBAO_API_KEY=your_doubao_api_key_here
DOUBAO_MODEL=doubao-1.5-pro-32k
DOUBAO_ENDPOINT=https://ark.cn-beijing.volces.com/api/v3/chat/completions

# 每个单词例句数量
EXAMPLES_PER_WORD=10

# 处理范围（用于分批跑）
START_INDEX=0
LIMIT=50

# 重试次数
RETRY=2
RETRY_DELAY=1500
```

## 4. 运行脚本

### 方式一：使用 npm 命令（推荐）
```bash
npm run enrich:doubao
```

### 方式二：使用环境变量
```bash
START_INDEX=0 LIMIT=50 npm run enrich:doubao
```

### 分批处理示例
处理第 1000 个单词开始的 200 个单词：
```bash
START_INDEX=1000 LIMIT=200 npm run enrich:doubao
```

## 5. 输出结果
- 结果写入：`src/data/words_with_examples.json`
- 日志会输出每个单词的处理结果
- 每个单词包含：
  - 词性（partOfSpeech）
  - 中文释义（meaning）
  - 例句（examples），包含：
    - 英文句子
    - 中文翻译
    - 使用场景
    - 用法说明
    - 词性标注

## 6. 成本估算

以 **10,000 个单词** 为例：
- 每个单词约 200 tokens（词义 + 10 个例句）
- 总计：2,000,000 tokens
- 成本：**约 0.16 元**（几乎免费）

详细价格参考：
- 输入：0.08元/百万tokens
- 输出：约 0.6元/百万tokens
- 新用户有免费额度

## 7. 常见问题

### `fetch failed`
- 确认后端 `npm run server` 正在运行
- 检查 `API_BASE` 是否正确（默认 http://localhost:3001）

### `401 Unauthorized` 或 `未配置豆包 API Key`
- 检查 `.env.local` 文件中的 `DOUBAO_API_KEY` 是否正确
- 确认 API Key 已在火山方舟控制台创建

### `豆包 API 错误: 400`
- 检查模型名称是否正确（如 `doubao-1.5-pro-32k`）
- 确认模型已在控制台开通

### 速度慢
- 减小 `LIMIT` 值，分批处理
- 增加 `RETRY_DELAY` 避免触发限流

## 8. 切换到其他 AI 提供商

### Ollama（本地运行）
```bash
provider=ollama npm run enrich:ollama
```

### DeepSeek
```bash
provider=deepseek npm run enrich:ollama
```

详见 [RUN_ENRICH.md](./RUN_ENRICH.md)

## 9. 相关链接

- [火山方舟控制台](https://console.volcengine.com/ark)
- [豆包 API 文档](https://www.volcengine.com/docs/82379/1978533)
- [模型价格](https://www.volcengine.com/docs/82379/1257988)
- [快速入门](https://www.volcengine.com/docs/82379/1399008)
