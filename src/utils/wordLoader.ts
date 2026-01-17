/**
 * 词库分片加载工具
 * 用于管理大型词库的按需加载
 */

import type { Word, WordChunkInfo } from '../types/word.types'

/** 词库分片配置 */
export const CHUNK_SIZE = 500 // 每个分片包含的单词数量

/** 已加载的分片缓存 */
const loadedChunks = new Map<number, Word[]>()

/** 分片索引信息 */
let chunksIndex: WordChunkInfo[] = []

/**
 * 词库加载器类
 */
export class WordLoader {
  private totalWords: number
  private chunkCount: number

  constructor(totalWords: number = 20000) {
    this.totalWords = totalWords
    this.chunkCount = Math.ceil(totalWords / CHUNK_SIZE)
    this.initializeChunksIndex()
  }

  /**
   * 初始化分片索引
   */
  private initializeChunksIndex() {
    chunksIndex = []
    for (let i = 0; i < this.chunkCount; i++) {
      chunksIndex.push({
        chunkId: i,
        startId: (i * CHUNK_SIZE).toString(),
        endId: ((i + 1) * CHUNK_SIZE - 1).toString(),
        wordCount: CHUNK_SIZE,
        loaded: false
      })
    }
  }

  /**
   * 加载指定分片
   */
  async loadChunk(chunkId: number): Promise<Word[]> {
    // 检查缓存
    if (loadedChunks.has(chunkId)) {
      return loadedChunks.get(chunkId)!
    }

    // 检查分片ID是否有效
    if (chunkId < 0 || chunkId >= this.chunkCount) {
      throw new Error(`无效的分片ID: ${chunkId}`)
    }

    try {
      // 动态导入分片文件
      const chunkModule = await import(`../data/chunks/chunk-${chunkId}.js`)
      const words = chunkModule.default || chunkModule.words || []

      // 缓存数据
      loadedChunks.set(chunkId, words)

      // 更新索引
      const chunkInfo = chunksIndex[chunkId]
      if (chunkInfo) {
        chunkInfo.loaded = true
      }

      return words
    } catch (error) {
      console.error(`加载分片 ${chunkId} 失败:`, error)

      // 返回空数组而不是抛出错误，允许应用继续运行
      return []
    }
  }

  /**
   * 预加载相邻分片
   */
  async preloadAdjacentChunks(currentChunkId: number): Promise<void> {
    const chunksToLoad: number[] = []

    // 前一个分片
    if (currentChunkId > 0) {
      chunksToLoad.push(currentChunkId - 1)
    }

    // 后一个分片
    if (currentChunkId < this.chunkCount - 1) {
      chunksToLoad.push(currentChunkId + 1)
    }

    // 并行加载
    await Promise.all(
      chunksToLoad.map(chunkId => this.loadChunk(chunkId))
    )
  }

  /**
   * 获取指定索引的单词
   */
  async getWordByIndex(index: number): Promise<Word | null> {
    if (index < 0 || index >= this.totalWords) {
      return null
    }

    const chunkId = Math.floor(index / CHUNK_SIZE)
    const wordIndexInChunk = index % CHUNK_SIZE

    const words = await this.loadChunk(chunkId)
    return words[wordIndexInChunk] || null
  }

  /**
   * 获取指定范围的单词
   */
  async getWordRange(startIndex: number, count: number): Promise<Word[]> {
    const words: Word[] = []
    const endIndex = Math.min(startIndex + count, this.totalWords)

    for (let i = startIndex; i < endIndex; i++) {
      const word = await this.getWordByIndex(i)
      if (word) {
        words.push(word)
      }
    }

    return words
  }

  /**
   * 获取分片信息
   */
  getChunksInfo(): WordChunkInfo[] {
    return [...chunksIndex]
  }

  /**
   * 获取已加载的单词总数
   */
  getLoadedWordsCount(): number {
    let count = 0
    for (const info of chunksIndex) {
      if (info.loaded) {
        count += info.wordCount
      }
    }
    return count
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    loadedChunks.clear()
    chunksIndex.forEach(info => {
      info.loaded = false
    })
  }

  /**
   * 获取总单词数
   */
  getTotalWords(): number {
    return this.totalWords
  }

  /**
   * 获取分片总数
   */
  getChunkCount(): number {
    return this.chunkCount
  }
}

/**
 * 创建全局词库加载器实例
 */
let wordLoader: WordLoader | null = null

export const getWordLoader = (totalWords?: number): WordLoader => {
  if (!wordLoader) {
    wordLoader = new WordLoader(totalWords)
  }
  return wordLoader
}

/**
 * 重置词库加载器
 */
export const resetWordLoader = (totalWords?: number): void => {
  wordLoader = new WordLoader(totalWords)
}
