/**
 * 使用 DeepSeek API 为单词生成例句
 * 支持并发处理，速度快
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 从 .env 或 .env.local 文件加载配置
function loadEnv() {
  const envPaths = [
    path.join(__dirname, '../.env'),
    path.join(__dirname, '../.env.local')
  ]

  const env = {}
  for (const envPath of envPaths) {
    try {
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8')
        content.split('\n').forEach(line => {
          const match = line.match(/^([^=]+)=(.*)$/)
          if (match && !line.startsWith('#')) {
            env[match[1]] = match[2]
          }
        })
        console.log(`✓ 已加载配置文件: ${path.basename(envPath)}`)
        break
      }
    } catch (error) {
      console.warn(`无法读取 ${envPath}:`, error.message)
    }
  }
  return env
}

const env = loadEnv()

const CONFIG = {
  apiKey: env.DEEPSEEK_API_KEY || '',
  endpoint: env.DEEPSEEK_ENDPOINT || 'https://api.deepseek.com/v1/chat/completions',
  model: env.DEEPSEEK_MODEL || 'deepseek-chat',
  inputFile: path.join(__dirname, '../src/data/filtered_words.json'),
  outputFile: path.join(__dirname, '../src/data/words_with_examples.json'),
  checkpointFile: path.join(__dirname, '../src/data/examples_checkpoint.json'),
  batchSize: 10,      // 测试批次大小
  concurrency: 5,     // 并发请求数
  minExamples: 2,     // 最少例句数
  maxExamples: 10     // 最多例句数
}

// 使用场景
const SCENARIOS = [
  '日常对话',
  '商务会议',
  '学术写作',
  '新闻报道',
  '社交媒体',
  '正式邮件'
]

/**
 * 读取过滤后的单词列表
 */
function loadWords() {
  try {
    const content = fs.readFileSync(CONFIG.inputFile, 'utf-8')
    const data = JSON.parse(content)
    return data.words || []
  } catch (error) {
    console.error('读取单词文件失败:', error.message)
    return []
  }
}

/**
 * 保存结果到文件
 */
function saveResults(results) {
  const output = {
    generated: new Date().toISOString(),
    totalWords: Object.keys(results).length,
    words: results
  }
  fs.writeFileSync(CONFIG.outputFile, JSON.stringify(output, null, 2), 'utf-8')
}

/**
 * 保存检查点
 */
function saveCheckpoint(checkpoint) {
  fs.writeFileSync(CONFIG.checkpointFile, JSON.stringify(checkpoint, null, 2), 'utf-8')
}

/**
 * 检测单词可能的词性
 */
function detectPossiblePos(word) {
  const wordLower = word.toLowerCase()
  const possiblePos = []

  // 名词后缀
  if (wordLower.endsWith('tion') || wordLower.endsWith('sion') ||
      wordLower.endsWith('ment') || wordLower.endsWith('ness') ||
      wordLower.endsWith('ity') || wordLower.endsWith('ance') ||
      wordLower.endsWith('ence') || wordLower.endsWith('ship') ||
      wordLower.endsWith('dom') || wordLower.endsWith('hood')) {
    possiblePos.push('noun')
  }

  // 形容词后缀
  if (wordLower.endsWith('able') || wordLower.endsWith('ible') ||
      wordLower.endsWith('al') || wordLower.endsWith('ful') ||
      wordLower.endsWith('ic') || wordLower.endsWith('ive') ||
      wordLower.endsWith('ous') || wordLower.endsWith('ent') ||
      wordLower.endsWith('ant') || wordLower.endsWith('y')) {
    possiblePos.push('adjective')
  }

  // 副词后缀
  if (wordLower.endsWith('ly')) {
    possiblePos.push('adverb')
  }

  // 动词后缀
  if (wordLower.endsWith('ize') || wordLower.endsWith('ate') ||
      wordLower.endsWith('ify') || wordLower.endsWith('en')) {
    possiblePos.push('verb')
  }

  // 如果没有检测到特定词性，默认添加名词和动词
  if (possiblePos.length === 0) {
    possiblePos.push('noun', 'verb')
  }

  return possiblePos
}

/**
 * 调用 DeepSeek API 生成例句
 */
async function generateExamplesForWord(word, rank) {
  const possiblePos = detectPossiblePos(word)
  const scenario = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)]

  const prompt = `请为英语单词 "${word}" 生成 2-10 个例句。

单词可能的词性包括: ${possiblePos.join(', ')}

要求：
1. 为每个适用的词性至少生成 1 个例句
2. 句子长度在 6 到 14 个单词之间
3. 使用场景包括: ${SCENARIOS.join(', ')}
4. 句子要自然、实用，适合日常生活使用
5. 每个例句需要提供准确的中文翻译
6. 标注每个例句使用的词性
7. 给出用法说明（简短短语）

输出格式（严格按照以下JSON格式）：
[
  {
    "sentence": "英文句子",
    "translation": "中文翻译",
    "scenario": "使用场景",
    "usage": "用法说明",
    "partOfSpeech": "词性"
  }
]

请直接输出JSON数组，不要包含其他说明文字。确保例句中包含单词 "${word}"。`

  try {
    const response = await fetch(CONFIG.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.apiKey}`
      },
      body: JSON.stringify({
        model: CONFIG.model,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的英语教学助手，擅长生成高质量的英语例句。请严格按照要求输出JSON格式的例句。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 2000,
        stream: false
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`DeepSeek API 错误: ${response.status} - ${errorText}`)
    }

    const data = await response.json()

    if (data?.error) {
      throw new Error(data.error.message || JSON.stringify(data.error))
    }

    const content = data.choices?.[0]?.message?.content || ''
    const examples = parseExamples(content, word)

    // 过滤掉不包含该单词的例句
    const validExamples = examples.filter(ex =>
      ex.sentence.toLowerCase().includes(word.toLowerCase())
    )

    return {
      word,
      rank,
      possiblePos,
      examples: validExamples,
      exampleCount: validExamples.length
    }
  } catch (error) {
    console.error(`生成 "${word}" 例句失败:`, error.message)
    return {
      word,
      rank,
      possiblePos,
      examples: [],
      exampleCount: 0
    }
  }
}

/**
 * 解析 AI 返回的例句
 */
function parseExamples(text, word) {
  try {
    if (!text || typeof text !== 'string') {
      return []
    }

    // 尝试提取 JSON 数组
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.warn(`未找到 JSON 数组: ${word}`)
      return []
    }

    const examples = JSON.parse(jsonMatch[0])

    if (!Array.isArray(examples)) {
      return []
    }

    return examples
      .map(item => ({
        sentence: item.sentence || '',
        translation: item.translation || '',
        scenario: item.scenario || '',
        usage: item.usage || '',
        partOfSpeech: item.partOfSpeech || 'unknown'
      }))
      .filter(item => item.sentence && item.translation)
  } catch (error) {
    console.error(`解析例句失败 (${word}):`, error.message)
    return []
  }
}

/**
 * 并发处理一批单词
 */
async function processBatch(words) {
  const results = {}
  const total = words.length
  let completed = 0

  console.log(`\n处理 ${total} 个单词 (并发数: ${CONFIG.concurrency})...`)

  // 分批并发处理
  for (let i = 0; i < total; i += CONFIG.concurrency) {
    const batch = words.slice(i, Math.min(i + CONFIG.concurrency, total))
    const promises = batch.map(wordInfo =>
      generateExamplesForWord(wordInfo.word, wordInfo.rank)
    )

    const batchResults = await Promise.all(promises)

    for (const result of batchResults) {
      results[result.word] = result
      completed++

      console.log(`  [${completed}/${total}] "${result.word}": ${result.exampleCount} 个例句`)
    }

    // 每批次保存一次
    saveResults(results)
    saveCheckpoint({
      currentIndex: i + batch.length,
      totalWords: total,
      completedWords: completed,
      lastWord: batch[batch.length - 1].word,
      timestamp: new Date().toISOString()
    })
  }

  return results
}

/**
 * 主函数
 */
async function main() {
  console.log('========================================')
  console.log('  DeepSeek 单词例句生成工具')
  console.log('========================================\n')

  // 检查 API Key
  if (!CONFIG.apiKey || CONFIG.apiKey === 'your_api_key_here') {
    console.error('错误: 请在 .env 文件中设置 DEEPSEEK_API_KEY')
    process.exit(1)
  }

  console.log(`API 端点: ${CONFIG.endpoint}`)
  console.log(`使用模型: ${CONFIG.model}`)

  // 加载单词
  console.log('\n加载单词列表...')
  const words = loadWords()
  console.log(`✓ 已加载 ${words.length} 个单词`)

  // 处理指定批次的单词
  const wordsToProcess = words.slice(0, CONFIG.batchSize)
  console.log(`\n将处理前 ${CONFIG.batchSize} 个单词...`)

  const startTime = Date.now()
  const results = await processBatch(wordsToProcess)
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

  // 输出统计
  console.log('\n========================================')
  console.log('  生成完成')
  console.log('========================================')
  console.log(`总单词数: ${Object.keys(results).length}`)
  console.log(`耗时: ${elapsed} 秒`)

  let totalExamples = 0
  let zeroCount = 0
  for (const word in results) {
    const count = results[word].exampleCount
    totalExamples += count
    if (count === 0) zeroCount++
  }
  console.log(`总例句数: ${totalExamples}`)
  console.log(`平均每词: ${(totalExamples / Object.keys(results).length).toFixed(1)} 个例句`)
  console.log(`失败数: ${zeroCount}`)
  console.log(`\n结果已保存到: ${CONFIG.outputFile}`)

  // 显示示例
  console.log('\n========================================')
  console.log('  示例预览')
  console.log('========================================')
  const sampleWords = Object.keys(results).slice(0, 3)
  for (const word of sampleWords) {
    const data = results[word]
    console.log(`\n单词: ${word} (rank ${data.rank})`)
    console.log(`可能词性: ${data.possiblePos.join(', ')}`)
    console.log(`例句数: ${data.exampleCount}`)
    if (data.examples.length > 0) {
      data.examples.slice(0, 3).forEach((ex, idx) => {
        console.log(`  ${idx + 1}. [${ex.partOfSpeech}] ${ex.sentence}`)
        console.log(`     ${ex.translation}`)
        if (ex.usage) console.log(`     用法: ${ex.usage}`)
      })
      if (data.examples.length > 3) {
        console.log(`  ... 还有 ${data.examples.length - 3} 个例句`)
      }
    }
  }
}

// 运行
main().catch(error => {
  console.error('\n错误:', error)
  process.exit(1)
})
