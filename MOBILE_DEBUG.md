# 📱 移动端调试指南

本项目已集成多种移动端调试工具，让你可以在手机上查看控制台信息和调试语音功能。

## 🎯 快速开始

### 开发环境
```bash
npm run dev
```
访问 http://localhost:3000，vConsole 会自动加载

### 生产环境
```bash
npm run build && npm run preview
```
然后使用以下任一方式启用调试：

---

## 🛠️ 调试工具

### 1. vConsole (推荐)
专业的移动端调试面板，功能最完整。

**启用方式：**
- 🔄 **开发环境**：自动加载
- 📱 **生产环境**：
  - URL: `http://your-app.com/?debug=true`
  - 连续点击页面标题 **5次**
  - 控制台: `localStorage.setItem('app_debug_enabled', 'true')`

**功能特性：**
- ✅ 完整的 Console (log/error/warn/info)
- 🌐 Network 请求监控  
- 🧪 Element 元素检查器
- 💾 Storage 本地存储查看
- 🔊 **语音测试插件**（内置）
- 📤 **系统信息显示**（内置）

---

### 2. SimpleDebug (轻量备选)
简单日志显示，当 vConsole 加载失败时自动启用。

**快捷键：** `Ctrl+Shift+S`

---

### 3. DebugPanel (高级调试)
详细的系统信息和错误追踪面板。

**快捷键：** `Ctrl+Shift+D`

---

## 🔧 快捷键汇总

| 快捷键 | 功能 | 平台 |
|---------|------|------|
| `Ctrl+Shift+D` | 切换高级调试面板 | Windows/Linux |
| `Cmd+Shift+D` | 切换高级调试面板 | Mac |
| `Ctrl+Shift+S` | 切换简单日志 | Windows/Linux |
| `Cmd+Shift+S` | 切换简单日志 | Mac |
| `Ctrl+Shift+R` | 强制刷新页面 | Windows/Linux |
| `Cmd+Shift+R` | 强制刷新页面 | Mac |

---

## 🎤 语音功能调试

### 使用 vConsole 语音测试
1. 打开 vConsole（自动显示在右下角）
2. 点击 "System" 标签
3. 找到 "Voice Test" 插件
4. 输入测试文本点击"测试语音"

### 使用调试面板
1. 通过快捷键或设置按钮打开调试面板
2. 点击 "🔊 测试语音"
3. 查看 "📱 系统信息"

### 调试信息包含
- 🎤 Web Speech API 支持状态
- 🔊 可用语音数量和列表
- 🧪 AudioContext 状态
- ❌ 详细错误信息和堆栈
- 📱 设备和浏览器信息

---

## 📋 常见问题排查

### 1. vConsole 没有显示
- 确认 URL 参数：`?debug=true`
- 尝试连续点击标题 5 次
- 检查控制台是否有错误信息

### 2. 语音播放无声音
- 在 vConsole 中查看 "Voice Test" 测试结果
- 检查系统音量和静音状态
- 查看浏览器权限设置

### 3. 看不到错误信息
- 使用 SimpleDebug：`Ctrl+Shift+S`
- 检查 Network 面板的 TTS 请求
- 查看控制台是否有初始化错误

---

## 🔍 开发者技巧

### 添加自定义调试代码
```javascript
// 在组件中添加调试信息
console.log('🎉 组件初始化完成')
console.error('❌ 错误详情', { data: errorData })

// 使用调试管理器
import debugManager from './utils/debugManager'
debugManager.testVoice('Hello world')
```

### 生产环境调试
```javascript
// 临时启用调试
window.openDebugPanel?.()
window.openSimpleDebug?.()

// 或直接操作
localStorage.setItem('app_debug_enabled', 'true')
location.reload()
```

---

## 📱 移动端测试建议

1. **iOS Safari**：vConsole 兼容性最佳
2. **Android Chrome**：功能完整，支持所有插件
3. **微信/QQ 内置浏览器**：可能需要备用调试方案
4. **混合开发**：可以在 WebView 中正常使用

现在你可以在任何移动设备上像桌面开发者工具一样调试了！🎉