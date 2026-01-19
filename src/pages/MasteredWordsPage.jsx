import { useState, useEffect } from 'react'
import { MasteredWordsManager } from '../utils/storage'
import '../styles/MasteredWordsPage.css'

const MasteredWordsPage = ({ onBackToHome }) => {
  const [masteredWords, setMasteredWords] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadMasteredWords()
  }, [])

  const loadMasteredWords = () => {
    try {
      const words = MasteredWordsManager.getMasteredWords()
      setMasteredWords(words.sort((a, b) => new Date(b.masteredAt) - new Date(a.masteredAt)))
    } catch (error) {
      console.error('加载已掌握单词失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveWord = (wordId) => {
    if (window.confirm('确定要将这个单词从已掌握列表中移除吗？')) {
      MasteredWordsManager.removeMasteredWord(wordId)
      loadMasteredWords()
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="mastered-words-page">
        <div className="loading">加载中...</div>
      </div>
    )
  }

  return (
    <div className="mastered-words-page">
      {/* 顶部导航 */}
      <div className="top-bar">
        <button className="back-btn" onClick={onBackToHome}>
          ← 返回
        </button>
        <h2 className="page-title">已掌握单词 ({masteredWords.length})</h2>
        <div className="placeholder"></div>
      </div>

      {/* 单词列表 */}
      <div className="mastered-words-container">
        {masteredWords.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3>还没有已掌握的单词</h3>
            <p>在单词卡片中点击 ✅ 按钮来标记已掌握的单词</p>
          </div>
        ) : (
          <div className="words-list">
            {masteredWords.map((item) => (
              <div key={item.id} className="mastered-word-item">
                <div className="word-info">
                  <h3 className="word-text">{item.word}</h3>
                  <p className="mastered-date">掌握时间: {formatDate(item.masteredAt)}</p>
                </div>
                <button
                  className="remove-btn"
                  onClick={() => handleRemoveWord(item.id)}
                  title="移除"
                >
                  ❌
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MasteredWordsPage