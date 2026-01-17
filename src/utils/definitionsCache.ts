/**
 * 单词释义缓存管理
 * 用于存储和管理从 AI 生成的单词释义
 */

import type { WordDefinition } from './wordDefinitionsGenerator'

export interface CachedDefinitions {
  word: string
  definitions: WordDefinition[]
  phonetic?: string
  generatedAt: string
  provider: 'deepseek' | 'ollama'
}

const CACHE_KEY = 'english_app_definitions_cache'
const CACHE_VERSION_KEY = 'english_app_definitions_cache_version'
const CACHE_VERSION = '1.0'

/**
 * 释义缓存管理类
 */
export class DefinitionsCache {
  private cache: Map<string, CachedDefinitions>

  constructor() {
    this.cache = new Map()
    this.loadFromStorage()
  }

  /**
   * 从 localStorage 加载缓存
   */
  private loadFromStorage() {
    try {
      const version = localStorage.getItem(CACHE_VERSION_KEY)
      if (version !== CACHE_VERSION) {
        // 版本不匹配，清空缓存
        this.clearCache()
        return
      }

      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const data = JSON.parse(cached)
        Object.entries(data).forEach(([word, entry]) => {
          this.cache.set(word, entry as CachedDefinitions)
        })
      }
    } catch (error) {
      console.error('加载释义缓存失败:', error)
    }
  }

  /**
   * 保存到 localStorage
   */
  private saveToStorage() {
    try {
      const data: Record<string, CachedDefinitions> = {}
      this.cache.forEach((value, key) => {
        data[key] = value
      })
      localStorage.setItem(CACHE_KEY, JSON.stringify(data))
      localStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION)
    } catch (error) {
      console.error('保存释义缓存失败:', error)
    }
  }

  /**
   * 获取单词的释义缓存
   */
  get(word: string): CachedDefinitions | null {
    return this.cache.get(word) || null
  }

  /**
   * 设置单词的释义缓存
   */
  set(word: string, definitions: CachedDefinitions) {
    this.cache.set(word, definitions)
    this.saveToStorage()
  }

  /**
   * 批量设置缓存
   */
  setMultiple(entries: Array<{ word: string; data: CachedDefinitions }>) {
    entries.forEach(({ word, data }) => {
      this.cache.set(word, data)
    })
    this.saveToStorage()
  }

  /**
   * 检查是否有缓存
   */
  has(word: string): boolean {
    return this.cache.has(word)
  }

  /**
   * 删除指定单词的缓存
   */
  delete(word: string) {
    this.cache.delete(word)
    this.saveToStorage()
  }

  /**
   * 清空所有缓存
   */
  clearCache() {
    this.cache.clear()
    localStorage.removeItem(CACHE_KEY)
    localStorage.removeItem(CACHE_VERSION_KEY)
  }

  /**
   * 获取缓存大小
   */
  get size(): number {
    return this.cache.size
  }

  /**
   * 获取所有缓存的单词列表
   */
  getWords(): string[] {
    return Array.from(this.cache.keys())
  }

  /**
   * 导出缓存数据（用于备份）
   */
  export(): string {
    const data: Record<string, CachedDefinitions> = {}
    this.cache.forEach((value, key) => {
      data[key] = value
    })
    return JSON.stringify({
      version: CACHE_VERSION,
      exportedAt: new Date().toISOString(),
      data
    }, null, 2)
  }

  /**
   * 导入缓存数据
   */
  import(jsonData: string): boolean {
    try {
      const parsed = JSON.parse(jsonData)
      if (parsed.version !== CACHE_VERSION) {
        throw new Error('缓存版本不匹配')
      }

      Object.entries(parsed.data as Record<string, CachedDefinitions>).forEach(([word, entry]) => {
        this.cache.set(word, entry)
      })

      this.saveToStorage()
      return true
    } catch (error) {
      console.error('导入缓存失败:', error)
      return false
    }
  }
}

// 全局单例
let cacheInstance: DefinitionsCache | null = null

/**
 * 获取释义缓存实例
 */
export const getDefinitionsCache = (): DefinitionsCache => {
  if (!cacheInstance) {
    cacheInstance = new DefinitionsCache()
  }
  return cacheInstance
}

/**
 * 重置缓存实例
 */
export const resetDefinitionsCache = () => {
  cacheInstance = null
}
