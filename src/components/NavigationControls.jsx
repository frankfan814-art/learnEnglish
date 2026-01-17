import '../styles/NavigationControls.css'

const NavigationControls = ({
  currentIndex,
  totalWords,
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext
}) => {
  return (
    <div className="navigation-controls">
      {/* 进度显示 */}
      <div className="progress-display">
        <span className="progress-text">
          {currentIndex + 1} / {totalWords}
        </span>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${((currentIndex + 1) / totalWords) * 100}%`
            }}
          />
        </div>
      </div>

      {/* 导航按钮 */}
      <div className="nav-buttons">
        <button
          className="nav-button prev-button"
          onClick={onPrevious}
          disabled={!canGoPrevious}
          title="上一个"
        >
          <span className="nav-icon">◀</span>
          <span className="nav-text">上一个</span>
        </button>

        <button
          className="nav-button next-button"
          onClick={onNext}
          disabled={!canGoNext}
          title="下一个"
        >
          <span className="nav-text">下一个</span>
          <span className="nav-icon">▶</span>
        </button>
      </div>
    </div>
  )
}

export default NavigationControls
