import { useState } from 'react'
import { SettingsManager } from '../utils/storage'
import { STORAGE_KEYS } from '../types/storage.types'
import '../styles/AIGenerateButton.css'

const AIGenerateButton = ({ word, onExamplesGenerated, isAutoGenerating, layout = 'block' }) => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)
  const isBusy = isGenerating || isAutoGenerating

  const generateWithBackend = async (word, settings) => {
    const controller = new AbortController()
    const timeout = settings.llmProvider === 'ollama' ? 180000 : 60000
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch('/api/examples', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          word,
          count: 10,
          provider: settings.llmProvider,
          deepseek: {
            apiKey: settings.deepSeekApiKey,
            endpoint: settings.deepSeekEndpoint,
            model: settings.deepSeekModel
          },
          ollama: {
            endpoint: settings.ollamaEndpoint,
            model: settings.ollamaModel
          }
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`后端错误: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      if (data?.error) {
        throw new Error(data.error)
      }

      return Array.isArray(data?.examples) ? data.examples : []
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(
          settings.llmProvider === 'ollama'
            ? '请求超时，请稍后重试（Ollama 本地模型可能需要更久）'
            : '请求超时，请稍后重试（生成 10 个例句需要 5-10 秒）'
        )
      }
      throw error
    }
  }

  // 生成例句
  const handleGenerate = async () => {
    if (!word || isGenerating) return

    setIsGenerating(true)
    setError(null)

    try {
      const settings = SettingsManager.getSettings()
      const examples = await generateWithBackend(word.word, settings)

      if (examples.length === 0) {
        throw new Error('未能生成例句，请重试')
      }

      // 保存自定义生成的例句
      saveCustomExamples(word.id, examples)

      console.log('AIGenerateButton: 准备触发回调，例句数量:', examples.length)

      // 触发回调
      if (onExamplesGenerated) {
        console.log('AIGenerateButton: 回调函数存在，正在调用...')
        onExamplesGenerated(examples)
        console.log('AIGenerateButton: 回调调用完成')
      } else {
        console.log('AIGenerateButton: 警告 - 回调函数不存在！')
      }

    } catch (err) {
      setError(err.message || '生成失败')
      console.error('AI 生成例句失败:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  // 保存自定义例句
  const saveCustomExamples = (wordId, examples) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_EXAMPLES) || '{}'
      const customExamples = JSON.parse(saved)
      customExamples[wordId] = {
        examples,
        generatedAt: new Date().toISOString()
      }
      localStorage.setItem(STORAGE_KEYS.CUSTOM_EXAMPLES, JSON.stringify(customExamples))
    } catch (error) {
      console.error('保存自定义例句失败:', error)
    }
  }

  return (
    <div className={`ai-generate-container ${layout === 'inline' ? 'inline' : ''}`}>
      <button
        className={`ai-generate-btn ${isBusy ? 'generating' : ''} ${layout === 'inline' ? 'inline' : ''}`}
        onClick={handleGenerate}
        disabled={isBusy || !word}
        title="点击使用 AI 生成例句"
      >
        {isBusy ? (
          <>
            <span className="spinner"></span>
            生成中...
          </>
        ) : (
          <>
            🤖 AI 生成例句
          </>
        )}
      </button>

      {error && (
        <div className="ai-error">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
          <button
            className="error-close"
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}

export default AIGenerateButton
