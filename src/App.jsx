import { useState } from 'react'
import HomePage from './pages/HomePage'
import LearningPage from './components/LearningPage'
import SettingsPage from './pages/SettingsPage'
import './styles/App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('learning') // 默认进入学习页

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

  // 渲染当前页面
  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <HomePage
            onStartLearning={handleStartLearning}
            onGoToSettings={handleGoToSettings}
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
      default:
        return (
          <HomePage
            onStartLearning={handleStartLearning}
            onGoToSettings={handleGoToSettings}
          />
        )
    }
  }

  return (
    <div className="app">
      {renderPage()}
    </div>
  )
}

export default App
