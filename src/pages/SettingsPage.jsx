import { useState, useEffect, useRef } from 'react'
import { SettingsManager, downloadProgressFile, readProgressFile } from '../utils/storage'
import { apiSettingsManager, apiProgressManager } from '../utils/apiStorage'
import { getOllamaClient } from '../utils/ollama'
import '../styles/SettingsPage.css'

const SettingsPage = ({ onBack }) => {
  const [settings, setSettings] = useState({
    dailyTarget: 1000,
    voiceType: 'US',
    autoPlay: true,
    showPhonetic: true,
    showExamples: true,
    theme: 'auto',
    fontSize: 'medium',
    llmProvider: 'deepseek',
    deepSeekApiKey: '',
    deepSeekEndpoint: 'https://api.deepseek.com/v1/chat/completions',
    deepSeekModel: 'deepseek-chat',
    ollamaModel: 'qwen2.5:3b',
    ollamaEndpoint: 'http://localhost:11434'
  })
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState(null)
  const [availableModels, setAvailableModels] = useState([])
  const fileInputRef = useRef(null)

  useEffect(() => {
    loadSettings()
  }, [])

  useEffect(() => {
    if (settings.llmProvider === 'ollama') {
      checkOllamaConnection()
    }
  }, [settings.llmProvider])

  const loadSettings = async () => {
    const saved = SettingsManager.getSettings()
    const apiSettings = await apiSettingsManager.getSettings()
    setSettings(prev => ({ ...prev, ...saved, ...apiSettings }))
  }

  const checkOllamaConnection = async () => {
    const saved = SettingsManager.getSettings()
    const client = getOllamaClient()

    if (saved.ollamaEndpoint) {
      client.setEndpoint(saved.ollamaEndpoint)
    }

    const connected = await client.checkConnection()
    setConnectionStatus(connected)

    if (connected) {
      const models = await client.getModels()
      setAvailableModels(models)
    }
  }

  const handleTestConnection = async () => {
    setTestingConnection(true)
    setConnectionStatus(null)

    try {
      const client = getOllamaClient()
      client.setEndpoint(settings.ollamaEndpoint)

      const connected = await client.checkConnection()
      setConnectionStatus(connected)

      if (connected) {
        const models = await client.getModels()
        setAvailableModels(models)
        alert('连接成功！')
      } else {
        alert('连接失败，请检查 Ollama 是否运行')
      }
    } catch (error) {
      setConnectionStatus(false)
      alert('连接失败：' + error.message)
    } finally {
      setTestingConnection(false)
    }
  }

  const handleSave = async () => {
    SettingsManager.saveSettings(settings)
    await apiSettingsManager.saveSettings(settings)

    // 更新每日目标
    apiProgressManager.progress.today_target = settings.dailyTarget
    await apiProgressManager.saveProgress(apiProgressManager.progress)

    alert('设置已保存！')
    onBack && onBack()
  }

  const handleReset = () => {
    if (window.confirm('确定要重置所有设置吗？')) {
      localStorage.removeItem('english_app_settings')
      loadSettings()
      alert('设置已重置')
    }
  }

  // 导出进度
  const handleExportProgress = () => {
    const result = downloadProgressFile()
    if (result.success) {
      alert(result.message)
    } else {
      alert(result.message)
    }
  }

  // 导入进度 - 触发文件选择
  const handleImportProgress = () => {
    fileInputRef.current?.click()
  }

  // 导入进度 - 处理文件选择
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const result = await readProgressFile(file)
      if (result.success) {
        alert(result.message + '\n页面将刷新以加载新进度...')
        setTimeout(() => window.location.reload(), 1000)
      } else {
        alert(result.message)
      }
    } catch (error) {
      alert('导入失败: ' + error.message)
    }

    // 清空文件选择，允许重复选择同一文件
    e.target.value = ''
  }

  const handleInputChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="settings-page">
      <div className="settings-container">
        {/* 头部 */}
        <div className="settings-header">
          <button className="back-btn" onClick={onBack}>
            ← 返回
          </button>
          <h1>⚙️ 设置</h1>
          <button 
            className="debug-btn" 
            onClick={() => window.openDebugPanel?.()}
            title="打开调试面板 (Ctrl+Shift+D)"
          >
            🔧
          </button>
        </div>

        {/* 学习设置 */}
        <div className="settings-section">
          <h2>📖 学习设置</h2>

          <div className="setting-item">
            <label className="setting-label">
              每日学习目标
            </label>
            <div className="setting-control">
              <input
                type="number"
                value={settings.dailyTarget}
                onChange={(e) => handleInputChange('dailyTarget', parseInt(e.target.value))}
                min="10"
                max="2000"
                step="10"
              />
              <span>个单词/天</span>
            </div>
          </div>
        </div>

        {/* 发音设置 */}
        <div className="settings-section">
          <h2>🔊 发音设置</h2>

          <div className="setting-item">
            <label className="setting-label">
              发音类型
            </label>
            <div className="setting-control">
              <select
                value={settings.voiceType}
                onChange={(e) => handleInputChange('voiceType', e.target.value)}
              >
                <option value="US">美式发音</option>
                <option value="UK">英式发音</option>
              </select>
            </div>
          </div>

          <div className="setting-item">
            <label className="setting-label">
              自动播放发音
            </label>
            <div className="setting-control">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.autoPlay}
                  onChange={(e) => handleInputChange('autoPlay', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* 显示设置 */}
        <div className="settings-section">
          <h2>🎨 显示设置</h2>

          <div className="setting-item">
            <label className="setting-label">
              显示音标
            </label>
            <div className="setting-control">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.showPhonetic}
                  onChange={(e) => handleInputChange('showPhonetic', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          <div className="setting-item">
            <label className="setting-label">
              显示例句
            </label>
            <div className="setting-control">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.showExamples}
                  onChange={(e) => handleInputChange('showExamples', e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          <div className="setting-item">
            <label className="setting-label">
              字体大小
            </label>
            <div className="setting-control">
              <select
                value={settings.fontSize}
                onChange={(e) => handleInputChange('fontSize', e.target.value)}
              >
                <option value="small">小</option>
                <option value="medium">中</option>
                <option value="large">大</option>
              </select>
            </div>
          </div>

          <div className="setting-item">
            <label className="setting-label">
              主题
            </label>
            <div className="setting-control">
              <select
                value={settings.theme}
                onChange={(e) => handleInputChange('theme', e.target.value)}
              >
                <option value="auto">自动</option>
                <option value="light">浅色</option>
                <option value="dark">深色</option>
              </select>
            </div>
          </div>
        </div>

        {/* AI 设置 */}
        <div className="settings-section">
          <h2>🤖 AI 功能设置</h2>

          <div className="setting-item">
            <label className="setting-label">
              模型提供方
            </label>
            <div className="setting-control">
              <select
                value={settings.llmProvider}
                onChange={(e) => handleInputChange('llmProvider', e.target.value)}
              >
                <option value="deepseek">DeepSeek（云端）</option>
                <option value="ollama">Ollama（本地）</option>
              </select>
            </div>
          </div>

          {settings.llmProvider === 'deepseek' && (
            <>
              <div className="setting-item">
                <label className="setting-label">
                  DeepSeek API Key
                </label>
                <div className="setting-control">
                  <input
                    type="password"
                    value={settings.deepSeekApiKey}
                    onChange={(e) => handleInputChange('deepSeekApiKey', e.target.value)}
                    placeholder="sk-***"
                  />
                </div>
              </div>

              <div className="setting-item">
                <label className="setting-label">
                  DeepSeek Endpoint
                </label>
                <div className="setting-control">
                  <input
                    type="text"
                    value={settings.deepSeekEndpoint}
                    onChange={(e) => handleInputChange('deepSeekEndpoint', e.target.value)}
                    placeholder="https://api.deepseek.com/v1/chat/completions"
                  />
                </div>
              </div>

              <div className="setting-item">
                <label className="setting-label">
                  DeepSeek 模型
                </label>
                <div className="setting-control">
                  <input
                    type="text"
                    value={settings.deepSeekModel}
                    onChange={(e) => handleInputChange('deepSeekModel', e.target.value)}
                    placeholder="deepseek-chat"
                  />
                </div>
              </div>
            </>
          )}

          {settings.llmProvider === 'ollama' && (
            <>
              <div className="setting-item">
                <label className="setting-label">
                  Ollama API 端点
                </label>
                <div className="setting-control">
                  <input
                    type="text"
                    value={settings.ollamaEndpoint}
                    onChange={(e) => handleInputChange('ollamaEndpoint', e.target.value)}
                    placeholder="http://localhost:11434"
                  />
                </div>
              </div>

              <div className="setting-item">
                <label className="setting-label">
                  模型
                </label>
                <div className="setting-control">
                  <select
                    value={settings.ollamaModel}
                    onChange={(e) => handleInputChange('ollamaModel', e.target.value)}
                  >
                    <option value="qwen2.5:3b">qwen2.5:3b (推荐)</option>
                    <option value="qwen2.5:7b">qwen2.5:7b</option>
                    <option value="llama3.1:8b">llama3.1:8b</option>
                    <option value="mistral:7b">mistral:7b</option>
                    {availableModels.filter(m =>
                      !['qwen2.5:3b', 'qwen2.5:7b', 'llama3.1:8b', 'mistral:7b'].includes(m)
                    ).map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="setting-item">
                <button
                  className="test-connection-btn"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                >
                  {testingConnection ? '测试中...' : '🔗 测试连接'}
                </button>

                {connectionStatus !== null && (
                  <div className={`connection-status ${connectionStatus ? 'success' : 'error'}`}>
                    {connectionStatus ? '✅ 已连接' : '❌ 连接失败'}
                  </div>
                )}
              </div>

              <div className="setting-help">
                <p>💡 使用 AI 生成例句需要：</p>
                <ol>
                  <li>安装 <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer">Ollama</a></li>
                  <li>运行: <code>ollama pull qwen2.5:3b</code></li>
                  <li>启动 Ollama 服务</li>
                </ol>
              </div>
            </>
          )}
        </div>

        {/* 数据管理 */}
        <div className="settings-section">
          <h2>💾 数据管理</h2>

          <div className="setting-item">
            <label className="setting-label">
              导出学习进度
            </label>
            <div className="setting-control">
              <button className="action-btn" onClick={handleExportProgress}>
                📥 导出进度文件
              </button>
            </div>
          </div>

          <div className="setting-item">
            <label className="setting-label">
              导入学习进度
            </label>
            <div className="setting-control">
              <button className="action-btn" onClick={handleImportProgress}>
                📤 导入进度文件
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          <div className="setting-help">
            <p>💡 导出/导入功能可以备份和恢复你的学习进度，包括：</p>
            <ul>
              <li>当前学习位置</li>
              <li>收藏的单词</li>
              <li>个人设置</li>
            </ul>
            <p>建议定期导出备份，防止数据丢失。</p>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="settings-actions">
          <button className="save-btn" onClick={handleSave}>
            💾 保存设置
          </button>
          <button className="reset-btn" onClick={handleReset}>
            🔄 重置设置
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
