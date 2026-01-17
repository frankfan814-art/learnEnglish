import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const config = {
  provider: (process.env.LLM_PROVIDER || 'deepseek').toLowerCase(),
  endpoint: process.env.OLLAMA_ENDPOINT || 'http://localhost:11434',
  model: process.env.OLLAMA_MODEL || 'qwen2:1.5b',
  dsEndpoint: process.env.DEEPSEEK_ENDPOINT || 'https://api.deepseek.com/v1/chat/completions',
  dsModel: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
  dsApiKey: process.env.DEEPSEEK_API_KEY || '',
  useDataset: process.env.USE_DATASET === '1',
  datasetUrl: process.env.DATASET_URL || 'https://huggingface.co/datasets/Maximax67/English-Valid-Words/resolve/main/valid_words_sorted_by_frequency.csv',
  datasetCache: path.resolve(__dirname, '../src/data/generated/dataset.csv'),
  totalWords: Number(process.env.TOTAL_WORDS || 20000),
  examplesPerWord: Number(process.env.EXAMPLES_PER_WORD || 10),
  chunkSize: Number(process.env.CHUNK_SIZE || 500),
  wordBatchSize: Number(process.env.WORD_BATCH_SIZE || 10),
  minLength: Number(process.env.MIN_LEN || 6),
  maxLength: Number(process.env.MAX_LEN || 14),
  outDir: path.resolve(__dirname, '../src/data/chunks'),
  generatedDir: path.resolve(__dirname, '../src/data/generated'),
  wordListFile: path.resolve(__dirname, '../src/data/generated/word-list.json'),
  progressFile: path.resolve(__dirname, '../src/data/generated/progress.json')
}

const ALL_LEVELS = ['高考', '四级', '六级', '八级', '雅思', '托福']
const TARGET_LEVELS = (process.env.TARGET_LEVELS || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean)
const ACTIVE_LEVELS = TARGET_LEVELS.length > 0
  ? TARGET_LEVELS.filter((level) => ALL_LEVELS.includes(level))
  : ALL_LEVELS

const LEVEL_TO_DIFFICULTY = {
  高考: 'intermediate',
  四级: 'intermediate',
  六级: 'advanced',
  八级: 'expert',
  雅思: 'advanced',
  托福: 'advanced'
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const ensureDir = async (dir) => {
  await fs.mkdir(dir, { recursive: true })
}

const downloadFile = async (url, outFile) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`下载数据集失败: ${response.status}`)
  }
  const data = await response.arrayBuffer()
  await fs.writeFile(outFile, Buffer.from(data))
}

const loadDatasetWords = async () => {
  await ensureDir(config.generatedDir)

  try {
    await fs.access(config.datasetCache)
  } catch {
    await downloadFile(config.datasetUrl, config.datasetCache)
  }

  const text = await fs.readFile(config.datasetCache, 'utf-8')
  const lines = text.split(/\r?\n/).filter(Boolean)
  const words = []

  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i]
    const parts = line.split(',')
    const rawWord = parts[1] || ''
    const word = rawWord.replace(/^"|"$/g, '').trim()
    if (!word) continue
    words.push(word)
  }

  return words
}

const getLevelSlug = (level) => {
  return level
    .replace(/\s+/g, '')
    .replace('高考', 'gaokao')
    .replace('四级', 'cet4')
    .replace('六级', 'cet6')
    .replace('八级', 'tem8')
    .replace('雅思', 'ielts')
    .replace('托福', 'toefl')
}

const readJson = async (filePath, fallback) => {
  try {
    const text = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(text)
  } catch {
    return fallback
  }
}

const writeJson = async (filePath, data) => {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

const callOllama = async (prompt) => {
  const response = await fetch(`${config.endpoint}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.model,
      prompt,
      stream: false,
      format: 'json',
      options: {
        temperature: 0.7,
        top_p: 0.9,
        num_predict: 1500
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

  return data.response
}

const callDeepSeek = async (prompt) => {
  if (!config.dsApiKey) {
    throw new Error('缺少 DEEPSEEK_API_KEY')
  }

  const response = await fetch(config.dsEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.dsApiKey}`
    },
    body: JSON.stringify({
      model: config.dsModel,
      messages: [
        { role: 'system', content: '你是一个严谨的词库与例句生成助手。输出必须是纯 JSON。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7
    })
  })

  if (!response.ok) {
    throw new Error(`DeepSeek API 错误: ${response.status}`)
  }

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('DeepSeek 返回内容为空')
  }
  return content
}

const callLLM = async (prompt) => {
  if (config.provider === 'ollama') {
    return callOllama(prompt)
  }
  return callDeepSeek(prompt)
}

const extractJson = (text) => {
  if (!text || typeof text !== 'string') {
    throw new Error('空响应')
  }

  // 若已是 JSON
  try {
    const parsed = JSON.parse(text)
    if (Array.isArray(parsed)) return parsed
    if (parsed && Array.isArray(parsed.items)) return parsed.items
    if (parsed && Array.isArray(parsed.words)) return parsed.words
    if (parsed && parsed.word) return [parsed]
  } catch {
    // ignore
  }

  const match = text.match(/\[[\s\S]*\]/)
  if (!match) {
    throw new Error('未找到 JSON 数组')
  }
  return JSON.parse(match[0])
}

const buildWordListPrompt = (count, excludeWords = []) => {
  const excludeText = excludeWords.length > 0
    ? `以下单词已存在，请不要生成（避免重复）：${excludeWords.join(', ')}。`
    : ''

  return `请生成 ${count} 个英语单词，词汇等级必须来自：${ACTIVE_LEVELS.join('、')}。

要求：
1. 单词唯一、不重复
2. 每个单词输出一个词性（n./v./adj./adv./prep./conj./int./pron.）
3. 输出严格为 JSON 数组
4. ${excludeText}

JSON 格式：
[
  {"word":"abandon","level":"高考","partOfSpeech":"v."}
]

请只输出 JSON。`
}

const buildWordDetailPrompt = (item) => {
  return `请为英语单词 "${item.word}" 生成结构化信息。

词汇等级：从以下中选择一个：${ACTIVE_LEVELS.join('、')}
词性：从以下中选择一个：n./v./adj./adv./prep./conj./int./pron.

要求：
1. 输出严格 JSON
2. 生成 1 条中文释义
3. 生成 ${config.examplesPerWord} 条例句（英文 + 中文翻译 + 用法说明短语 + 场景）
4. 句子长度 ${config.minLength}-${config.maxLength} 个英文单词
5. 句子自然、常用、生活化

输出格式：
{
  "level": "高考",
  "partOfSpeech": "n.",
  "definition": "中文释义",
  "examples": [
    {
      "sentence": "英文句子",
      "translation": "中文翻译",
      "usage": "用法说明",
      "scenario": "场景"
    }
  ]
}

只输出 JSON。`
}

const normalizeWord = (word) => word.trim().toLowerCase()

const generateWordListBatch = async (count, excludeWords = []) => {
  const prompt = buildWordListPrompt(count, excludeWords)
  const response = await callLLM(prompt)
  return extractJson(response)
}

const toWordItem = (rawItem) => {
  if (!rawItem) return null
  const item = typeof rawItem === 'string'
    ? { word: rawItem }
    : rawItem

  if (!item?.word) return null

  const level = ACTIVE_LEVELS.includes(item.level) ? item.level : ACTIVE_LEVELS[0] || '高考'
  const partOfSpeech = item.partOfSpeech || 'n.'

  return {
    word: item.word,
    level,
    partOfSpeech
  }
}

const fillUniqueBatch = async (targetCount, seen) => {
  const results = []
  const attemptsLimit = 8
  let attempts = 0

  while (results.length < targetCount && attempts < attemptsLimit) {
    attempts += 1
    const excludeWords = Array.from(seen).slice(-50)
    const batch = await generateWordListBatch(targetCount, excludeWords)

    for (const rawItem of batch) {
      const item = toWordItem(rawItem)
      if (!item) continue

      const key = normalizeWord(item.word)
      if (seen.has(key)) continue
      seen.add(key)
      results.push(item)

      if (results.length >= targetCount) break
    }

    if (results.length < targetCount) {
      await sleep(300)
    }
  }

  return results
}

const generateWordList = async () => {
  if (config.useDataset) {
    const datasetWords = await loadDatasetWords()
    const seen = new Set()
    const words = []

    for (const rawWord of datasetWords) {
      const key = normalizeWord(rawWord)
      if (seen.has(key)) continue
      seen.add(key)
      words.push({
        word: rawWord,
        level: '',
        partOfSpeech: ''
      })
      if (words.length >= config.totalWords) break
    }

    await writeJson(config.wordListFile, words)
    return words
  }

  const existing = await readJson(config.wordListFile, [])
  const words = Array.isArray(existing) ? existing : []
  const seen = new Set(words.map((w) => normalizeWord(w.word)))

  while (words.length < config.totalWords) {
    const remaining = config.totalWords - words.length
    const preferredBatch = Math.min(config.wordBatchSize, remaining)
    const batchSizes = [preferredBatch]
    let batch = null

    for (const size of batchSizes) {
      try {
        batch = await fillUniqueBatch(size, seen)
        break
      } catch (error) {
        console.warn(`词表生成失败，尝试缩小批量到 ${size}：`, error.message)
        await sleep(300)
      }
    }

    if (!batch || batch.length === 0) {
      throw new Error('词表生成失败：多次重试仍未返回有效 JSON')
    }

    for (const item of batch) {
      words.push(item)
      if (words.length >= config.totalWords) break
    }

    await writeJson(config.wordListFile, words)
    await sleep(300)
  }

  return words
}

const createWordRecord = (item, detail, index) => {
  const level = ACTIVE_LEVELS.includes(detail.level)
    ? detail.level
    : (ACTIVE_LEVELS.includes(item.level) ? item.level : ACTIVE_LEVELS[0])
  const partOfSpeech = detail.partOfSpeech || item.partOfSpeech || 'n.'

  return {
    id: String(index + 1),
    word: item.word,
    phonetic: '',
    level,
    definitions: [
      {
        partOfSpeech,
        meaning: detail.definition || ''
      }
    ],
    examples: detail.examples || [],
    collocations: [],
    synonyms: [],
    antonyms: [],
    scenarios: (detail.examples || []).map((ex) => ex.scenario).filter(Boolean),
    difficulty: LEVEL_TO_DIFFICULTY[level] || 'intermediate',
    category: partOfSpeech === 'v.' ? '动词' : '名词'
  }
}

const writeChunk = async (chunkId, words, level) => {
  const content = `const words = ${JSON.stringify(words, null, 2)}\n\nexport default words\n`
  const levelSlug = level ? getLevelSlug(level) : 'all'
  const outDir = level ? path.join(config.outDir, levelSlug) : config.outDir
  await ensureDir(outDir)
  const outFile = path.join(outDir, `chunk-${chunkId}.js`)
  await fs.writeFile(outFile, content, 'utf-8')
}

const getLevelWordListPath = (level) => {
  const levelSlug = getLevelSlug(level)
  return path.resolve(__dirname, `../src/data/generated/word-list-${levelSlug}.json`)
}

const parseDetailResponse = (text) => {
  if (!text || typeof text !== 'string') {
    return {}
  }
  try {
    return JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return {}
    try {
      return JSON.parse(match[0])
    } catch {
      return {}
    }
  }
}

const main = async () => {
  await ensureDir(config.outDir)
  await ensureDir(config.generatedDir)

  const wordList = await generateWordList()
  const progress = await readJson(config.progressFile, { index: 0 })
  let currentIndex = progress.index || 0
  let chunkId = Math.floor(currentIndex / config.chunkSize)
  let chunk = []

  const levelChunks = new Map()
  const levelChunkIds = new Map()

  for (const level of ACTIVE_LEVELS) {
    levelChunks.set(level, [])
    levelChunkIds.set(level, 0)
  }

  const heartbeat = setInterval(async () => {
    try {
      await writeJson(config.progressFile, {
        index: currentIndex,
        updatedAt: new Date().toISOString()
      })
    } catch {
      // ignore heartbeat write errors
    }
  }, 10000)

  const levelWordLists = new Map()
  for (const level of ACTIVE_LEVELS) {
    levelWordLists.set(level, [])
  }

  while (currentIndex < config.totalWords) {
    const item = wordList[currentIndex]
    if (!item) break

    try {
      const detailPrompt = buildWordDetailPrompt(item)
      const response = await callLLM(detailPrompt)
      const detail = parseDetailResponse(response)

      const record = createWordRecord(item, detail, currentIndex)
      chunk.push(record)

      const list = levelWordLists.get(record.level)
      if (list) {
        list.push({
          word: record.word,
          level: record.level,
          partOfSpeech: record.definitions[0]?.partOfSpeech || 'n.'
        })
      }

      if (chunk.length >= config.chunkSize) {
        await writeChunk(chunkId, chunk)
        chunkId += 1
        chunk = []
      }

      // 分级词库写入
      if (record.level && levelChunks.has(record.level)) {
        const levelBuffer = levelChunks.get(record.level)
        const levelChunkId = levelChunkIds.get(record.level)
        levelBuffer.push(record)

        if (levelBuffer.length >= config.chunkSize) {
          await writeChunk(levelChunkId, levelBuffer, record.level)
          levelChunks.set(record.level, [])
          levelChunkIds.set(record.level, levelChunkId + 1)
        }
      }

      currentIndex += 1
      await writeJson(config.progressFile, {
        index: currentIndex,
        updatedAt: new Date().toISOString()
      })
      await sleep(200)
    } catch (error) {
      console.error(`生成失败：${item.word}`, error.message)
      await sleep(500)
    }
  }

  if (chunk.length > 0) {
    await writeChunk(chunkId, chunk)
  }

  // 写入分级词库尾块与列表文件
  for (const level of ACTIVE_LEVELS) {
    const levelBuffer = levelChunks.get(level)
    if (levelBuffer && levelBuffer.length > 0) {
      const levelChunkId = levelChunkIds.get(level)
      await writeChunk(levelChunkId, levelBuffer, level)
    }

    const levelWords = levelWordLists.get(level) || []
    await writeJson(getLevelWordListPath(level), levelWords)
  }

  await writeJson(config.wordListFile, wordList)

  clearInterval(heartbeat)
  console.log('生成完成')
}

main().catch((error) => {
  console.error('生成过程中出错:', error)
  process.exit(1)
})
