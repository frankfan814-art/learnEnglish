/**
 * 本地存储管理工具
 */

const STORAGE_KEYS = {
  PROGRESS: 'english_app_progress',
  FAVORITES: 'english_app_favorites',
  SETTINGS: 'english_app_settings',
  LAST_STUDY_DATE: 'english_app_last_study_date'
}

/**
 * 进度管理类
 */
export class ProgressManager {
  constructor() {
    this.loadProgress()
  }

  /**
   * 加载学习进度
   */
  loadProgress() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROGRESS)
      if (saved) {
        this.progress = JSON.parse(saved)
      } else {
        this.progress = {
          currentIndex: 0,
          totalWords: 20000,
          todayStudied: 0,
          todayTarget: 1000,
          completedRounds: 0,
          studiedWords: [],
          startTime: new Date().toISOString(),
          lastStudyTime: null
        }
      }
    } catch (error) {
      console.error('加载进度失败:', error)
      this.progress = {
        currentIndex: 0,
        totalWords: 20000,
        todayStudied: 0,
        todayTarget: 1000,
        completedRounds: 0,
        studiedWords: [],
        startTime: new Date().toISOString(),
        lastStudyTime: null
      }
    }
  }

  /**
   * 保存学习进度
   */
  saveProgress() {
    try {
      this.progress.lastStudyTime = new Date().toISOString()
      localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(this.progress))
    } catch (error) {
      console.error('保存进度失败:', error)
    }
  }

  /**
   * 获取当前索引
   */
  getCurrentIndex() {
    return this.progress.currentIndex
  }

  /**
   * 设置当前索引
   */
  setCurrentIndex(index, totalWords) {
    this.progress.currentIndex = index
    this.progress.totalWords = totalWords

    // 检查是否完成一轮
    if (index >= totalWords) {
      this.progress.completedRounds++
      this.progress.currentIndex = 0
    }

    this.saveProgress()
  }

  /**
   * 增加今日学习数量
   */
  incrementTodayStudied() {
    this.progress.todayStudied++
    this.saveProgress()
  }

  /**
   * 获取今日学习数量
   */
  getTodayStudied() {
    return this.progress.todayStudied
  }

  /**
   * 重置今日学习数量（新的一天）
   */
  resetTodayStudied() {
    this.progress.todayStudied = 0
    this.saveProgress()
  }

  /**
   * 获取学习统计
   */
  getStatistics() {
    const now = new Date()
    const start = new Date(this.progress.startTime)
    const daysElapsed = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1

    return {
      currentIndex: this.progress.currentIndex,
      totalWords: this.progress.totalWords,
      todayStudied: this.progress.todayStudied,
      todayTarget: this.progress.todayTarget,
      completedRounds: this.progress.completedRounds,
      totalStudyDays: daysElapsed,
      lastStudyTime: this.progress.lastStudyTime
    }
  }

  /**
   * 重置所有进度
   */
  resetProgress() {
    this.progress = {
      currentIndex: 0,
      totalWords: 20000,
      todayStudied: 0,
      todayTarget: 1000,
      completedRounds: 0,
      studiedWords: [],
      startTime: new Date().toISOString(),
      lastStudyTime: null
    }
    this.saveProgress()
  }

  /**
   * 检查是否是新的一天
   */
  checkNewDay() {
    const lastDate = localStorage.getItem(STORAGE_KEYS.LAST_STUDY_DATE)
    const today = new Date().toDateString()

    if (lastDate !== today) {
      this.resetTodayStudied()
      localStorage.setItem(STORAGE_KEYS.LAST_STUDY_DATE, today)
      return true
    }
    return false
  }
}

/**
 * 收藏夹管理
 */
export class FavoritesManager {
  /**
   * 获取收藏列表
   */
  static getFavorites() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FAVORITES)
      return saved ? JSON.parse(saved) : []
    } catch (error) {
      console.error('获取收藏失败:', error)
      return []
    }
  }

  /**
   * 添加收藏
   */
  static addFavorite(wordId) {
    const favorites = this.getFavorites()
    if (!favorites.includes(wordId)) {
      favorites.push(wordId)
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites))
    }
  }

  /**
   * 移除收藏
   */
  static removeFavorite(wordId) {
    const favorites = this.getFavorites()
    const index = favorites.indexOf(wordId)
    if (index > -1) {
      favorites.splice(index, 1)
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites))
    }
  }

  /**
   * 检查是否已收藏
   */
  static isFavorite(wordId) {
    const favorites = this.getFavorites()
    return favorites.includes(wordId)
  }
}

/**
 * 设置管理
 */
export class SettingsManager {
  /**
   * 获取设置
   */
  static getSettings() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS)
      // 读取环境变量（构建时注入）
      const envApiKey = import.meta.env?.VITE_DEEPSEEK_API_KEY || ''
      const envEndpoint = import.meta.env?.VITE_DEEPSEEK_ENDPOINT || 'https://api.deepseek.com/v1/chat/completions'
      const envModel = import.meta.env?.VITE_DEEPSEEK_MODEL || 'deepseek-chat'
      const envProvider = import.meta.env?.VITE_LLM_PROVIDER || 'deepseek'
      
      return saved ? JSON.parse(saved) : {
        dailyTarget: 1000,
        voiceType: 'US',
        autoPlay: true,
        showPhonetic: true,
        showExamples: true,
        theme: 'auto',
        fontSize: 'medium',
        llmProvider: envProvider,
        deepSeekApiKey: envApiKey,
        deepSeekEndpoint: envEndpoint,
        deepSeekModel: envModel,
        ollamaEndpoint: 'http://localhost:11434',
        ollamaModel: 'qwen2.5:3b'
      }
    } catch (error) {
      console.error('获取设置失败:', error)
      return {
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
        ollamaEndpoint: 'http://localhost:11434',
        ollamaModel: 'qwen2.5:3b'
      }
    }
  }

  /**
   * 保存设置
   */
  static saveSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
  }

  /**
   * 更新单个设置
   */
  static updateSetting(key, value) {
    const settings = this.getSettings()
    settings[key] = value
    this.saveSettings(settings)
  }
}

/**
 * 导出进度数据到 JSON（用于备份）
 */
export function exportProgressData() {
  try {
    const data = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      progress: JSON.parse(localStorage.getItem(STORAGE_KEYS.PROGRESS)) || null,
      favorites: JSON.parse(localStorage.getItem(STORAGE_KEYS.FAVORITES)) || [],
      settings: JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || {},
      lastStudyDate: localStorage.getItem(STORAGE_KEYS.LAST_STUDY_DATE) || null
    }
    return data
  } catch (error) {
    console.error('导出进度数据失败:', error)
    return null
  }
}

/**
 * 导入进度数据从 JSON（用于恢复）
 */
export function importProgressData(data) {
  try {
    if (!data || !data.version) {
      throw new Error('无效的数据格式')
    }

    // 恢复进度
    if (data.progress) {
      localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(data.progress))
    }

    // 恢复收藏
    if (data.favorites) {
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(data.favorites))
    }

    // 恢复设置
    if (data.settings) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings))
    }

    // 恢复最后学习日期
    if (data.lastStudyDate) {
      localStorage.setItem(STORAGE_KEYS.LAST_STUDY_DATE, data.lastStudyDate)
    }

    return { success: true, message: '进度导入成功' }
  } catch (error) {
    console.error('导入进度数据失败:', error)
    return { success: false, message: '导入失败: ' + error.message }
  }
}

/**
 * 下载进度数据为文件
 */
export function downloadProgressFile() {
  const data = exportProgressData()
  if (!data) {
    return { success: false, message: '导出失败' }
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `english_progress_${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  return { success: true, message: '进度文件已下载' }
}

/**
 * 从文件读取进度数据
 */
export function readProgressFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        resolve(importProgressData(data))
      } catch (error) {
        reject({ success: false, message: '文件解析失败: ' + error.message })
      }
    }
    reader.onerror = () => {
      reject({ success: false, message: '文件读取失败' })
    }
    reader.readAsText(file)
  })
}

// 创建全局进度管理实例
export const progressManager = new ProgressManager()
