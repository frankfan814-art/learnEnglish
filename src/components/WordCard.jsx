import { useState, useEffect, useRef } from 'react'
import { playWordAudio, playSentenceAudio } from '../utils/speech'
import { FavoritesManager, SettingsManager } from '../utils/storage'
import { STORAGE_KEYS } from '../types/storage.types'
import AIGenerateButton from './AIGenerateButton'
import '../styles/WordCard.css'

const WordCard = ({ word, onFavorite }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentWord, setCurrentWord] = useState(word)
  const [showDetails, setShowDetails] = useState(true)
  const [isLoadingDefinitions, setIsLoadingDefinitions] = useState(false)
  const [isAutoGeneratingExamples, setIsAutoGeneratingExamples] = useState(false)
  const [hasUserInteracted, setHasUserInteracted] = useState(false)
  const attemptedAutoGenerate = useRef(new Set())
  const isFavorite = FavoritesManager.isFavorite(word.id)

  const hasLocalExamples = (entry) => {
    return Array.isArray(entry?.examples) && entry.examples.some((ex) => ex?.sentence)
  }

  // 加载自定义生成的例句
  useEffect(() => {
    const init = async () => {
      setCurrentWord(word)
      const hasCachedExamples = await loadCustomExamples()
      const hasDatasetExamples = hasLocalExamples(word)

      // 检查是否需要加载释义
      if (word && (!word.definitions || word.definitions.length === 0)) {
        loadDefinitions()
      }

      // 如果没有例句，自动生成一次
      if (
        word &&
        !hasCachedExamples &&
        !hasDatasetExamples &&
        !attemptedAutoGenerate.current.has(word.id)
      ) {
        attemptedAutoGenerate.current.add(word.id)
        autoGenerateExamples(word)
      }
    }

    init()
  }, [word.id])

  // 标记用户已交互（用于自动播放）
  useEffect(() => {
    const handleInteraction = async () => {
      if (!hasUserInteracted) {
        setHasUserInteracted(true)
        // 用户首次交互时，如果启用了自动播放，立即播放
        const settings = SettingsManager.getSettings()
        if (settings.autoPlay && currentWord?.word) {
          try {
            await playWordAudio(currentWord.word)
          } catch (error) {
            console.error('自动播放失败:', error)
          }
        }
      }
    }

    window.addEventListener('click', handleInteraction, { once: true })
    window.addEventListener('touchstart', handleInteraction, { once: true })
    window.addEventListener('keydown', handleInteraction, { once: true })

    return () => {
      window.removeEventListener('click', handleInteraction)
      window.removeEventListener('touchstart', handleInteraction)
      window.removeEventListener('keydown', handleInteraction)
    }
  }, [hasUserInteracted, currentWord])

  // 加载单词释义
  const loadDefinitions = async (forceRefresh = false) => {
    // 检查缓存
    if (!forceRefresh) {
      const cachedData = localStorage.getItem(STORAGE_KEYS.DEFINITIONS_CACHE)
      if (cachedData) {
        try {
          const cache = JSON.parse(cachedData)
          if (cache[word.word]) {
            setCurrentWord(prev => ({
              ...prev,
              definitions: cache[word.word].definitions,
              phonetic: cache[word.word].phonetic || prev.phonetic
            }))
            return
          }
        } catch (e) {
          console.error('读取缓存失败:', e)
        }
      }
    }

    // 如果没有缓存，尝试从 AI 生成
    setIsLoadingDefinitions(true)
    try {
      // 动态导入生成器
      const { getDefinitionsGenerator } = await import('../utils/wordDefinitionsGenerator')
      const settings = SettingsManager.getSettings()
      const generator = getDefinitionsGenerator(settings.llmProvider)
      generator.setProvider(settings.llmProvider)
      if (settings.llmProvider === 'ollama') {
        generator.setOllamaConfig(settings.ollamaEndpoint, settings.ollamaModel)
      }

      const result = await generator.generateDefinitions(word.word)

      // 更新当前单词
      setCurrentWord(prev => ({
        ...prev,
        definitions: result.definitions,
        phonetic: result.phonetic || prev.phonetic
      }))

      // 缓存结果
      try {
        const cache = JSON.parse(localStorage.getItem(STORAGE_KEYS.DEFINITIONS_CACHE) || '{}')
        cache[word.word] = {
          definitions: result.definitions,
          phonetic: result.phonetic,
          generatedAt: new Date().toISOString()
        }
        localStorage.setItem(STORAGE_KEYS.DEFINITIONS_CACHE, JSON.stringify(cache))
      } catch (e) {
        console.error('保存缓存失败:', e)
      }
    } catch (error) {
      console.error('生成释义失败:', error)
      // 设置默认释义
      setCurrentWord(prev => ({
        ...prev,
        definitions: [
          {
            partOfSpeech: 'n.',
            meaning: '（点击下方"AI 生成释义"获取详细释义）'
          }
        ]
      }))
    } finally {
      setIsLoadingDefinitions(false)
    }
  }

  const loadCustomExamples = async () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_EXAMPLES)
      if (saved) {
        const customExamples = JSON.parse(saved)
        if (customExamples[word.id]) {
          setCurrentWord(prev => ({
            ...prev,
            examples: customExamples[word.id].examples
          }))
          return true
        }
      }
    } catch (error) {
      console.error('加载自定义例句失败:', error)
    }
    return false
  }

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

  const autoGenerateExamples = async (targetWord) => {
    if (hasLocalExamples(targetWord)) {
      return
    }
    setIsAutoGeneratingExamples(true)
    try {
      const settings = SettingsManager.getSettings()
      const response = await fetch('/api/examples', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          word: targetWord.word,
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

      if (!response.ok) {
        return
      }

      const data = await response.json()
      if (!Array.isArray(data?.examples) || data.examples.length === 0) {
        return
      }

      saveCustomExamples(targetWord.id, data.examples)
      setCurrentWord((prev) => ({
        ...prev,
        examples: data.examples
      }))
    } catch (error) {
      console.error('自动生成例句失败:', error)
    } finally {
      setIsAutoGeneratingExamples(false)
    }
  }

  // 处理 AI 生成例句完成
  const handleExamplesGenerated = (examples) => {
    console.log('WordCard: 收到生成的例句', examples.length, '条')
    console.log('WordCard: 例句数据', examples)

    setCurrentWord(prev => {
      const updated = {
        ...prev,
        examples
      }
      console.log('WordCard: 更新后的 word', updated)
      return updated
    })

    // 立即重新加载，确保显示
    setTimeout(() => {
      loadCustomExamples()
    }, 100)
  }

  // 播放单词发音
  const handlePlayWord = async () => {
    if (isPlaying) return
    setIsPlaying(true)
    try {
      await playWordAudio(currentWord.word)
    } catch (error) {
      console.error('播放失败:', error)
    } finally {
      setIsPlaying(false)
    }
  }

  // 播放句子发音
  const handlePlaySentence = async (sentence) => {
    try {
      await playSentenceAudio(sentence)
    } catch (error) {
      console.error('播放失败:', error)
    }
  }

  // 切换收藏状态
  const handleToggleFavorite = () => {
    if (isFavorite) {
      FavoritesManager.removeFavorite(word.id)
    } else {
      FavoritesManager.addFavorite(word.id)
    }
    onFavorite && onFavorite(word.id)
  }

  return (
    <div className="word-card">
      {/* 主单词区域 */}
      <div className="word-main">
        <div className="word-header">
          <button
            className="icon-btn favorite-btn"
            onClick={handleToggleFavorite}
            title={isFavorite ? '取消收藏' : '收藏'}
          >
            {isFavorite ? '⭐' : '☆'}
          </button>
        </div>

        <h1 className="word-text">{currentWord.word}</h1>

        <div className="word-phonetic">
          {currentWord.phonetic && (
            <span className="phonetic-text">{currentWord.phonetic}</span>
          )}
          <button
            className={`audio-btn ${isPlaying ? 'playing' : ''}`}
            onClick={handlePlayWord}
            disabled={isPlaying}
            title="播放发音"
          >
            🔊
          </button>
        </div>

        {/* 词义列表 */}
        <div className="word-definitions">
          {isLoadingDefinitions ? (
            <div className="definitions-loading">
              <span className="loading-spinner"></span>
              <span className="loading-text">正在获取释义...</span>
            </div>
          ) : currentWord.definitions && currentWord.definitions.length > 0 ? (
            <>
              {currentWord.definitions.map((def, index) => (
                <div key={index} className="definition-item">
                  <span className="part-of-speech">{def.partOfSpeech}</span>
                  <span className="meaning">{def.meaning}</span>
                </div>
              ))}
            </>
          ) : (
            <div className="definitions-empty">
              <span className="empty-text">暂无释义</span>
            </div>
          )}
        </div>
      </div>

      {/* AI 生成按钮 */}
      <div className="word-actions">
        <AIGenerateButton
          word={currentWord}
          onExamplesGenerated={handleExamplesGenerated}
          isAutoGenerating={isAutoGeneratingExamples}
          layout="inline"
        />
        <button
          className="retry-btn action-btn"
          onClick={() => loadDefinitions(true)}
          title="重新获取释义"
          disabled={isLoadingDefinitions}
        >
          🔄 重新获取释义
        </button>
      </div>

      {/* 详细信息区域（始终展开） */}
      <div className="word-details">
          {/* 例句 */}
          {isAutoGeneratingExamples && (
            <div className="detail-section">
              <h3 className="detail-title">例句</h3>
              <div className="examples-loading">正在生成例句...</div>
            </div>
          )}
          {currentWord.examples && currentWord.examples.length > 0 && (
            <div className="detail-section">
              <h3 className="detail-title">例句</h3>
              <div className="examples-list">
                {currentWord.examples.map((example, index) => (
                  <div key={index} className="example-item">
                    <div className="example-sentence">
                      <span>{example.sentence}</span>
                      <button
                        className="play-sentence-btn"
                        onClick={() => handlePlaySentence(example.sentence)}
                        title="播放句子"
                      >
                        ▶️
                      </button>
                    </div>
                    <div className="example-translation">{example.translation}</div>
                    {example.usage && (
                      <div className="example-usage">用法：{example.usage}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 词语搭配 */}
          {currentWord.collocations && currentWord.collocations.length > 0 && (
            <div className="detail-section">
              <h3 className="detail-title">常用搭配</h3>
              <div className="collocations-list">
                {currentWord.collocations.map((collocation, index) => (
                  <span key={index} className="collocation-tag">
                    {collocation}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 同义词 */}
          {currentWord.synonyms && currentWord.synonyms.length > 0 && (
            <div className="detail-section">
              <h3 className="detail-title">同义词</h3>
              <div className="synonyms-list">
                {currentWord.synonyms.map((synonym, index) => (
                  <span key={index} className="synonym-tag">
                    {synonym}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 反义词 */}
          {currentWord.antonyms && currentWord.antonyms.length > 0 && (
            <div className="detail-section">
              <h3 className="detail-title">反义词</h3>
              <div className="antonyms-list">
                {currentWord.antonyms.map((antonym, index) => (
                  <span key={index} className="antonym-tag">
                    {antonym}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 使用场景 */}
          {currentWord.scenarios && currentWord.scenarios.length > 0 && (
            <div className="detail-section">
              <h3 className="detail-title">使用场景</h3>
              <div className="scenarios-list">
                {currentWord.scenarios.map((scenario, index) => (
                  <span key={index} className="scenario-tag">
                    {scenario}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 分类和难度 */}
          <div className="word-meta">
            {currentWord.category && (
              <span className="meta-tag category">分类: {currentWord.category}</span>
            )}
            {currentWord.difficulty && (
              <span className="meta-tag difficulty">
                难度: {getDifficultyText(currentWord.difficulty)}
              </span>
            )}
          </div>
        </div>
    </div>
  )
}

// 难度等级转换
const getDifficultyText = (difficulty) => {
  const difficultyMap = {
    beginner: '初级',
    intermediate: '中级',
    advanced: '高级',
    expert: '专家'
  }
  return difficultyMap[difficulty] || difficulty
}

export default WordCard
