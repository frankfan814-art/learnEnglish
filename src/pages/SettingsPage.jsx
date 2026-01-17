import { useState, useEffect } from 'react'
import { SettingsManager, progressManager } from '../utils/storage'
import { getOllamaClient } from '../utils/ollama'
import '../styles/SettingsPage.css'

const SettingsPage = ({ onBack }) => {
  const [settings, setSettings] = useState({
    dailyTarget: 1000,
    voiceType: 'US',
    autoPlay: false,
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

  useEffect(() => {
    loadSettings()
  }, [])

  useEffect(() => {
    if (settings.llmProvider === 'ollama') {
      checkOllamaConnection()
    }
  }, [settings.llmProvider])

  const loadSettings = () => {
    const saved = SettingsManager.getSettings()
    setSettings(prev => ({ ...prev, ...saved }))
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

  const handleSave = () => {
    SettingsManager.saveSettings(settings)

    // 更新每日目标
    progressManager.progress.todayTarget = settings.dailyTarget
    progressManager.saveProgress()

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
