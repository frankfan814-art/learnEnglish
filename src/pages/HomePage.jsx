import { useState, useEffect } from 'react'
import { MasteredWordsManager } from '../utils/storage'
import { apiProgressManager } from '../utils/apiStorage'
import '../styles/HomePage.css'

const HomePage = ({ onStartLearning, onGoToSettings, onGoToMasteredWords }) => {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    await apiProgressManager.loadProgress()
    const statistics = apiProgressManager.getStatistics()
    setStats(statistics)
  }

  const handleResetProgress = async () => {
    if (window.confirm('确定要重置所有学习进度吗？此操作不可恢复。')) {
      await apiProgressManager.resetProgress()
      loadStats()
    }
  }

  const getTodayProgressPercentage = () => {
    if (!stats) return 0
    return Math.min((stats.todayStudied / stats.todayTarget * 100), 100).toFixed(0)
  }

  const masteredCount = MasteredWordsManager.getMasteredCount()

  return (
    <div className="home-page">
      <div className="home-container">
        {/* 今日学习进度 */}
        <div className="stats-card">
          <div className="stats-card-body">
            <div className="today-progress">
              <div className="progress-count">
                {stats?.todayStudied || 0} / {stats?.todayTarget || 1000}
              </div>
              <div className="progress-label">今日已学</div>
              <div className="progress-percentage">{getTodayProgressPercentage()}%</div>
            </div>
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${getTodayProgressPercentage()}%` }}
              />
            </div>
          </div>
        </div>

        {/* 总体统计 - 四个卡片 */}
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{stats?.currentIndex + 1 || 0}</span>
            <span className="stat-label">当前位置</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats?.totalWords || 20000}</span>
            <span className="stat-label">总单词数</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{masteredCount}</span>
            <span className="stat-label">已掌握</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats?.completedRounds || 0}</span>
            <span className="stat-label">完成轮数</span>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="home-actions">
          <button className="primary-btn" onClick={onStartLearning}>
            🚀 继续学习
          </button>
          <button className="secondary-btn" onClick={onGoToMasteredWords}>
            ✅ 已掌握单词
          </button>
          <button className="secondary-btn" onClick={onGoToSettings}>
            ⚙️ 设置
          </button>
          <button className="danger-btn" onClick={handleResetProgress}>
            🔄 重置进度
          </button>
        </div>
      </div>
    </div>
  )
}

export default HomePage
