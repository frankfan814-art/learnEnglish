import fs from 'fs'
import fsPromises from 'fs/promises'
import path from 'path'
import zlib from 'zlib'
import readline from 'readline'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import WordPOS from 'wordpos'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const wordpos = new WordPOS()

const config = {
  datasetUrl:
    process.env.DATASET_URL ||
    'https://huggingface.co/datasets/agentlans/tatoeba-english-translations/resolve/main/All.csv.gz',
  datasetCache: path.resolve(__dirname, '../src/data/generated/tatoeba-all.csv.gz'),
  dictUrl:
    process.env.DICT_URL ||
    'https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv',
  dictCache: path.resolve(__dirname, '../src/data/generated/ecdict.csv'),
  wordsFile: path.resolve(__dirname, '../src/data/filtered_words.json'),
  outputFile: path.resolve(__dirname, '../src/data/generated/word_examples.json'),
  maxExamplesPerWord: Number(process.env.MAX_EXAMPLES || 10),
  maxSentences: Number(process.env.MAX_SENTENCES || 0),
  targetLanguages: (process.env.TARGET_LANGUAGES || 'cmn,zho,zh')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

const ensureDir = async (dir) => {
  await fsPromises.mkdir(dir, { recursive: true })
}

const downloadFile = async (url, outFile) => {
  if (url.startsWith('file://')) {
    const localPath = url.replace('file://', '')
    const buffer = await fsPromises.readFile(localPath)
    await fsPromises.writeFile(outFile, buffer)
    return
  }

  if (url.startsWith('/')) {
    const buffer = await fsPromises.readFile(url)
    await fsPromises.writeFile(outFile, buffer)
    return
  }

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      Accept: '*/*'
    }
  })
  if (!response.ok) {
    throw new Error(`下载数据集失败: ${response.status}`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  await fsPromises.writeFile(outFile, buffer)
}

const parseCsvLine = (line) => {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    const next = line[i + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
      continue
    }

    current += char
  }

  result.push(current)
  return result.map((item) => item.trim())
}

const loadWords = async () => {
  const text = await fsPromises.readFile(config.wordsFile, 'utf-8')
  const data = JSON.parse(text)
  const words = (data.words || [])
    .map((item) => (item.word || '').toLowerCase())
    .filter(Boolean)

  return words
}

const loadDictionary = async () => {
  await ensureDir(path.dirname(config.dictCache))
  try {
    await fsPromises.access(config.dictCache)
  } catch {
    await downloadFile(config.dictUrl, config.dictCache)
  }

  const raw = await fsPromises.readFile(config.dictCache)
  const text = config.dictCache.endsWith('.gz')
    ? zlib.gunzipSync(raw).toString('utf-8')
    : raw.toString('utf-8')
  const lines = text.split(/\r?\n/).filter(Boolean)
  const map = new Map()

  if (config.dictCache.endsWith('.csv')) {
    const header = parseCsvLine(lines[0])
    const wordIndex = header.indexOf('word')
    const translationIndex = header.indexOf('translation')

    for (let i = 1; i < lines.length; i += 1) {
      const columns = parseCsvLine(lines[i])
      const word = (columns[wordIndex] || '').toLowerCase()
      const translation = columns[translationIndex] || ''
      if (!word || !translation) continue
      if (!map.has(word)) {
        map.set(word, translation)
      }
    }
  } else {
    for (const line of lines) {
      const parts = line.trim().split(/\s+/)
      if (parts.length < 2) continue
      const word = parts[0].toLowerCase()
      const translation = parts.slice(1).join(' ')
      if (!map.has(word)) {
        map.set(word, translation)
      }
    }
  }

  return map
}

const tokenize = (sentence) => {
  return sentence
    .toLowerCase()
    .replace(/[^a-z\s']/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

const mapPosToLabel = (posKey) => {
  switch (posKey) {
    case 'n':
      return 'n.'
    case 'v':
      return 'v.'
    case 'a':
    case 's':
      return 'adj.'
    case 'r':
      return 'adv.'
    default:
      return ''
  }
}

const getWordPos = async (word) => {
  try {
    const lookup = await wordpos.lookup(word)
    const posSet = new Set()
    for (const item of lookup) {
      const label = mapPosToLabel(item.pos)
      if (label) posSet.add(label)
    }
    return Array.from(posSet)
  } catch {
    return []
  }
}

const buildExamples = async () => {
  await ensureDir(path.dirname(config.outputFile))

  try {
    await fsPromises.access(config.datasetCache)
  } catch {
    await downloadFile(config.datasetUrl, config.datasetCache)
  }

  const words = await loadWords()
  const wordSet = new Set(words)
  const result = {}
  const filled = new Set()

  for (const word of words) {
    result[word] = []
  }

  const stream = fs
    .createReadStream(config.datasetCache)
    .pipe(zlib.createGunzip())

  const rl = readline.createInterface({
    input: stream,
    crlfDelay: Infinity
  })

  let row = 0
  for await (const line of rl) {
    row += 1
    if (row === 1) continue

    const columns = parseCsvLine(line)
    const english = columns[1] || ''
    const language = (columns[3] || '').toLowerCase()
    const translation = columns[4] || ''

    if (!english) continue
    if (config.targetLanguages.length > 0 && !config.targetLanguages.includes(language)) {
      continue
    }

    const tokens = new Set(tokenize(english))
    for (const token of tokens) {
      if (!wordSet.has(token)) continue
      if (result[token].length >= config.maxExamplesPerWord) {
        filled.add(token)
        continue
      }

      result[token].push({
        sentence: english,
        translation
      })

      if (result[token].length >= config.maxExamplesPerWord) {
        filled.add(token)
      }
    }

    if (config.maxSentences && row >= config.maxSentences) {
      break
    }

    if (filled.size === words.length) {
      break
    }
  }

  let dictionary = new Map()
  try {
    dictionary = await loadDictionary()
  } catch (error) {
    console.warn(`词典加载失败，将继续生成但不填充单词翻译：${error.message}`)
  }
  const output = []

  for (const word of words) {
    const examples = result[word] || []
    const translation = dictionary.get(word) || ''
    const posList = await getWordPos(word)
    const orderedPos = posList.length > 0 ? posList : ['']

    const usages = orderedPos.map((pos, index) => ({
      partOfSpeech: pos,
      meaning: translation,
      examples: index === 0 ? examples : []
    }))

    output.push({
      word,
      translation,
      usages
    })
  }

  await fsPromises.writeFile(config.outputFile, JSON.stringify(output, null, 2), 'utf-8')
}

buildExamples().catch((error) => {
  console.error('生成例句失败:', error)
  process.exit(1)
})
