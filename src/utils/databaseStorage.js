/**
 * 基于数据库的存储管理工具
 * 作为 localStorage 的增强版，提供更可靠的持久化存储
 */

import { getDatabase } from '@/../database/index.js';

const DB = getDatabase();

/**
 * 数据库进度管理类
 */
export class DatabaseProgressManager {
  constructor(userId = 'default') {
    this.userId = userId;
    this.progress = null;
    this.loadProgress();
  }

  /**
   * 加载学习进度
   */
  loadProgress() {
    try {
      const dbProgress = DB.getUserProgress(this.userId);

      if (dbProgress) {
        this.progress = {
          currentIndex: dbProgress.current_index,
          totalWords: dbProgress.total_words,
          todayStudied: dbProgress.today_studied,
          todayTarget: dbProgress.today_target,
          completedRounds: dbProgress.completed_rounds,
          startTime: dbProgress.start_time,
          lastStudyTime: dbProgress.last_study_time
        };
      } else {
        // 初始化新进度
        this.progress = {
          currentIndex: 0,
          totalWords: 20000,
          todayStudied: 0,
          todayTarget: 1000,
          completedRounds: 0,
          startTime: new Date().toISOString(),
          lastStudyTime: null
        };
        DB.insertUserProgress(this.userId, this.progress);
      }
    } catch (error) {
      console.error('加载进度失败:', error);
      this.progress = {
        currentIndex: 0,
        totalWords: 20000,
        todayStudied: 0,
        todayTarget: 1000,
        completedRounds: 0,
        studiedWords: [],
        startTime: new Date().toISOString(),
        lastStudyTime: null
      };
    }
  }

  /**
   * 保存学习进度
   */
  saveProgress() {
    try {
      this.progress.lastStudyTime = new Date().toISOString();
      const result = DB.updateUserProgress(this.userId, this.progress);

      if (!result.success) {
        throw new Error(result.error);
      }

      // 同时记录学习历史
      const today = new Date().toISOString().split('T')[0];
      DB.updateDailyStats(this.userId, today, {
        wordsStudied: 1
      });
    } catch (error) {
      console.error('保存进度失败:', error);
    }
  }

  /**
   * 获取当前索引
   */
  getCurrentIndex() {
    return this.progress.currentIndex;
  }

  /**
   * 设置当前索引
   */
  setCurrentIndex(index, totalWords) {
    this.progress.currentIndex = index;
    this.progress.totalWords = totalWords;

    // 检查是否完成一轮
    if (index >= totalWords) {
      this.progress.completedRounds++;
      this.progress.currentIndex = 0;
    }

    this.saveProgress();
  }

  /**
   * 增加今日学习数量
   */
  incrementTodayStudied() {
    this.progress.todayStudied++;
    this.saveProgress();
  }

  /**
   * 获取今日学习数量
   */
  getTodayStudied() {
    return this.progress.todayStudied;
  }

  /**
   * 重置今日学习数量（新的一天）
   */
  resetTodayStudied() {
    this.progress.todayStudied = 0;
    DB.resetTodayStudied(this.userId);
  }

  /**
   * 获取学习统计
   */
  getStatistics() {
    const now = new Date();
    const start = new Date(this.progress.startTime);
    const daysElapsed = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;

    return {
      currentIndex: this.progress.currentIndex,
      totalWords: this.progress.totalWords,
      todayStudied: this.progress.todayStudied,
      todayTarget: this.progress.todayTarget,
      completedRounds: this.progress.completedRounds,
      totalStudyDays: daysElapsed,
      lastStudyTime: this.progress.lastStudyTime
    };
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
    };
    DB.resetUserProgress(this.userId);
  }

  /**
   * 检查是否是新的一天
   */
  checkNewDay() {
    const lastStudyTime = this.progress.lastStudyTime;
    if (!lastStudyTime) {
      return true;
    }

    const lastDate = new Date(lastStudyTime).toDateString();
    const today = new Date().toDateString();

    if (lastDate !== today) {
      this.resetTodayStudied();
      return true;
    }
    return false;
  }
}

/**
 * 数据库收藏夹管理
 */
export class DatabaseFavoritesManager {
  constructor(userId = 'default') {
    this.userId = userId;
  }

  /**
   * 获取收藏列表
   */
  getFavorites() {
    try {
      return DB.getUserFavorites(this.userId);
    } catch (error) {
      console.error('获取收藏失败:', error);
      return [];
    }
  }

  /**
   * 添加收藏
   */
  addFavorite(wordId, word) {
    try {
      const result = DB.addFavorite(this.userId, wordId, word);
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('添加收藏失败:', error);
    }
  }

  /**
   * 移除收藏
   */
  removeFavorite(wordId) {
    try {
      const result = DB.removeFavorite(this.userId, wordId);
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('移除收藏失败:', error);
    }
  }

  /**
   * 检查是否已收藏
   */
  isFavorite(wordId) {
    try {
      return DB.isFavorite(this.userId, wordId);
    } catch (error) {
      console.error('检查收藏状态失败:', error);
      return false;
    }
  }
}

/**
 * 数据库设置管理
 */
export class DatabaseSettingsManager {
  constructor(userId = 'default') {
    this.userId = userId;
    this.defaultSettings = {
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
    };
  }

  /**
   * 获取设置
   */
  getSettings() {
    try {
      const dbSettings = DB.getUserSettings(this.userId);

      // 读取环境变量（构建时注入）
      const envApiKey = import.meta.env?.VITE_DEEPSEEK_API_KEY || '';
      const envEndpoint = import.meta.env?.VITE_DEEPSEEK_ENDPOINT || 'https://api.deepseek.com/v1/chat/completions';
      const envModel = import.meta.env?.VITE_DEEPSEEK_MODEL || 'deepseek-chat';
      const envProvider = import.meta.env?.VITE_LLM_PROVIDER || 'deepseek';

      // 合并数据库设置和环境变量
      return {
        ...this.defaultSettings,
        llmProvider: envProvider,
        deepSeekApiKey: envApiKey,
        deepSeekEndpoint: envEndpoint,
        deepSeekModel: envModel,
        ...dbSettings
      };
    } catch (error) {
      console.error('获取设置失败:', error);
      return this.defaultSettings;
    }
  }

  /**
   * 保存设置
   */
  saveSettings(settings) {
    try {
      const result = DB.saveUserSettings(this.userId, settings);
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('保存设置失败:', error);
    }
  }

  /**
   * 更新单个设置
   */
  updateSetting(key, value) {
    try {
      const result = DB.saveUserSetting(this.userId, key, value);
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('更新设置失败:', error);
    }
  }
}

/**
 * 导出进度数据（用于备份）
 */
export function exportProgressData() {
  try {
    const result = DB.exportAllData('default');
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data;
  } catch (error) {
    console.error('导出进度数据失败:', error);
    return null;
  }
}

/**
 * 导入进度数据（用于恢复）
 */
export function importProgressData(data) {
  try {
    if (!data || !data.version) {
      throw new Error('无效的数据格式');
    }

    // 恢复进度
    if (data.progress) {
      DB.updateUserProgress('default', {
        currentIndex: data.progress.current_index,
        totalWords: data.progress.total_words,
        todayStudied: data.progress.today_studied,
        todayTarget: data.progress.today_target,
        completedRounds: data.progress.completed_rounds
      });
    }

    // 恢复收藏
    if (data.favorites && Array.isArray(data.favorites)) {
      // 这里需要知道单词的文本，如果数据中没有，可能需要从词库中查询
      // 暂时跳过
    }

    // 恢复设置
    if (data.settings) {
      DB.saveUserSettings('default', data.settings);
    }

    return { success: true, message: '进度导入成功' };
  } catch (error) {
    console.error('导入进度数据失败:', error);
    return { success: false, message: '导入失败: ' + error.message };
  }
}

/**
 * 下载进度数据为文件
 */
export function downloadProgressFile() {
  const data = exportProgressData();
  if (!data) {
    return { success: false, message: '导出失败' };
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `english_progress_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { success: true, message: '进度文件已下载' };
}

/**
 * 从文件读取进度数据
 */
export function readProgressFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        resolve(importProgressData(data));
      } catch (error) {
        reject({ success: false, message: '文件解析失败: ' + error.message });
      }
    };
    reader.onerror = () => {
      reject({ success: false, message: '文件读取失败' });
    };
    reader.readAsText(file);
  });
}

/**
 * 获取学习历史
 */
export function getStudyHistory(limit = 100) {
  try {
    return DB.getStudyHistory('default', limit);
  } catch (error) {
    console.error('获取学习历史失败:', error);
    return [];
  }
}

/**
 * 获取每日统计
 */
export function getDailyStats(days = 30) {
  try {
    return DB.getDailyStats('default', days);
  } catch (error) {
    console.error('获取每日统计失败:', error);
    return [];
  }
}

// 创建全局数据库管理实例
export const databaseProgressManager = new DatabaseProgressManager();
export const databaseFavoritesManager = new DatabaseFavoritesManager();
export const databaseSettingsManager = new DatabaseSettingsManager();
