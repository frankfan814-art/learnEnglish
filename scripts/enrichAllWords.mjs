#!/usr/bin/env node
/**
 * 自动批量处理所有剩余单词
 */

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
const DOUBAO_MODEL = process.env.DOUBAO_MODEL || process.env.VITE_DOUBAO_MODEL || 'ep-20260118094854-wd5pp'
const EXAMPLES_PER_WORD = Number(process.env.EXAMPLES_PER_WORD || 10)
const BATCH_SIZE = 1000  // 每批处理1000个
const RETRY = Number(process.env.RETRY || 2)
const RETRY_DELAY = Number(process.env.RETRY_DELAY || 1500)

const WORDS_FILE = path.resolve(rootDir, 'src', 'data', 'filtered_words.json')
const OUTPUT_FILE = path.resolve(rootDir, 'src', 'data', 'words_with_examples.json')

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

const getProcessedWords = async () => {
  try {
    const raw = await fs.readFile(OUTPUT_FILE, 'utf8')
    const data = JSON.parse(raw)
    const words = Object.keys(data.words || {})
    console.log(`已处理 ${words.length} 个单词`)
    return words
  } catch {
    return []
  }
}

const enrichWord = async (word) => {
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
        console.error(`  ❌ ${word} ${label} 失败 (第 ${attempt} 次): ${error.message}`)
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
  const allWords = await loadWords()
  const processedWords = await getProcessedWords()

  // 找出未处理的单词
  const remainingWords = allWords.filter(word => !processedWords.includes(word))

  console.log(`\n📊 任务统计:`)
  console.log(`  总单词数: ${allWords.length}`)
  console.log(`  已处理: ${processedWords.length}`)
  console.log(`  剩余: ${remainingWords.length}`)
  console.log(`\n🚀 开始批量处理...\n`)

  let totalProcessed = 0
  let batchNum = 0

  // 分批处理
  for (let i = 0; i < remainingWords.length; i += BATCH_SIZE) {
    batchNum++
    const batch = remainingWords.slice(i, i + BATCH_SIZE)
    const startIdx = i + processedWords.length

    console.log(`\n📦 批次 #${batchNum}: 处理单词 ${startIdx + 1}-${Math.min(startIdx + batch.length, allWords.length)} (共 ${batch.length} 个)`)

    for (let j = 0; j < batch.length; j++) {
      const word = batch[j]
      const currentIdx = startIdx + j + 1

      console.log(`  [${currentIdx}/${allWords.length}] ${word}...`)

      try {
        await enrichWord(word)
        totalProcessed++
        console.log(`  ✅ ${word} 完成 (批次进度: ${j + 1}/${batch.length}, 总进度: ${totalProcessed}/${remainingWords.length})`)
      } catch (error) {
        console.error(`  ❌ ${word} 失败: ${error.message}`)
      }

      // 每10个单词休息一下
      if ((j + 1) % 10 === 0 && j < batch.length - 1) {
        await sleep(500)
      }
    }

    console.log(`\n✅ 批次 #${batchNum} 完成！`)
    console.log(`📈 当前进度: ${totalProcessed}/${remainingWords.length} 剩余单词`)
    console.log(`📊 总进度: ${processedWords.length + totalProcessed}/${allWords.length} (${((processedWords.length + totalProcessed) / allWords.length * 100).toFixed(2)}%)`)
  }

  console.log(`\n🎉 全部完成！`)
  console.log(`📊 最终统计:`)
  console.log(`  总处理: ${totalProcessed} 个单词`)
  console.log(`  总进度: ${processedWords.length + totalProcessed}/${allWords.length}`)
  console.log(`  输出文件: ${OUTPUT_FILE}`)
}

main().catch((error) => {
  console.error('❌ 脚本执行失败:', error)
  process.exit(1)
})
