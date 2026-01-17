/**
 * 为单词生成例句
 * 使用 Ollama 本地模型生成 2-10 个例句，包含不同词性用法
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 配置
const CONFIG = {
  ollamaEndpoint: 'http://localhost:11434',
  ollamaModel: 'qwen2.5:3b',
  inputFile: path.join(__dirname, '../src/data/filtered_words.json'),
  outputFile: path.join(__dirname, '../src/data/words_with_examples.json'),
  checkpointFile: path.join(__dirname, '../src/data/examples_checkpoint.json'),
  batchSize: 10,  // 测试批次大小
  delay: 500,      // 请求间隔（毫秒）
  minExamples: 2,  // 最少例句数
  maxExamples: 10  // 最多例句数
}

// 词性列表 - 为每个单词尝试生成不同词性的例句
const PARTS_OF_SPEECH = [
  'noun',          // 名词
  'verb',          // 动词
  'adjective',     // 形容词
  'adverb',        // 副词
  'preposition',   // 介词
  'conjunction',   // 连词
  'interjection'   // 感叹词
]

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
 * 加载检查点
 */
function loadCheckpoint() {
  try {
    if (fs.existsSync(CONFIG.checkpointFile)) {
      const content = fs.readFileSync(CONFIG.checkpointFile, 'utf-8')
      return JSON.parse(content)
    }
  } catch (error) {
    console.warn('加载检查点失败:', error.message)
  }
  return null
}

/**
 * 调用 Ollama API 生成例句
 */
async function generateExamples(word, partOfSpeech, scenario) {
  const prompt = `请为单词 "${word}" (${partOfSpeech}) 生成 2-4 个英语例句。

要求：
1. 句子长度在 6 到 14 个单词之间
2. 使用场景: ${scenario}
3. 句子要自然、实用，适合日常生活使用
4. 每个例句需要提供中文翻译
5. 每个例句要给出用法说明（简短短语）

输出格式（严格按照以下JSON格式）：
[
  {
    "sentence": "英文句子",
    "translation": "中文翻译",
    "scenario": "使用场景",
    "usage": "用法说明"
  }
]

请直接输出JSON数组，不要包含其他说明文字。`

  try {
    const response = await fetch(`${CONFIG.ollamaEndpoint}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: CONFIG.ollamaModel,
        prompt,
        stream: false,
        options: {
          temperature: 0.8,
          top_p: 0.9,
          num_predict: 500
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Ollama API 错误: ${response.status}`)
    }

    const data = await response.json()

    if (data?.error) {
      throw new Error(data.error)
    }

    return parseExamples(data.response, word)
  } catch (error) {
    console.error(`生成 "${word}" (${partOfSpeech}) 例句失败:`, error.message)
    return []
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
        usage: item.usage || ''
      }))
      .filter(item => item.sentence && item.translation)
  } catch (error) {
    console.error(`解析例句失败 (${word}):`, error.message)
    return []
  }
}

/**
 * 检测单词可能的词性（简单启发式）
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
 * 为单个单词生成所有例句
 */
async function generateExamplesForWord(wordInfo) {
  const { word, rank } = wordInfo
  const allExamples = []

  // 检测可能的词性
  const possiblePos = detectPossiblePos(word)

  console.log(`  为 "${word}" (rank ${rank}, 可能词性: ${possiblePos.join(', ')}) 生成例句...`)

  // 为每个词性生成例句
  for (const pos of possiblePos) {
    if (allExamples.length >= CONFIG.maxExamples) break

    const scenario = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)]
    const examples = await generateExamples(word, pos, scenario)

    for (const example of examples) {
      if (allExamples.length >= CONFIG.maxExamples) break

      // 检查是否已存在相似的例句
      const isDuplicate = allExamples.some(e =>
        e.sentence.toLowerCase() === example.sentence.toLowerCase()
      )

      if (!isDuplicate && example.sentence.toLowerCase().includes(word.toLowerCase())) {
        allExamples.push({
          ...example,
          partOfSpeech: pos
        })
      }
    }

    // 请求间延迟
    await new Promise(resolve => setTimeout(resolve, CONFIG.delay))
  }

  // 确保至少有最少数量的例句
  if (allExamples.length < CONFIG.minExamples) {
    console.warn(`    警告: "${word}" 只生成了 ${allExamples.length} 个例句`)
  }

  return {
    word,
    rank,
    examples: allExamples,
    exampleCount: allExamples.length
  }
}

/**
 * 批量生成例句
 */
async function generateBatch(words, startFrom = 0) {
  const results = {}
  const total = Math.min(words.length, CONFIG.batchSize)

  console.log(`\n开始生成例句...`)
  console.log(`批次大小: ${total}`)
  console.log(`起始位置: ${startFrom}`)

  for (let i = startFrom; i < total; i++) {
    const wordInfo = words[i]
    console.log(`\n[${i + 1}/${total}] 处理单词: "${wordInfo.word}"`)

    try {
      const result = await generateExamplesForWord(wordInfo)
      results[wordInfo.word] = result

      // 保存检查点
      saveCheckpoint({
        currentIndex: i,
        totalWords: total,
        completedWords: Object.keys(results).length,
        lastWord: wordInfo.word,
        timestamp: new Date().toISOString()
      })

      // 每处理完一个单词就保存一次结果
      saveResults(results)
    } catch (error) {
      console.error(`处理 "${wordInfo.word}" 时出错:`, error.message)
    }
  }

  return results
}

/**
 * 检查 Ollama 连接
 */
async function checkOllamaConnection() {
  try {
    const response = await fetch(`${CONFIG.ollamaEndpoint}/api/tags`)
    if (response.ok) {
      const data = await response.json()
      const models = data.models?.map(m => m.name) || []
      console.log(`✓ Ollama 服务已连接`)
      console.log(`  可用模型: ${models.join(', ') || '无'}`)
      return true
    }
  } catch (error) {
    console.error(`✗ 无法连接到 Ollama 服务 (${CONFIG.ollamaEndpoint})`)
    console.error(`  请确保 Ollama 已安装并运行: ollama serve`)
    return false
  }
  return false
}

/**
 * 主函数
 */
async function main() {
  console.log('========================================')
  console.log('  单词例句生成工具')
  console.log('========================================\n')

  // 检查 Ollama 连接
  const isConnected = await checkOllamaConnection()
  if (!isConnected) {
    process.exit(1)
  }

  // 加载单词
  console.log('\n加载单词列表...')
  const words = loadWords()
  console.log(`✓ 已加载 ${words.length} 个单词`)

  // 检查是否有未完成的任务
  const checkpoint = loadCheckpoint()
  let startFrom = 0

  if (checkpoint) {
    console.log(`\n发现未完成的任务:`)
    console.log(`  已完成: ${checkpoint.completedWords} 个单词`)
    console.log(`  最后处理: ${checkpoint.lastWord}`)
    console.log(`  时间: ${checkpoint.timestamp}`)

    // 询问是否继续（测试批次暂不继续）
    startFrom = CONFIG.batchSize  // 重新开始测试批次
  }

  // 生成例句
  const results = await generateBatch(words, startFrom)

  // 输出统计
  console.log('\n========================================')
  console.log('  生成完成')
  console.log('========================================')
  console.log(`总单词数: ${Object.keys(results).length}`)

  let totalExamples = 0
  for (const word in results) {
    totalExamples += results[word].exampleCount
  }
  console.log(`总例句数: ${totalExamples}`)
  console.log(`平均每词: ${(totalExamples / Object.keys(results).length).toFixed(1)} 个例句`)
  console.log(`\n结果已保存到: ${CONFIG.outputFile}`)

  // 显示示例
  console.log('\n========================================')
  console.log('  示例预览')
  console.log('========================================')
  const sampleWords = Object.keys(results).slice(0, 3)
  for (const word of sampleWords) {
    const data = results[word]
    console.log(`\n单词: ${word} (rank ${data.rank})`)
    console.log(`例句数: ${data.exampleCount}`)
    data.examples.forEach((ex, idx) => {
      console.log(`  ${idx + 1}. [${ex.partOfSpeech}] ${ex.sentence}`)
      console.log(`     ${ex.translation}`)
      if (ex.usage) console.log(`     用法: ${ex.usage}`)
    })
  }
}

// 运行
main().catch(error => {
  console.error('\n错误:', error)
  process.exit(1)
})
