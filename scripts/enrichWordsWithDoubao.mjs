import fs from 'fs/promises'
import path from 'path'
import dotenv from 'dotenv'
import { fetch } from 'undici'

const rootDir = process.cwd()
const envPath = path.resolve(rootDir, '.env.local')
dotenv.config({ path: envPath })
dotenv.config()

const API_BASE = process.env.API_BASE || 'http://localhost:3001'
const DOUBAO_API_KEY = process.env.DOUBAO_API_KEY || process.env.VITE_DOUBAO_API_KEY || ''
const DOUBAO_ENDPOINT = process.env.DOUBAO_ENDPOINT || process.env.VITE_DOUBAO_ENDPOINT || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'
const DOUBAO_MODEL = process.env.DOUBAO_MODEL || process.env.VITE_DOUBAO_MODEL || 'doubao-1.5-pro-32k'
const EXAMPLES_PER_WORD = Number(process.env.EXAMPLES_PER_WORD || 10)
const BATCH_SIZE = 1
const START_INDEX = Number(process.env.START_INDEX || 0)
const LIMIT = Number(process.env.LIMIT || 50)
const RETRY = Number(process.env.RETRY || 2)
const RETRY_DELAY = Number(process.env.RETRY_DELAY || 1500)

const WORDS_FILE = path.resolve(rootDir, 'src', 'data', 'filtered_words.json')

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const postJson = async (url, body) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`HTTP ${response.status}: ${text}`)
  }

  return response.json()
}

const loadWords = async () => {
  const raw = await fs.readFile(WORDS_FILE, 'utf8')
  const data = JSON.parse(raw)
  return (data.words || []).map((item) => item.word).filter(Boolean)
}

const enrichWord = async (word) => {
  if (!DOUBAO_API_KEY) {
    throw new Error('未配置豆包 API Key，请在 .env.local 文件中设置 DOUBAO_API_KEY')
  }

  const payload = {
    word,
    provider: 'doubao',
    deepseek: {},
    ollama: {},
    doubao: {
      apiKey: DOUBAO_API_KEY,
      endpoint: DOUBAO_ENDPOINT,
      model: DOUBAO_MODEL
    }
  }

  const runWithRetry = async (fn, label) => {
    let lastError = null
    for (let attempt = 1; attempt <= RETRY + 1; attempt += 1) {
      try {
        return await fn()
      } catch (error) {
        lastError = error
        console.error(`❌ ${word} ${label} 失败 (第 ${attempt} 次): ${error.message}`)
        if (attempt <= RETRY) {
          await sleep(RETRY_DELAY)
        }
      }
    }
    throw lastError
  }

  const definitions = await runWithRetry(
    () => postJson(`${API_BASE}/api/definitions`, payload),
    '释义'
  )
  const examples = await runWithRetry(
    () => postJson(`${API_BASE}/api/examples`, { ...payload, count: EXAMPLES_PER_WORD }),
    '例句'
  )

  return { definitions, examples }
}

const main = async () => {
  const words = await loadWords()
  const slice = words.slice(START_INDEX, START_INDEX + LIMIT)

  console.log(`准备处理 ${slice.length} 个单词（起始 ${START_INDEX}）`) 

  for (let i = 0; i < slice.length; i += BATCH_SIZE) {
    const word = slice[i]
    console.log(`处理 ${i + 1}/${slice.length}: ${word}`)

    try {
      await enrichWord(word)
      console.log(`✅ ${word} 完成`)
    } catch (error) {
      console.error(`❌ ${word} 失败: ${error.message}`)
    }

    await sleep(300)
  }

  console.log('处理完成')
}

main().catch((error) => {
  console.error('脚本执行失败:', error)
  process.exit(1)
})
