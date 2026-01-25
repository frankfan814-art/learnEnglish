import { useState, useEffect } from 'react'
import HomePage from './pages/HomePage'
import LearningPage from './components/LearningPage'
import SettingsPage from './pages/SettingsPage'
import MasteredWordsPage from './pages/MasteredWordsPage'
import DebugPanel from './components/DebugPanel'
import './styles/App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('learning') // 默认进入学习页
  const [debugOpen, setDebugOpen] = useState(false)

  // 监听调试快捷键
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl+Shift+D 或 Cmd+Shift+D 切换调试面板
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault()
        setDebugOpen(!debugOpen)
      }
      // Ctrl+Shift+R 或 Cmd+Shift+R 刷新页面
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
        e.preventDefault()
        window.location.reload()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    
    // 全局调试面板开关
    window.openDebugPanel = () => setDebugOpen(true)
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
      window.openDebugPanel = null
    }
  }, [debugOpen])

  const handleStartLearning = () => {
    // 标记用户已交互（用于自动播放）
    sessionStorage.setItem('userHasInteracted', 'true')
    setCurrentPage('learning')
  }

  const handleBackToHome = () => {
    setCurrentPage('home')
  }

  const handleGoToSettings = () => {
    setCurrentPage('settings')
  }

  const handleGoToMasteredWords = () => {
    setCurrentPage('mastered')
  }

  // 渲染当前页面
  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <HomePage
            onStartLearning={handleStartLearning}
            onGoToSettings={handleGoToSettings}
            onGoToMasteredWords={handleGoToMasteredWords}
          />
        )
      case 'learning':
        return (
          <LearningPage
            onBackToHome={handleBackToHome}
            onGoToSettings={handleGoToSettings}
          />
        )
      case 'settings':
        return <SettingsPage onBack={handleBackToHome} />
      case 'mastered':
        return <MasteredWordsPage onBackToHome={handleBackToHome} />
      default:
        return (
          <HomePage
            onStartLearning={handleStartLearning}
            onGoToSettings={handleGoToSettings}
            onGoToMasteredWords={handleGoToMasteredWords}
          />
        )
    }
  }

  return (
    <div className="app">
      {renderPage()}
      <DebugPanel isOpen={debugOpen} onClose={() => setDebugOpen(false)} />
    </div>
  )
}

export default App
