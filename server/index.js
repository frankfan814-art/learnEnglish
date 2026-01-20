import express from 'express'
import cors from 'cors'
import fs from 'fs/promises'
import path from 'path'
import dotenv from 'dotenv'
import { fetch } from 'undici'
import { getDatabase } from '../database/index.js'

const app = express()
const port = process.env.PORT || 3001

// 初始化数据库
let db = null
try {
  db = getDatabase()
  console.log('✓ 数据库连接成功')
} catch (error) {
  console.error('✗ 数据库连接失败:', error.message)
}

const localEnvPath = path.resolve(process.cwd(), '.env.local')
dotenv.config({ path: localEnvPath })
dotenv.config()

app.use(cors())
app.use(express.json({ limit: '1mb' }))

const DATA_FILE_PATH = path.resolve(
  process.cwd(),
  'src',
  'data',
  'words_with_examples.json'
)

const buildPrompt = (word, count = 10) => {
  return `请为英语单词 "${word}" 生成 ${count} 个例句。

要求：
1. 为每个适用的词性（名词、动词、形容词等）至少生成 1 个例句
2. 句子长度在 6 到 14 个单词之间
3. 使用场景包括：日常对话、商务会议、学术写作、新闻报道、社交媒体、正式邮件
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
}

const extractJsonArray = (text) => {
  if (!text || typeof text !== 'string') return []
  try {
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) return []
    const parsed = JSON.parse(match[0])
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const extractJsonObject = (text) => {
  if (!text || typeof text !== 'string') return null
  try {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return null
    return JSON.parse(match[0])
  } catch {
    return null
  }
}

const getApiKey = (override) => {
  return (
    override ||
    process.env.DEEPSEEK_API_KEY ||
    process.env.VITE_DEEPSEEK_API_KEY ||
    ''
  )
}

const getModel = (override) => {
  return (
    override ||
    process.env.DEEPSEEK_MODEL ||
    process.env.VITE_DEEPSEEK_MODEL ||
    'deepseek-chat'
  )
}

const getEndpoint = (override) => {
  return (
    override ||
    process.env.DEEPSEEK_ENDPOINT ||
    process.env.VITE_DEEPSEEK_ENDPOINT ||
    'https://api.deepseek.com/v1/chat/completions'
  )
}

const getOllamaEndpoint = (override) => {
  return override || process.env.OLLAMA_ENDPOINT || 'http://localhost:11434'
}

const getOllamaModel = (override) => {
  return override || process.env.OLLAMA_MODEL || 'qwen2.5:3b'
}

const getDoubaoApiKey = (override) => {
  return (
    override ||
    process.env.DOUBAO_API_KEY ||
    process.env.VITE_DOUBAO_API_KEY ||
    ''
  )
}

const getDoubaoEndpoint = (override) => {
  return (
    override ||
    process.env.DOUBAO_ENDPOINT ||
    process.env.VITE_DOUBAO_ENDPOINT ||
    'https://ark.cn-beijing.volces.com/api/v3/chat/completions'
  )
}

const getDoubaoModel = (override) => {
  return (
    override ||
    process.env.DOUBAO_MODEL ||
    process.env.VITE_DOUBAO_MODEL ||
    'doubao-1.5-pro-32k'
  )
}

const readDataFile = async () => {
  try {
    const raw = await fs.readFile(DATA_FILE_PATH, 'utf8')
    const parsed = JSON.parse(raw)
    if (!parsed.words || typeof parsed.words !== 'object') {
      parsed.words = {}
    }
    return parsed
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { generated: new Date().toISOString(), totalWords: 0, words: {} }
    }
    throw error
  }
}

const writeDataFile = async (data) => {
  const payload = {
    ...data,
    generated: new Date().toISOString(),
    totalWords: Object.keys(data.words || {}).length
  }
  await fs.writeFile(DATA_FILE_PATH, JSON.stringify(payload, null, 2), 'utf8')
}

const normalizeExamples = (examples, word) => {
  return examples
    .filter((ex) => ex.sentence && ex.translation)
    .filter((ex) => ex.sentence.toLowerCase().includes(word.toLowerCase()))
    .map((ex) => ({
      sentence: ex.sentence,
      translation: ex.translation,
      scenario: ex.scenario || '日常对话',
      usage: ex.usage || '',
      partOfSpeech: ex.partOfSpeech || 'unknown'
    }))
}

const normalizeDefinitions = (payload, word) => {
  const definitions = Array.isArray(payload?.definitions)
    ? payload.definitions
        .map((item) => ({
          partOfSpeech: item.partOfSpeech || item.pos || '',
          meaning: item.meaning || item.definition || ''
        }))
        .filter((item) => item.partOfSpeech || item.meaning)
    : []

  return {
    word: payload?.word || word,
    phonetic: payload?.phonetic || '',
    definitions
  }
}

const buildDefinitionPrompt = (word) => {
  return `请为英语单词 "${word}" 提供详细的词性和中文释义。

要求：
1. 列出该单词的所有常见词性（如：名词 n., 动词 v., 形容词 adj., 副词 adv. 等）
2. 为每个词性提供准确的中文释义
3. 如果有多个义项，用分号分隔
4. 包含音标（如果知道的话）

输出格式（严格按照以下JSON格式）：
{
  "word": "${word}",
  "phonetic": "/音标/",
  "definitions": [
    {
      "partOfSpeech": "n.",
      "meaning": "含义1；含义2；含义3"
    },
    {
      "partOfSpeech": "v.",
      "meaning": "含义1；含义2"
    }
  ]
}

请直接输出JSON，不要包含其他说明文字。`
}

const generateExamples = async (word, count, deepseekConfig = {}) => {
  const apiKey = getApiKey(deepseekConfig.apiKey)
  const endpoint = getEndpoint(deepseekConfig.endpoint)
  const model = getModel(deepseekConfig.model)
  if (!apiKey) {
    throw new Error('未配置 DeepSeek API Key，请在 .env.local 文件中设置 VITE_DEEPSEEK_API_KEY')
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: '你是一个专业的英语教学助手，擅长生成高质量的英语例句。请严格按照要求输出JSON格式的例句。'
        },
        {
          role: 'user',
          content: buildPrompt(word, count)
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

  const content = data?.choices?.[0]?.message?.content || ''
  const rawExamples = extractJsonArray(content)
  return {
    examples: normalizeExamples(rawExamples, word),
    meta: {
      provider: 'deepseek',
      endpoint,
      model
    }
  }
}

const generateWithOllama = async (word, count, ollamaConfig = {}) => {
  const endpoint = getOllamaEndpoint(ollamaConfig.endpoint)
  const model = getOllamaModel(ollamaConfig.model)

  const response = await fetch(`${endpoint}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      prompt: buildPrompt(word, count),
      stream: false,
      options: {
        temperature: 0.8,
        top_p: 0.9,
        num_predict: 800
      }
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Ollama API 错误: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  if (data?.error) {
    throw new Error(data.error)
  }

  const content = data?.response || ''
  const rawExamples = extractJsonArray(content)
  return {
    examples: normalizeExamples(rawExamples, word),
    meta: {
      provider: 'ollama',
      endpoint,
      model
    }
  }
}

const generateDefinitionsWithDeepseek = async (word, deepseekConfig = {}) => {
  const apiKey = getApiKey(deepseekConfig.apiKey)
  const endpoint = getEndpoint(deepseekConfig.endpoint)
  const model = getModel(deepseekConfig.model)

  if (!apiKey) {
    throw new Error('未配置 DeepSeek API Key，请在 .env.local 文件中设置 VITE_DEEPSEEK_API_KEY')
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: '你是一个专业的英语词典助手，擅长为英语单词提供准确的词性标注和中文释义。'
        },
        {
          role: 'user',
          content: buildDefinitionPrompt(word)
        }
      ],
      temperature: 0.3,
      max_tokens: 600,
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

  const content = data?.choices?.[0]?.message?.content || ''
  const payload = extractJsonObject(content)
  const normalized = normalizeDefinitions(payload, word)

  return {
    ...normalized,
    meta: {
      provider: 'deepseek',
      endpoint,
      model
    }
  }
}

const generateDefinitionsWithOllama = async (word, ollamaConfig = {}) => {
  const endpoint = getOllamaEndpoint(ollamaConfig.endpoint)
  const model = getOllamaModel(ollamaConfig.model)

  const response = await fetch(`${endpoint}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      prompt: buildDefinitionPrompt(word),
      stream: false,
      options: {
        temperature: 0.4,
        top_p: 0.9,
        num_predict: 600
      }
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Ollama API 错误: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  if (data?.error) {
    throw new Error(data.error)
  }

  const payload = extractJsonObject(data?.response || '')
  const normalized = normalizeDefinitions(payload, word)

  return {
    ...normalized,
    meta: {
      provider: 'ollama',
      endpoint,
      model
    }
  }
}

const generateWithDoubao = async (word, count, doubaoConfig = {}) => {
  const apiKey = getDoubaoApiKey(doubaoConfig.apiKey)
  const model = getDoubaoModel(doubaoConfig.model)
  const endpoint = getDoubaoEndpoint(doubaoConfig.endpoint)

  if (!apiKey) {
    throw new Error('未配置豆包 API Key，请在 .env.local 文件中设置 DOUBAO_API_KEY')
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: '你是一个专业的英语教学助手，擅长生成高质量的英语例句。请严格按照要求输出JSON格式的例句。'
        },
        {
          role: 'user',
          content: buildPrompt(word, count)
        }
      ],
      temperature: 0.8,
      max_tokens: 2000,
      stream: false
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`豆包 API 错误: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  if (data?.error) {
    throw new Error(data.error.message || JSON.stringify(data.error))
  }

  const content = data?.choices?.[0]?.message?.content || ''
  const rawExamples = extractJsonArray(content)
  return {
    examples: normalizeExamples(rawExamples, word),
    meta: {
      provider: 'doubao',
      endpoint,
      model
    }
  }
}

const generateDefinitionsWithDoubao = async (word, doubaoConfig = {}) => {
  const apiKey = getDoubaoApiKey(doubaoConfig.apiKey)
  const model = getDoubaoModel(doubaoConfig.model)
  const endpoint = getDoubaoEndpoint(doubaoConfig.endpoint)

  if (!apiKey) {
    throw new Error('未配置豆包 API Key，请在 .env.local 文件中设置 DOUBAO_API_KEY')
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: '你是一个专业的英语词典助手，擅长为英语单词提供准确的词性标注和中文释义。'
        },
        {
          role: 'user',
          content: buildDefinitionPrompt(word)
        }
      ],
      temperature: 0.3,
      max_tokens: 600,
      stream: false
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`豆包 API 错误: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  if (data?.error) {
    throw new Error(data.error.message || JSON.stringify(data.error))
  }

  const content = data?.choices?.[0]?.message?.content || ''
  const payload = extractJsonObject(content)
  const normalized = normalizeDefinitions(payload, word)

  return {
    ...normalized,
    meta: {
      provider: 'doubao',
      endpoint,
      model
    }
  }
}

app.post('/api/examples', async (req, res) => {
  const word = String(req.body?.word || '').trim()
  const count = Number(req.body?.count || 10)
  const provider = String(req.body?.provider || 'doubao').toLowerCase()
  const deepseekConfig = req.body?.deepseek || {}
  const ollamaConfig = req.body?.ollama || {}
  const doubaoConfig = req.body?.doubao || {}

  if (!word) {
    return res.status(400).json({ error: '缺少 word 参数' })
  }

  try {
    if (provider === 'deepseek') {
      const apiKey = getApiKey(deepseekConfig.apiKey)
      if (!apiKey) {
        return res.status(400).json({
          error: '未配置 DeepSeek API Key，请在设置页填写或在 .env.local 设置 VITE_DEEPSEEK_API_KEY'
        })
      }
    }

    if (provider === 'doubao') {
      const apiKey = getDoubaoApiKey(doubaoConfig.apiKey)
      if (!apiKey) {
        return res.status(400).json({
          error: '未配置豆包 API Key，请在 .env.local 文件中设置 DOUBAO_API_KEY'
        })
      }
    }

    const data = await readDataFile()
    const existing = data.words[word]

    if (existing?.examples && existing.examples.length >= count) {
      return res.json({
        source: 'cache',
        examples: existing.examples,
        meta: {
          provider,
          endpoint:
            provider === 'ollama'
              ? getOllamaEndpoint(ollamaConfig.endpoint)
              : provider === 'doubao'
                ? getDoubaoEndpoint(doubaoConfig.endpoint)
                : getEndpoint(deepseekConfig.endpoint),
          model:
            provider === 'ollama'
              ? getOllamaModel(ollamaConfig.model)
              : provider === 'doubao'
                ? getDoubaoModel(doubaoConfig.model)
                : getModel(deepseekConfig.model)
        }
      })
    }

    let result
    if (provider === 'ollama') {
      result = await generateWithOllama(word, count, ollamaConfig)
    } else if (provider === 'doubao') {
      result = await generateWithDoubao(word, count, doubaoConfig)
    } else {
      result = await generateExamples(word, count, deepseekConfig)
    }

    const examples = result.examples
    const meta = result.meta
    console.log('[api/examples]', {
      word,
      provider: meta.provider,
      endpoint: meta.endpoint,
      model: meta.model,
      count: examples.length
    })

    if (!examples.length) {
      return res.status(500).json({ error: '未生成有效例句' })
    }

    const possiblePos = Array.from(
      new Set(examples.map((ex) => ex.partOfSpeech).filter(Boolean))
    )

    data.words[word] = {
      word,
      rank: existing?.rank || '',
      possiblePos: possiblePos.length ? possiblePos : existing?.possiblePos || [],
      examples,
      exampleCount: examples.length
    }

    await writeDataFile(data)

    return res.json({ source: 'generated', examples, meta })
  } catch (error) {
    console.error('生成例句失败:', error)
    return res.status(500).json({ error: error.message || '生成失败' })
  }
})

app.post('/api/definitions', async (req, res) => {
  const word = String(req.body?.word || '').trim()
  const provider = String(req.body?.provider || 'doubao').toLowerCase()
  const deepseekConfig = req.body?.deepseek || {}
  const ollamaConfig = req.body?.ollama || {}
  const doubaoConfig = req.body?.doubao || {}

  if (!word) {
    return res.status(400).json({ error: '缺少 word 参数' })
  }

  try {
    if (provider === 'deepseek') {
      const apiKey = getApiKey(deepseekConfig.apiKey)
      if (!apiKey) {
        return res.status(400).json({
          error: '未配置 DeepSeek API Key，请在设置页填写或在 .env.local 设置 VITE_DEEPSEEK_API_KEY'
        })
      }
    }

    if (provider === 'doubao') {
      const apiKey = getDoubaoApiKey(doubaoConfig.apiKey)
      if (!apiKey) {
        return res.status(400).json({
          error: '未配置豆包 API Key，请在 .env.local 文件中设置 DOUBAO_API_KEY'
        })
      }
    }

    const data = await readDataFile()
    const existing = data.words[word]

    if (existing?.definitions && existing.definitions.length > 0) {
      return res.json({
        source: 'cache',
        word,
        phonetic: existing.phonetic || '',
        definitions: existing.definitions,
        meta: {
          provider,
          endpoint:
            provider === 'ollama'
              ? getOllamaEndpoint(ollamaConfig.endpoint)
              : provider === 'doubao'
                ? getDoubaoEndpoint(doubaoConfig.endpoint)
                : getEndpoint(deepseekConfig.endpoint),
          model:
            provider === 'ollama'
              ? getOllamaModel(ollamaConfig.model)
              : provider === 'doubao'
                ? getDoubaoModel(doubaoConfig.model)
                : getModel(deepseekConfig.model)
        }
      })
    }

    let result
    if (provider === 'ollama') {
      result = await generateDefinitionsWithOllama(word, ollamaConfig)
    } else if (provider === 'doubao') {
      result = await generateDefinitionsWithDoubao(word, doubaoConfig)
    } else {
      result = await generateDefinitionsWithDeepseek(word, deepseekConfig)
    }

    if (!result.definitions || result.definitions.length === 0) {
      return res.status(500).json({ error: '未生成有效释义' })
    }

    data.words[word] = {
      word,
      rank: existing?.rank || '',
      possiblePos: existing?.possiblePos || [],
      examples: existing?.examples || [],
      exampleCount: existing?.exampleCount || (existing?.examples?.length || 0),
      definitions: result.definitions,
      phonetic: result.phonetic || ''
    }

    await writeDataFile(data)

    console.log('[api/definitions]', {
      word,
      provider: result.meta.provider,
      endpoint: result.meta.endpoint,
      model: result.meta.model,
      count: result.definitions.length
    })

    return res.json({
      source: 'generated',
      word,
      phonetic: result.phonetic || '',
      definitions: result.definitions,
      meta: result.meta
    })
  } catch (error) {
    console.error('生成释义失败:', error)
    return res.status(500).json({ error: error.message || '生成失败' })
  }
})

app.get('/api/health', (req, res) => {
  const dbStatus = db ? 'connected' : 'disconnected'
  res.json({
    status: 'ok',
    database: dbStatus,
    timestamp: new Date().toISOString()
  })
})

// 数据库 API 端点
app.get('/api/progress', (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: '数据库未连接' })
    }
    const progress = db.getUserProgress('default')
    res.json(progress)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/progress', (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: '数据库未连接' })
    }
    const result = db.updateUserProgress('default', req.body)
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/favorites', (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: '数据库未连接' })
    }
    const favorites = db.getUserFavorites('default')
    res.json({ favorites })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/favorites/:wordId', (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: '数据库未连接' })
    }
    const { wordId } = req.params
    const { word } = req.body
    const result = db.addFavorite('default', wordId, word || wordId)
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.delete('/api/favorites/:wordId', (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: '数据库未连接' })
    }
    const { wordId } = req.params
    const result = db.removeFavorite('default', wordId)
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/history', (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: '数据库未连接' })
    }
    const limit = parseInt(req.query.limit) || 100
    const history = db.getStudyHistory('default', limit)
    res.json({ history })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/stats/daily', (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: '数据库未连接' })
    }
    const days = parseInt(req.query.days) || 30
    const stats = db.getDailyStats('default', days)
    res.json({ stats })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/settings', (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: '数据库未连接' })
    }
    const settings = db.getUserSettings('default')
    res.json(settings)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/settings', (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: '数据库未连接' })
    }
    const result = db.saveUserSettings('default', req.body)
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/export', (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ error: '数据库未连接' })
    }
    const result = db.exportAllData('default')
    if (!result.success) {
      return res.status(500).json({ error: result.error })
    }
    res.json(result.data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

  /**
   * 文本转语音 (TTS)
   */
  app.post('/api/tts', async (req, res) => {
    const { text, lang = 'en' } = req.body

    if (!text) {
      return res.status(400).json({ error: '缺少 text 参数' })
    }

    try {
      // 使用 Google Translate TTS（免费方案）
      const encodedText = encodeURIComponent(text)
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q=${encodedText}&tl=${lang}`

      const response = await fetch(ttsUrl)

      if (!response.ok) {
        throw new Error(`TTS 请求失败: ${response.status}`)
      }

      const audioBuffer = await response.arrayBuffer()

      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength
      })

      res.send(Buffer.from(audioBuffer))
    } catch (error) {
      console.error('TTS 生成失败:', error)
      res.status(500).json({ error: 'TTS 生成失败: ' + error.message })
    }
  })

app.listen(port, () => {
  console.log(`AI cache server running at http://localhost:${port}`)
  console.log(`Database status: ${db ? 'connected' : 'disconnected'}`)
})
