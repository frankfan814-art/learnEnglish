/**
 * 单词相关的 TypeScript 类型定义
 */

/** 词性定义 */
export type PartOfSpeech = 'n.' | 'v.' | 'adj.' | 'adv.' | 'prep.' | 'conj.' | 'int.' | 'pron.'

/** 难度等级 */
export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert'

/** 单词分类 */
export type WordCategory =
  | '日常用语'
  | '时间'
  | '人物关系'
  | '工作'
  | '学习'
  | '饮食'
  | '居住'
  | '交通'
  | '购物'
  | '运动'
  | '健康'
  | '情感'
  | '自然'
  | '动物'
  | '物品'
  | '形容词'
  | '动词'
  | '名词'
  | '其他'

/** 词义定义 */
export interface Definition {
  partOfSpeech: PartOfSpeech
  meaning: string
}

/** 例句定义 */
export interface Example {
  sentence: string
  translation: string
  audioUrl?: string
  usage?: string
}

/** 单词数据结构 */
export interface Word {
  id: string
  word: string
  phonetic: string
  definitions: Definition[]
  examples: Example[]
  collocations: string[]
  synonyms: string[]
  antonyms: string[]
  scenarios: string[]
  difficulty: Difficulty
  category: WordCategory
  timesStudied?: number
  lastStudiedAt?: string | null
}

/** AI 生成例句参数 */
export interface GenerateExamplesParams {
  word: string
  partOfSpeech: PartOfSpeech
  scenarios: string[]
  count?: number
  minLength?: number
  maxLength?: number
}

/** AI 生成例句结果 */
export interface GeneratedExample {
  sentence: string
  translation: string
  scenario?: string
  usage?: string
}

/** Ollama API 响应 */
export interface OllamaResponse {
  model: string
  created_at: string
  response: string
  done: boolean
}

/** Ollama 请求参数 */
export interface OllamaRequest {
  model: string
  prompt: string
  stream?: boolean
  options?: {
    temperature?: number
    top_p?: number
    num_predict?: number
  }
}

/** 词库分片信息 */
export interface WordChunkInfo {
  chunkId: number
  startId: string
  endId: string
  wordCount: number
  loaded: boolean
}
