#!/bin/bash

# 检查英语单词学习 App 状态

echo "🔍 检查英语单词学习 App 状态"
echo "=================================="
echo ""

# 检查 Ollama 服务
echo "📦 Ollama 服务状态:"
if brew services list | grep ollama | grep -q "started"; then
    echo "  ✅ 运行中"
else
    echo "  ❌ 未运行"
    echo "  💡 启动命令: brew services start ollama"
fi
echo ""

# 检查 API 连接
echo "🌐 Ollama API 连接:"
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "  ✅ 正常"
    echo ""
    echo "📊 已安装的模型:"
    curl -s http://localhost:11434/api/tags | grep -o '"name":"[^"]*"' | cut -d'"' -f4 | while read model; do
        echo "  - $model"
    done
else
    echo "  ❌ 无法连接"
fi
echo ""

# 检查 Node.js
echo "💻 Node.js:"
if command -v node &> /dev/null; then
    echo "  ✅ 已安装: $(node --version)"
    echo "  📍 路径: $(which node)"
else
    echo "  ❌ 未安装"
    echo "  💡 安装命令: brew install node"
fi
echo ""

# 检查项目依赖
echo "📁 项目依赖:"
if [ -d "node_modules" ]; then
    echo "  ✅ 已安装"
else
    echo "  ❌ 未安装"
    echo "  💡 安装命令: npm install"
fi
echo ""

# 检查端口占用
echo "🔌 端口检查 (3000):"
if lsof -i :3000 > /dev/null 2>&1; then
    echo "  ⚠️  端口已被占用"
    echo "  💡 查看占用: lsof -i :3000"
else
    echo "  ✅ 端口可用"
fi
echo ""

echo "=================================="
echo "✨ 状态检查完成！"
echo ""
