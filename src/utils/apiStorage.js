/**
 * 基于 API 的数据库存储工具
 * 通过后端 API 将数据存储到 SQLite 数据库
 */

const API_BASE = '/api'

class ApiStorage {
  async request(endpoint, options = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    })
    if (!response.ok) {
      throw new Error(`API 错误: ${response.status}`)
    }
    return response.json()
  }
}

const api = new ApiStorage()

export class ApiProgressManager {
  constructor() {
    this.progress = {
      current_index: 0,
      total_words: 20000,
      today_studied: 0,
      today_target: 1000,
      completed_rounds: 0,
      start_time: new Date().toISOString(),
      last_study_time: null
    }
  }

  async loadProgress() {
    try {
      const serverProgress = await api.request('/progress')
      if (serverProgress) {
        this.progress = {
          ...this.progress,
          current_index: serverProgress.current_index ?? 0,
          total_words: serverProgress.total_words ?? 20000,
          today_studied: serverProgress.today_studied ?? 0,
          today_target: serverProgress.today_target ?? 1000,
          completed_rounds: serverProgress.completed_rounds ?? 0,
          start_time: serverProgress.start_time || new Date().toISOString(),
          last_study_time: serverProgress.last_study_time
        }
      }
      return this.progress
    } catch (error) {
      console.error('加载进度失败:', error)
      return this.progress
    }
  }

  async saveProgress(data) {
    try {
      const result = await api.request('/progress', {
        method: 'POST',
        body: JSON.stringify(data)
      })
      return result
    } catch (error) {
      console.error('保存进度失败:', error)
      return null
    }
  }

  getCurrentIndex() {
    return this.progress?.current_index || 0
  }

  async setCurrentIndex(index, totalWords) {
    this.progress = {
      ...this.progress,
      current_index: index,
      total_words: totalWords
    }
    await this.saveProgress(this.progress)

    if (index >= totalWords) {
      this.progress = {
        ...this.progress,
        completed_rounds: (this.progress.completed_rounds || 0) + 1,
        current_index: 0
      }
      await this.saveProgress(this.progress)
    }
  }

  async incrementTodayStudied() {
    this.progress = {
      ...this.progress,
      today_studied: (this.progress.today_studied || 0) + 1
    }
    await this.saveProgress(this.progress)
  }

  getTodayStudied() {
    return this.progress?.today_studied || 0
  }

  async resetTodayStudied() {
    this.progress = {
      ...this.progress,
      today_studied: 0
    }
    await this.saveProgress(this.progress)
  }

  getStatistics() {
    const now = new Date()
    const start = new Date(this.progress?.start_time || Date.now())
    const daysElapsed = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1

    return {
      currentIndex: this.progress?.current_index || 0,
      totalWords: this.progress?.total_words || 20000,
      todayStudied: this.progress?.today_studied || 0,
      todayTarget: this.progress?.today_target || 1000,
      completedRounds: this.progress?.completed_rounds || 0,
      totalStudyDays: daysElapsed,
      lastStudyTime: this.progress?.last_study_time
    }
  }

  async resetProgress() {
    this.progress = {
      current_index: 0,
      total_words: 20000,
      today_studied: 0,
      today_target: 1000,
      completed_rounds: 0
    }
    await this.saveProgress(this.progress)
  }

  checkNewDay() {
    const lastDate = this.progress?.last_study_time
    if (!lastDate) return true

    const last = new Date(lastDate).toDateString()
    const today = new Date().toDateString()

    if (last !== today) {
      this.resetTodayStudied()
      return true
    }
    return false
  }
}

export class ApiFavoritesManager {
  async getFavorites() {
    try {
      const result = await api.request('/favorites')
      return result.favorites || []
    } catch (error) {
      console.error('获取收藏失败:', error)
      return []
    }
  }

  async addFavorite(wordId, word) {
    try {
      await api.request(`/favorites/${wordId}`, {
        method: 'POST',
        body: JSON.stringify({ word })
      })
    } catch (error) {
      console.error('添加收藏失败:', error)
    }
  }

  async removeFavorite(wordId) {
    try {
      await api.request(`/favorites/${wordId}`, {
        method: 'DELETE'
      })
    } catch (error) {
      console.error('移除收藏失败:', error)
    }
  }

  async isFavorite(wordId) {
    const favorites = await this.getFavorites()
    return favorites.includes(wordId)
  }
}

export class ApiSettingsManager {
  async getSettings() {
    try {
      const settings = await api.request('/settings')
      return {
        dailyTarget: 1000,
        voiceType: 'US',
        autoPlay: true,
        showPhonetic: true,
        showExamples: true,
        theme: 'auto',
        fontSize: 'medium',
        ...settings
      }
    } catch (error) {
      console.error('获取设置失败:', error)
      return null
    }
  }

  async saveSettings(settings) {
    try {
      await api.request('/settings', {
        method: 'POST',
        body: JSON.stringify(settings)
      })
    } catch (error) {
      console.error('保存设置失败:', error)
    }
  }

  async updateSetting(key, value) {
    const settings = await this.getSettings()
    settings[key] = value
    await this.saveSettings(settings)
  }
}

export const apiProgressManager = new ApiProgressManager()
export const apiFavoritesManager = new ApiFavoritesManager()
export const apiSettingsManager = new ApiSettingsManager()
