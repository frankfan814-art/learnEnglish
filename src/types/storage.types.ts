/**
 * 存储相关的 TypeScript 类型定义
 */

/** 学习进度数据 */
export interface ProgressData {
  currentIndex: number
  totalWords: number
  todayStudied: number
  todayTarget: number
  completedRounds: number
  studiedWords: string[]
  startTime: string
  lastStudyTime: string | null
}

/** 学习统计数据 */
export interface Statistics {
  currentIndex: number
  totalWords: number
  todayStudied: number
  todayTarget: number
  completedRounds: number
  totalStudyDays: number
  lastStudyTime: string | null
}

/** 应用设置 */
export interface AppSettings {
  dailyTarget: number
  voiceType: 'US' | 'UK'
  autoPlay: boolean
  showPhonetic: boolean
  showExamples: boolean
  theme: 'light' | 'dark' | 'auto'
  fontSize: 'small' | 'medium' | 'large'
  ollamaModel?: string
  ollamaEndpoint?: string
  deepSeekApiKey?: string
  deepSeekEndpoint?: string
  deepSeekModel?: string
  llmProvider?: 'deepseek' | 'ollama'
}

/** 存储键名 */
export const STORAGE_KEYS = {
  PROGRESS: 'english_app_progress',
  FAVORITES: 'english_app_favorites',
  SETTINGS: 'english_app_settings',
  LAST_STUDY_DATE: 'english_app_last_study_date',
  CUSTOM_EXAMPLES: 'english_app_custom_examples',
  DEFINITIONS_CACHE: 'english_app_definitions_cache'
} as const
