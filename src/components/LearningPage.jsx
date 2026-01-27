import { useState, useEffect, useCallback, useRef } from 'react'
import WordCard from './WordCard'
import NavigationControls from './NavigationControls'
import { SettingsManager, MasteredWordsManager } from '../utils/storage'
import { apiProgressManager } from '../utils/apiStorage'
import { loadWordExamples } from '../utils/datasetLoader'
import { getDefinitionsGenerator } from '../utils/wordDefinitionsGenerator'
import { STORAGE_KEYS } from '../types/storage.types'
import { playWordAudio } from '../utils/speech'
import '../styles/LearningPage.css'

const LearningPage = ({ onBackToHome }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [todayStudied, setTodayStudied] = useState(0)
  const [stats, setStats] = useState(null)
  const [showStats, setShowStats] = useState(false)
  const [currentWord, setCurrentWord] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [totalWords, setTotalWords] = useState(0)
  const [wordList, setWordList] = useState([])
  const [hasStarted, setHasStarted] = useState(false)
  const [showAudioTest, setShowAudioTest] = useState(false) // 音频测试按钮
  const prefetchingRef = useRef(new Set())
  const wordCardContainerRef = useRef(null)

  // 过滤已掌握的单词
  const filterWordList = useCallback((allWords) => {
    const masteredWordIds = MasteredWordsManager.getMasteredWords().map(item => item.id)
    return allWords.filter(word => !masteredWordIds.includes(word.id))
  }, [])

  // 初始化数据
  useEffect(() => {
    const init = async () => {
      // 先加载服务器端进度
      await apiProgressManager.loadProgress()

      // 检查是否是新的一天
      apiProgressManager.checkNewDay()

      const allRecords = await loadWordExamples()
      const filteredRecords = filterWordList(allRecords)
      setWordList(filteredRecords)
      setTotalWords(filteredRecords.length)

      // 加载进度
      const savedIndex = apiProgressManager.getCurrentIndex()
      const safeIndex = Math.min(savedIndex, Math.max(filteredRecords.length - 1, 0))
      apiProgressManager.setCurrentIndex(safeIndex, filteredRecords.length)
      setCurrentIndex(safeIndex)
      setTodayStudied(apiProgressManager.getTodayStudied())
      setStats(apiProgressManager.getStatistics())
      setCurrentWord(filteredRecords[safeIndex] || null)
      setIsLoading(false)
    }

    init()
  }, [filterWordList])

  useEffect(() => {
    if (wordCardContainerRef.current) {
      wordCardContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [currentIndex])

  useEffect(() => {
    if (!wordList.length) return

    const start = currentIndex + 1
    const end = Math.min(start + 10, wordList.length)
    const nextWords = wordList.slice(start, end)

    if (!nextWords.length) return

    const prefetch = async () => {
      const settings = SettingsManager.getSettings()
      const generator = getDefinitionsGenerator(settings.llmProvider)
      generator.setProvider(settings.llmProvider)
      if (settings.llmProvider === 'ollama') {
        generator.setOllamaConfig(settings.ollamaEndpoint, settings.ollamaModel)
      }

      for (const item of nextWords) {
        await prefetchDefinitions(item, generator)
        await prefetchExamples(item, settings)
      }
    }

    prefetch()
  }, [currentIndex, wordList])

  const prefetchDefinitions = async (item, generator) => {
    if (!item || item.definitions?.length) return

    const cacheKey = `def:${item.word}`
    if (prefetchingRef.current.has(cacheKey)) return
    prefetchingRef.current.add(cacheKey)

    try {
      const cachedData = localStorage.getItem(STORAGE_KEYS.DEFINITIONS_CACHE)
      if (cachedData) {
        const cache = JSON.parse(cachedData)
        if (cache[item.word]) {
          return
        }
      }

      const result = await generator.generateDefinitions(item.word)

      const cache = JSON.parse(localStorage.getItem(STORAGE_KEYS.DEFINITIONS_CACHE) || '{}')
      cache[item.word] = {
        definitions: result.definitions,
        phonetic: result.phonetic,
        generatedAt: new Date().toISOString()
      }
      localStorage.setItem(STORAGE_KEYS.DEFINITIONS_CACHE, JSON.stringify(cache))
    } catch (error) {
      console.error('预取释义失败:', error)
    } finally {
      prefetchingRef.current.delete(cacheKey)
    }
  }

  const prefetchExamples = async (item, settings) => {
    if (!item) return
    if (Array.isArray(item.examples) && item.examples.some((ex) => ex?.sentence)) return

    const cacheKey = `ex:${item.id}`
    if (prefetchingRef.current.has(cacheKey)) return
    prefetchingRef.current.add(cacheKey)

    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_EXAMPLES)
      if (saved) {
        const customExamples = JSON.parse(saved)
        if (customExamples[item.id]?.examples?.length) {
          return
        }
      }

      const response = await fetch('/api/examples', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          word: item.word,
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
        })
      })

      if (!response.ok) return

      const data = await response.json()
      if (!Array.isArray(data?.examples) || data.examples.length === 0) return

      const savedCache = localStorage.getItem(STORAGE_KEYS.CUSTOM_EXAMPLES) || '{}'
      const customExamples = JSON.parse(savedCache)
      customExamples[item.id] = {
        examples: data.examples,
        generatedAt: new Date().toISOString()
      }
      localStorage.setItem(STORAGE_KEYS.CUSTOM_EXAMPLES, JSON.stringify(customExamples))
    } catch (error) {
      console.error('预取例句失败:', error)
    } finally {
      prefetchingRef.current.delete(cacheKey)
    }
  }


  // 处理下一个单词
  const handleNext = useCallback(() => {
    if (currentIndex < totalWords - 1) {
      const newIndex = currentIndex + 1
      setCurrentIndex(newIndex)
      apiProgressManager.setCurrentIndex(newIndex, totalWords)
      apiProgressManager.incrementTodayStudied()
      setTodayStudied(prev => prev + 1)
      setCurrentWord(wordList[newIndex] || null)
    } else {
      // 完成一轮，从头开始
      setCurrentIndex(0)
      apiProgressManager.setCurrentIndex(0, totalWords)
      setCurrentWord(wordList[0] || null)
    }
    // 更新统计
    setStats(apiProgressManager.getStatistics())
  }, [currentIndex, totalWords, wordList])

  // 处理上一个单词
  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1
      setCurrentIndex(newIndex)
      apiProgressManager.setCurrentIndex(newIndex, totalWords)
      setCurrentWord(wordList[newIndex] || null)
    }
    setStats(apiProgressManager.getStatistics())
  }, [currentIndex, totalWords, wordList])

  // 键盘快捷键
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'ArrowRight') {
        handleNext()
      } else if (event.key === 'ArrowLeft') {
        handlePrevious()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleNext, handlePrevious])

  // 刷新收藏状态
  const handleFavorite = () => {
    // 强制重新渲染以更新收藏图标
    setCurrentWord(prev => (prev ? { ...prev } : prev))
  }

  // 处理已掌握单词
  const handleDone = useCallback((wordId) => {
    // 从当前词库中移除已掌握的单词
    const newWordList = wordList.filter(word => word.id !== wordId)
    setWordList(newWordList)
    setTotalWords(newWordList.length)

    // 调整当前索引
    if (currentIndex >= newWordList.length && newWordList.length > 0) {
      const newIndex = newWordList.length - 1
      setCurrentIndex(newIndex)
      apiProgressManager.setCurrentIndex(newIndex, newWordList.length)
      setCurrentWord(newWordList[newIndex] || null)
    } else if (newWordList.length > 0) {
      setCurrentWord(newWordList[currentIndex] || newWordList[0])
    } else {
      // 如果没有单词了，显示完成状态
      setCurrentWord(null)
    }

    // 更新统计
    setStats(apiProgressManager.getStatistics())
  }, [wordList, currentIndex])

  // 开始学习（触发自动播放）
  const handleStartLearning = async () => {
    // 标记用户已交互（在 sessionStorage 中）
    sessionStorage.setItem('userHasInteracted', 'true')
    setHasStarted(true)
  }

  // 切换统计显示
  const toggleStats = () => {
    setShowStats(!showStats)
  }

  // 测试音频播放
  const testAudio = async () => {
    console.log('=== 音频测试开始 ===')
    console.log('User Agent:', navigator.userAgent.substring(0, 100))

    const ua = navigator.userAgent || ''
    const isXiaomi = /xiaomi|redmi|mi\s+/i.test(ua) ||
                     ua.includes('MIUI') ||
                     ua.includes('MiuiBrowser') ||
                     ua.includes('XiaoMi')

    console.log('设备检测:', isXiaomi ? '小米设备' : '非小米设备')

    try {
      // 直接使用 Web Audio API 测试
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) {
        alert('❌ 浏览器不支持 Web Audio API')
        return
      }

      const ctx = new AudioContext()
      console.log('AudioContext 状态:', ctx.state)

      if (ctx.state === 'suspended') {
        await ctx.resume()
        console.log('AudioContext 已恢复:', ctx.state)
      }

      // 播放测试音序列
      const now = ctx.currentTime
      const frequencies = [261, 329, 392, 523] // C E G C (和弦)

      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.frequency.setValueAtTime(freq, now + i * 0.15)
        osc.type = 'sine'

        gain.gain.setValueAtTime(0, now + i * 0.15)
        gain.gain.linearRampToValueAtTime(0.3, now + i * 0.15 + 0.02)
        gain.gain.setValueAtTime(0.3, now + i * 0.15 + 0.1)
        gain.gain.linearRampToValueAtTime(0, now + i * 0.15 + 0.15)

        osc.start(now + i * 0.15)
        osc.stop(now + i * 0.15 + 0.15)
      })

      // 振动
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100])
        console.log('✅ 已触发振动')
      }

      console.log('✅ 音频测试已播放 4 个音调')

      setTimeout(() => {
        if (ctx.state !== 'closed') {
          ctx.close()
        }
      }, 1000)

      alert(`✅ 音频测试完成！\n\n${isXiaomi ? '检测到小米设备' : '非小米设备'}\n\n应该听到 4 个音调 + 感觉到振动\n\n如果有声音，说明音频功能正常\n请在单词卡片中点击发音按钮测试`)
    } catch (error) {
      console.error('❌ 音频测试失败:', error)
      alert('❌ 音频测试失败: ' + error.message)
    }

    console.log('=== 音频测试结束 ===')
  }

  if (isLoading) {
    return (
      <div className="learning-page">
        <div className="loading">加载中...</div>
      </div>
    )
  }

  if (!currentWord || wordList.length === 0) {
    return (
      <div className="learning-page">
        <div className="completion-message">
          <h2>🎉 恭喜！</h2>
          <p>您已掌握所有当前单词</p>
          <p>已掌握单词数：{MasteredWordsManager.getMasteredCount()}</p>
          <button className="back-btn" onClick={onBackToHome}>
            返回首页
          </button>
        </div>
      </div>
    )
  }

  // 如果还没开始学习，显示开始遮罩层
  if (!hasStarted) {
    return (
      <div className="learning-page">
        <div className="start-overlay">
          <div className="start-content">
            <h2>🎧 准备开始学习</h2>
            <p>点击下方按钮开始，系统将自动朗读单词</p>
            <button className="start-btn" onClick={handleStartLearning}>
              🚀 开始学习
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="learning-page">
      {/* 顶部状态栏 */}
      <div className="top-bar">
        <div className="top-bar-content">
          <button
            className="back-btn"
            onClick={onBackToHome}
            title="返回首页"
          >
            ← 返回
          </button>
          <div className="today-progress">
            <span className="progress-label">今日学习</span>
            <span className="progress-count">
              {todayStudied} / {(stats?.todayTarget || 1000)}
            </span>
          </div>
          <button
            className="stats-toggle-btn"
            onClick={testAudio}
            title="测试音频播放"
            style={{ marginRight: '8px' }}
          >
            🔊
          </button>
          <button
            className="stats-toggle-btn"
            onClick={toggleStats}
            title="学习统计"
          >
            📊
          </button>
        </div>
      </div>

      {/* 统计信息弹窗 */}
      {showStats && stats && (
        <div className="stats-modal" onClick={toggleStats}>
          <div className="stats-content" onClick={(e) => e.stopPropagation()}>
            <h2>学习统计</h2>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">当前单词</span>
                <span className="stat-value">{stats.currentIndex + 1} / {stats.totalWords}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">今日学习</span>
                <span className="stat-value">{stats.todayStudied} / {stats.todayTarget}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">完成轮数</span>
                <span className="stat-value">{stats.completedRounds}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">学习天数</span>
                <span className="stat-value">{stats.totalStudyDays} 天</span>
              </div>
            </div>
            <div className="stats-actions">
              <button
                className="reset-btn"
                onClick={() => {
                  if (window.confirm('确定要重置所有学习进度吗？')) {
                    apiProgressManager.resetProgress()
                    setCurrentIndex(0)
                    setTodayStudied(0)
                    setStats(apiProgressManager.getStatistics())
                    setShowStats(false)
                  }
                }}
              >
                重置进度
              </button>
              <button className="close-btn" onClick={toggleStats}>
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 单词卡片 */}
      <div className="word-card-container" ref={wordCardContainerRef}>
        <WordCard word={currentWord} onFavorite={handleFavorite} onDone={handleDone} />
      </div>

      {/* 导航控制 */}
      <NavigationControls
        currentIndex={currentIndex}
        totalWords={totalWords}
        onPrevious={handlePrevious}
        onNext={handleNext}
        canGoPrevious={currentIndex > 0}
        canGoNext={currentIndex < totalWords - 1}
      />
    </div>
  )
}

export default LearningPage
