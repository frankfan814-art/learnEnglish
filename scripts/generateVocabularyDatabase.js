#!/usr/bin/env node

/**
 * 词汇数据库生成脚本
 * 使用 Ollama 本地 AI 生成 20,000 个英语单词的完整学习数据
 *
 * 使用方法:
 * 1. 确保 Ollama 服务运行中: ollama serve
 * 2. 安装依赖: npm install node-fetch
 * 3. 运行脚本: node scripts/generateVocabularyDatabase.js
 *
 * 或者使用已存在的 ollama.ts 工具
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Ollama API 配置
const OLLAMA_API = 'http://localhost:11434/api/generate'
const MODEL = 'qwen2.5:7b' // 或 'qwen2.5:14b' 以获得更高质量

// 词汇等级定义
const VOCABULARY_LEVELS = {
  GAO_KAO: '高考',
  CET4: '四级',
  CET6: '六级',
  TEM8: '八级',
  IELTS: '雅思',
  TOEFL: '托福'
}

// 词性定义
const PARTS_OF_SPEECH = {
  NOUN: 'n.',
  VERB: 'v.',
  ADJECTIVE: 'adj.',
  ADVERB: 'adv.',
  PREPOSITION: 'prep.',
  CONJUNCTION: 'conj.',
  INTERJECTION: 'int.',
  PRONOUN: 'pron.'
}

/**
 * 调用 Ollama API 生成单词数据
 */
async function generateWordData(word, level) {
  const prompt = `请为英语单词 "${word}" (${level}词汇) 生成完整的学习数据，要求：

1. 音标 (IPA)
2. 所有词性及中文释义
3. 10-15个例句，必须覆盖：
   - 每个词性的用法
   - 不同的使用场景
   - 常见搭配
   - 每个例句包含：英文句子 + 中文翻译 + 用法说明
4. 常见词语搭配 (5-10个)
5. 同义词 (3-5个)
6. 反义词 (2-3个，如果有)
7. 使用场景标签

请以JSON格式返回，格式如下：
{
  "word": "单词",
  "phonetic": "音标",
  "level": "等级",
  "definitions": [
    {"partOfSpeech": "n.", "meaning": "名词释义"}
  ],
  "examples": [
    {"sentence": "英文句子", "translation": "中文翻译", "usage": "用法说明"}
  ],
  "collocations": ["搭配1", "搭配2"],
  "synonyms": ["同义词1", "同义词2"],
  "antonyms": ["反义词1"],
  "scenarios": ["场景1", "场景2"],
  "difficulty": "beginner/intermediate/advanced/expert",
  "category": "名词/动词/形容词等"
}

只返回JSON，不要其他文字。`

  try {
    const response = await fetch(OLLAMA_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          num_predict: 2000
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Ollama API 请求失败: ${response.status}`)
    }

    const data = await response.json()
    const generatedText = data.response

    // 提取 JSON
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('无法从响应中提取 JSON')
    }

    const wordData = JSON.parse(jsonMatch[0])
    wordData.id = generateId()

    return wordData
  } catch (error) {
    console.error(`生成单词 "${word}" 数据失败:`, error.message)
    return null
  }
}

/**
 * 生成唯一 ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

/**
 * 词汇源列表 (示例)
 * 实际使用时应该从文件或在线资源获取完整的词汇列表
 */
const vocabularyLists = {
  [VOCABULARY_LEVELS.GAO_KAO]: [
    'abandon', 'ability', 'absence', 'absolute', 'academic', 'accept', 'access',
    'accommodate', 'accompany', 'accomplish', 'account', 'accurate', 'achieve',
    'acknowledge', 'acquire', 'action', 'active', 'activity', 'actual', 'adapt',
    'addition', 'additional', 'address', 'adequate', 'adjust', 'administration',
    'admit', 'adopt', 'adult', 'advance', 'advanced', 'advantage', 'adventure',
    'advertise', 'advice', 'advise', 'affair', 'affect', 'afford', 'afraid',
    'agency', 'agenda', 'agent', 'aggressive', 'agree', 'agreement', 'agriculture'
    // ... 更多单词
  ],
  [VOCABULARY_LEVELS.CET4]: [
    'abroad', 'absence', 'absolute', 'absorb', 'abstract', 'abundant', 'abuse',
    'academic', 'accelerate', 'access', 'accessory', 'accident', 'accommodate',
    'accomplish', 'accordance', 'account', 'accumulate', 'accurate', 'accuse',
    'accustomed', 'achievement', 'acknowledge', 'acquaintance', 'acquire',
    'acquisition', 'action', 'activity', 'acute', 'adapt', 'addition', 'additional'
    // ... 更多单词
  ],
  [VOCABULARY_LEVELS.CET6]: [
    'abnormal', 'abolish', 'abort', 'abrupt', 'absurd', 'abundance', 'academic',
    'acceleration', 'access', 'accessory', 'accommodate', 'accomplishment',
    'accordance', 'accountability', 'accumulate', 'accuracy', 'acknowledge',
    'acquaintance', 'acquisition', 'adaptation', 'adequate', 'adjacent',
    'advocate', 'aesthetic', 'affiliate', 'aggravate', 'aggregate', 'aggressive'
    // ... 更多单词
  ],
  [VOCABULARY_LEVELS.TEM8]: [
    'abhor', 'abide', 'abortive', 'abound', 'abraham', 'abrasive', 'abreast',
    'abridge', 'abrogate', 'abscond', 'absence', 'absolve', 'abstain', 'abstemious',
    'abundant', 'abuse', 'abut', 'abysmal', 'abyss', 'acacia', 'academic',
    'accelerate', 'accent', 'accentuate', 'accept', 'access', 'accessible'
    // ... 更多单词
  ],
  [VOCABULARY_LEVELS.IELTS]: [
    'abbreviate', 'abdomen', 'abide', 'abolish', 'abortion', 'abound', 'abraham',
    'abrasive', 'abreast', 'abridge', 'abrogate', 'abscond', 'absence', 'absolve',
    'abstain', 'abstemious', 'abundant', 'abuse', 'abut', 'abysmal', 'abyss',
    'academic', 'accelerate', 'accent', 'accentuate', 'acceptable', 'access'
    // ... 更多单词
  ],
  [VOCABULARY_LEVELS.TOEFL]: [
    'abate', 'abbreviate', 'abdomen', 'abide', 'abolish', 'abortion', 'abound',
    'abrasive', 'abreast', 'abridge', 'abrogate', 'abscond', 'absence', 'absolve',
    'abstain', 'abstemious', 'abundant', 'abuse', 'abut', 'abysmal', 'abyss',
    'academic', 'academy', 'accelerate', 'acceleration', 'accent', 'accentuate'
    // ... 更多单词
  ]
}

/**
 * 批量生成单词数据
 */
async function generateBatch(words, level, batchSize = 10) {
  const results = []
  const total = words.length

  for (let i = 0; i < total; i += batchSize) {
    const batch = words.slice(i, i + batchSize)
    const batchNum = Math.floor(i / batchSize) + 1
    const totalBatches = Math.ceil(total / batchSize)

    console.log(`\n处理批次 ${batchNum}/${totalBatches} (${level})`)

    const batchPromises = batch.map(async (word) => {
      console.log(`  生成: ${word}...`)
      const data = await generateWordData(word, level)
      if (data) {
        console.log(`  ✓ ${word} 完成`)
        return data
      } else {
        console.log(`  ✗ ${word} 失败`)
        return null
      }
    })

    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults.filter(Boolean))

    // 保存进度
    await saveProgress(results, level)

    // 添加延迟以避免过载
    await sleep(1000)
  }

  return results
}

/**
 * 保存进度
 */
async function saveProgress(data, level) {
  const outputPath = path.join(__dirname, '../src/data/generated', `${level.toLowerCase()}_progress.json`)

  // 确保目录存在
  const dir = path.dirname(outputPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8')
  console.log(`  进度已保存: ${outputPath}`)
}

/**
 * 延迟函数
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 生成完整数据库
 */
async function generateFullDatabase() {
  console.log('========================================')
  console.log('开始生成词汇数据库')
  console.log('========================================')
  console.log(`模型: ${MODEL}`)
  console.log(`API: ${OLLAMA_API}`)
  console.log('')

  const allWords = []

  // 检查 Ollama 连接
  try {
    const response = await fetch('http://localhost:11434/api/tags')
    if (!response.ok) {
      throw new Error('Ollama 服务未运行')
    }
    console.log('✓ Ollama 连接成功\n')
  } catch (error) {
    console.error('✗ 无法连接到 Ollama 服务')
    console.error('  请确保 Ollama 正在运行: ollama serve')
    console.error('  并安装模型: ollama pull qwen2.5:7b')
    process.exit(1)
  }

  // 逐个等级生成
  for (const [level, words] of Object.entries(vocabularyLists)) {
    if (words.length === 0) continue

    console.log(`\n========================================`)
    console.log(`生成 ${level} 词汇 (${words.length} 个单词)`)
    console.log('========================================')

    const levelWords = await generateBatch(words, level)
    allWords.push(...levelWords)

    console.log(`\n✓ ${level} 完成: ${levelWords.length}/${words.length} 个单词`)
  }

  // 保存完整数据库
  const finalPath = path.join(__dirname, '../src/data/vocabularyDatabase.js')
  const dbContent = generateDatabaseFile(allWords)

  fs.writeFileSync(finalPath, dbContent, 'utf-8')
  console.log('\n========================================')
  console.log('✓ 数据库生成完成!')
  console.log(`✓ 总计: ${allWords.length} 个单词`)
  console.log(`✓ 文件: ${finalPath}`)
  console.log('========================================')
}

/**
 * 生成数据库文件内容
 */
function generateDatabaseFile(words) {
  return `/**
 * 20,000 English Words Database
 * 来源: 高考、四级、六级、八级、雅思、托福
 * 自动生成时间: ${new Date().toLocaleString('zh-CN')}
 */

const VOCABULARY_LEVELS = {
  GAO_KAO: '高考',
  CET4: '四级',
  CET6: '六级',
  TEM8: '八级',
  IELTS: '雅思',
  TOEFL: '托福'
}

const wordDatabase = ${JSON.stringify(words, null, 2)}

export function getAllWords() {
  return wordDatabase
}

export function getWordsByLevel(level) {
  return wordDatabase.filter(word => word.level === level)
}

export function getTotalWordCount() {
  return wordDatabase.length
}

export { VOCABULARY_LEVELS }
`
}

/**
 * 生成指定等级的词汇
 */
async function generateLevel(level, count = 100) {
  const words = vocabularyLists[level].slice(0, count)
  console.log(`生成 ${level} 词汇 (${count} 个)...`)

  const results = await generateBatch(words, level)
  console.log(`\n✓ 完成: ${results.length}/${count} 个单词`)

  return results
}

// 命令行参数处理
const args = process.argv.slice(2)
const command = args[0]

if (command === 'test') {
  // 测试模式：生成几个单词
  console.log('测试模式：生成少量单词\n')
  await generateLevel(VOCABULARY_LEVELS.GAO_KAO, 5)
} else if (command === 'level') {
  // 生成指定等级
  const level = args[1] || VOCABULARY_LEVELS.GAO_KAO
  const count = parseInt(args[2]) || 50
  await generateLevel(level, count)
} else if (command === 'full') {
  // 生成完整数据库
  await generateFullDatabase()
} else {
  // 默认：显示帮助
  console.log('词汇数据库生成脚本')
  console.log('')
  console.log('使用方法:')
  console.log('  node scripts/generateVocabularyDatabase.js test')
  console.log('      测试模式：生成5个单词')
  console.log('')
  console.log('  node scripts/generateVocabularyDatabase.js level <等级> <数量>')
  console.log('      生成指定等级的词汇')
  console.log('      等级: 高考, 四级, 六级, 八级, 雅思, 托福')
  console.log('      数量: 默认 50')
  console.log('')
  console.log('  node scripts/generateVocabularyDatabase.js full')
  console.log('      生成完整数据库 (20,000+ 单词)')
  console.log('')
  console.log('示例:')
  console.log('  node scripts/generateVocabularyDatabase.js test')
  console.log('  node scripts/generateVocabularyDatabase.js level 高考 20')
  console.log('  node scripts/generateVocabularyDatabase.js full')
  console.log('')
  console.log('注意事项:')
  console.log('  1. 确保 Ollama 服务运行: ollama serve')
  console.log('  2. 安装模型: ollama pull qwen2.5:7b')
  console.log('  3. 生成完整数据库需要很长时间 (预计 100+ 小时)')
  console.log('  4. 建议分批次生成，每批 50-100 个单词')
}
