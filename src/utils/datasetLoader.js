/**
 * 通用英语词表加载器
 * 优先使用过滤后的单词集（已去除小学初中词汇、动词时态、名词复数等）
 * 加载带例句的单词数据
 */

import filteredWordsData from '@data/filtered_words.json?raw'
import examplesWithWordsData from '@data/words_with_examples.json?raw'

const DEFAULT_DATASET_URL =
  'https://huggingface.co/datasets/Maximax67/English-Valid-Words/resolve/main/valid_words_sorted_by_frequency.csv'

// 缓存加载的例句数据
let cachedExamplesData = null

/**
 * 加载例句数据
 */
const loadExamplesData = () => {
  if (cachedExamplesData) {
    return cachedExamplesData
  }

  try {
    const data = JSON.parse(examplesWithWordsData)
    cachedExamplesData = data.words || {}
    return cachedExamplesData
  } catch (error) {
    console.error('加载例句数据失败:', error)
    return {}
  }
}

/**
 * 加载过滤后的英语单词集
 * 已过滤：
 * - 小学505词、初中1600词
 * - 动词时态变化（过去式、进行时、第三人称单数）
 * - 名词复数形式
 * - 单个字母
 */
export const loadEnglishWordDataset = async () => {
  try {
    const data = JSON.parse(filteredWordsData)
    // 返回单词数组
    return data.words.map((w) => w.word)
  } catch (error) {
    console.error('加载过滤后的单词集失败:', error)
    // 回退到空数组
    return []
  }
}

/**
 * 转换为单词记录（带例句）
 */
export const toWordRecords = (wordList) => {
  const examplesData = loadExamplesData()

  return wordList.map((word, index) => {
    // 从例句数据中获取该单词的例句
    const wordExamples = examplesData[word]

    // 处理例句格式
    let examples = []
    let definitions = []
    let phonetic = ''

    if (wordExamples && wordExamples.examples && wordExamples.examples.length > 0) {
      // 使用生成的例句
      examples = wordExamples.examples.map(ex => ({
        sentence: ex.sentence,
        translation: ex.translation,
        scenario: ex.scenario,
        usage: ex.usage
      }))

      // 从例句中提取词性信息作为定义
      const posMap = new Map()
      wordExamples.examples.forEach(ex => {
        if (ex.partOfSpeech && ex.usage) {
          if (!posMap.has(ex.partOfSpeech)) {
            posMap.set(ex.partOfSpeech, new Set())
          }
          posMap.get(ex.partOfSpeech).add(ex.usage)
        }
      })

      definitions = Array.from(posMap.entries()).map(([pos, usages]) => ({
        partOfSpeech: pos,
        meaning: Array.from(usages).join('、')
      }))
    }

    if (wordExamples?.definitions?.length) {
      definitions = wordExamples.definitions.map((item) => ({
        partOfSpeech: item.partOfSpeech || '',
        meaning: item.meaning || ''
      }))
    }

    if (wordExamples?.phonetic) {
      phonetic = wordExamples.phonetic
    }

    return {
      id: String(index + 1),
      word,
      phonetic,
      level: '通用',
      definitions,
      examples,
      collocations: [],
      synonyms: [],
      antonyms: [],
      scenarios: [],
      difficulty: 'intermediate',
      category: '其他'
    }
  })
}

/**
 * 保留原始 CSV 加载功能作为备用（暂不使用）
 */
const parseCsvLine = (line) => {
  const parts = line.split(',')
  return parts.map((item) => item.replace(/^"|"$/g, '').trim())
}

export const loadEnglishWordDatasetFromCSV = async (
  url = DEFAULT_DATASET_URL,
  limit = 20000
) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`词表下载失败: ${response.status}`)
  }

  const text = await response.text()
  const lines = text.split(/\r?\n/).filter(Boolean)
  if (lines.length <= 1) return []

  const words = []

  for (let i = 1; i < lines.length; i += 1) {
    const columns = parseCsvLine(lines[i])
    const word = columns[1] || ''
    if (!word) continue
    words.push(word)

    if (limit && words.length >= limit) {
      break
    }
  }

  return words
}

/**
 * 加载带例句的单词记录
 * 这个是主要使用的加载函数
 */
export const loadWordExamples = async () => {
  const wordList = await loadEnglishWordDataset()
  return toWordRecords(wordList)
}
