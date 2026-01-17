# Ollama 安装和使用指南

## 当前状态

✅ Ollama 已安装
✅ Ollama 服务已启动
⏳ qwen2.5:3b 模型正在下载中（约 1.9GB，预计 15-20 分钟）

## 安装步骤回顾

### 1. 安装 Ollama
```bash
brew install ollama
```

### 2. 启动 Ollama 服务
```bash
brew services start ollama
```

### 3. 下载模型
```bash
ollama pull qwen2.5:3b
```

### 4. 验证安装
```bash
# 查看已安装的模型
ollama list

# 测试模型
ollama run qwen2.5:3b "Hello, how are you?"
```

## 在应用中使用 Ollama

### 配置步骤

1. **确保 Ollama 服务运行**
   ```bash
   brew services start ollama
   ```

2. **在应用中配置**
   - 打开应用
   - 进入"设置"页面
   - 配置 Ollama API 端点（默认：`http://localhost:11434`）
   - 选择模型：`qwen2.5:3b`
   - 点击"测试连接"验证

3. **使用 AI 生成例句**
   - 在学习页面浏览单词卡片
   - 点击"AI 生成例句"按钮
   - 等待生成完成（通常 5-15 秒）
   - 查看新生成的例句

## 常用命令

### 服务管理
```bash
# 启动服务
brew services start ollama

# 停止服务
brew services stop ollama

# 重启服务
brew services restart ollama

# 查看服务状态
brew services list
```

### 模型管理
```bash
# 列出已安装的模型
ollama list

# 下载新模型
ollama pull <模型名称>

# 运行模型（交互式）
ollama run <模型名称>

# 删除模型
ollama rm <模型名称>

# 查看模型信息
ollama show <模型名称>
```

### 推荐模型

| 模型 | 大小 | 特点 | 适用场景 |
|------|------|------|----------|
| qwen2.5:3b | ~1.9GB | 中英双语，轻量快速 | 日常使用，推荐 ✅ |
| qwen2.5:7b | ~4.3GB | 中英双语，质量更高 | 设备性能较好时 |
| llama3.1:8b | ~4.7GB | 英文流畅 | 纯英文例句生成 |
| mistral:7b | ~4.1GB | 英文例句质量高 | 学术/正式场景 |

## API 使用

### 基本请求格式
```bash
curl http://localhost:11434/api/generate -d '{
  "model": "qwen2.5:3b",
  "prompt": "Why is the sky blue?",
  "stream": false
}'
```

### 获取模型列表
```bash
curl http://localhost:11434/api/tags
```

## 故障排除

### 问题：无法连接到 Ollama
**解决方案：**
```bash
# 检查服务是否运行
brew services list

# 重启服务
brew services restart ollama

# 检查端口是否被占用
lsof -i :11434
```

### 问题：生成速度慢
**可能原因：**
- 电脑性能不足
- 模型太大
- 首次运行需要加载模型

**解决方案：**
- 使用更小的模型（qwen2.5:3b）
- 关闭其他占用资源的程序
- 使用更快的设备

### 问题：生成质量不理想
**解决方案：**
- 尝试更大的模型（qwen2.5:7b）
- 在设置中调整提示词参数
- 手动编辑提示词

## 系统要求

### 最低配置
- CPU: Apple M1 或 Intel Core i5+
- RAM: 8GB
- 存储: 10GB 可用空间

### 推荐配置
- CPU: Apple M2/M3 或 Intel Core i7+
- RAM: 16GB+
- 存储: 20GB+ 可用空间

## 进阶配置

### 自定义端点
如果需要使用远程 Ollama 服务：
```
http://your-server-ip:11434
```

### 环境变量
```bash
# 设置模型缓存路径
export OLLAMA_MODELS=/path/to/models

# 设置并发请求数
export OLLAMA_NUM_PARALLEL=2

# 设置 GPU 图层（如果有 GPU）
export OLLAMA_GPU_LAYERS=32
```

## 相关链接

- [Ollama 官网](https://ollama.ai)
- [Ollama GitHub](https://github.com/ollama/ollama)
- [模型库](https://ollama.ai/library)
- [API 文档](https://github.com/ollama/ollama/blob/main/docs/api.md)

---

**提示：** 模型下载完成后，建议先测试一下功能是否正常，然后再开始正式使用。
