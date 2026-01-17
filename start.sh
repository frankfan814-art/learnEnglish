#!/bin/bash

# 英语单词学习 App - 快速启动脚本

echo "🚀 正在启动英语单词学习 App..."
echo ""

# 检查 Ollama 服务
echo "📦 检查 Ollama 服务状态..."
if brew services list | grep ollama | grep -q "started"; then
    echo "✅ Ollama 服务已运行"
else
    echo "⚠️  Ollama 服务未运行，正在启动..."
    brew services start ollama
    sleep 3
    echo "✅ Ollama 服务已启动"
fi

# 检查 Node.js
echo ""
echo "📦 检查 Node.js..."
if command -v node &> /dev/null; then
    echo "✅ Node.js 已安装: $(node --version)"
else
    echo "❌ Node.js 未安装，请先安装 Node.js"
    echo "   建议使用: brew install node"
    exit 1
fi

# 检查依赖
echo ""
echo "📦 检查项目依赖..."
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装依赖..."
    npm install
    echo "✅ 依赖安装完成"
else
    echo "✅ 依赖已安装"
fi

# 启动开发服务器
echo ""
echo "🚀 启动开发服务器..."
echo ""
echo "==================================="
echo "  应用即将在浏览器中打开"
echo "  访问地址: http://localhost:3000"
echo "==================================="
echo ""

npm run dev
