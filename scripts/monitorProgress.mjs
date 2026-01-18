#!/usr/bin/env node
/**
 * 监控单词处理进度
 */

import fs from 'fs/promises'
import path from 'path'

const OUTPUT_FILE = path.resolve(process.cwd(), 'src', 'data', 'words_with_examples.json')
const WORDS_FILE = path.resolve(process.cwd(), 'src', 'data', 'filtered_words.json')

const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}小时${minutes}分钟`
  } else if (minutes > 0) {
    return `${minutes}分钟${secs}秒`
  } else {
    return `${secs}秒`
  }
}

const getElapsedTime = (startTime) => {
  return Math.floor((Date.now() - startTime) / 1000)
}

const main = async () => {
  const startTime = Date.now()
  let lastProcessed = 0
  let lastCheckTime = startTime

  console.log('🔍 开始监控处理进度...\n')

  while (true) {
    try {
      // 读取已处理单词
      const outputRaw = await fs.readFile(OUTPUT_FILE, 'utf8')
      const outputData = JSON.parse(outputRaw)
      const processedWords = Object.keys(outputData.words || {}).length

      // 读取总单词数
      const wordsRaw = await fs.readFile(WORDS_FILE, 'utf8')
      const wordsData = JSON.parse(wordsRaw)
      const totalWords = wordsData.words?.length || 20000

      // 计算进度
      const progress = ((processedWords / totalWords) * 100).toFixed(2)
      const remaining = totalWords - processedWords

      // 计算速度
      const currentTime = Date.now()
      const elapsedSinceLastCheck = (currentTime - lastCheckTime) / 1000 / 60 // 分钟
      const wordsPerMinute = processedWords - lastProcessed

      // 平均速度（单词/分钟）
      const totalElapsed = getElapsedTime(startTime) / 60
      const avgSpeed = processedWords / totalElapsed

      // 预计剩余时间
      const estimatedMinutes = remaining / avgSpeed
      const estimatedTime = formatTime(estimatedMinutes * 60)

      // 显示进度
      console.clear()
      console.log('╔════════════════════════════════════════════════════════════╗')
      console.log('║           📊 单词处理进度监控                              ║')
      console.log('╚════════════════════════════════════════════════════════════╝')
      console.log('')
      console.log(`📈 当前进度: ${processedWords}/${totalWords} (${progress}%)`)
      console.log(`📦 剩余单词: ${remaining}`)
      console.log('')
      console.log(`⚡ 处理速度: ${avgSpeed.toFixed(1)} 词/分钟`)
      console.log(`⏱️  已用时间: ${formatTime(getElapsedTime(startTime))}`)
      console.log(`⏳ 预计剩余: ${estimatedTime}`)
      console.log('')
      console.log(`🕐 预计完成时间: ${new Date(currentTime + estimatedMinutes * 60 * 1000).toLocaleString('zh-CN')}`)
      console.log('')
      console.log(`📄 输出文件: ${OUTPUT_FILE}`)
      console.log(`📁 文件大小: ${(outputRaw.length / 1024).toFixed(2)} KB`)
      console.log('')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(`最后更新: ${new Date().toLocaleString('zh-CN')}`)
      console.log('按 Ctrl+C 退出监控')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

      // 更新状态
      lastProcessed = processedWords
      lastCheckTime = currentTime

      // 如果完成了
      if (remaining === 0) {
        console.log('\n🎉🎉🎉 全部完成！🎉🎉🎉\n')
        console.log(`✅ 总共处理了 ${processedWords} 个单词`)
        console.log(`⏱️  总用时: ${formatTime(getElapsedTime(startTime))}`)
        console.log(`📊 平均速度: ${avgSpeed.toFixed(1)} 词/分钟`)
        process.exit(0)
      }

    } catch (error) {
      console.error('❌ 读取文件失败:', error.message)
    }

    // 每 30 秒更新一次
    await new Promise(resolve => setTimeout(resolve, 30000))
  }
}

main().catch(console.error)
