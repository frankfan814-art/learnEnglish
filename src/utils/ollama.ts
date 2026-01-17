/**
 * Ollama 本地大模型集成工具
 * 用于生成单词例句和用法
 */

import type {
  GenerateExamplesParams,
  GeneratedExample,
  OllamaRequest,
  OllamaResponse
} from '../types/word.types'

export class OllamaClient {
  private endpoint: string
  private model: string

  constructor(
    endpoint: string = 'http://localhost:11434',
    model: string = 'qwen2.5:3b'
  ) {
    this.endpoint = endpoint
    this.model = model
  }

  /**
   * 设置模型
   */
  setModel(model: string) {
    this.model = model
  }

  /**
   * 设置 API 端点
   */
  setEndpoint(endpoint: string) {
    this.endpoint = endpoint
  }

  /**
   * 检查 Ollama 服务是否可用
   */
  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.endpoint}/api/tags`)
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * 获取已安装的模型列表
   */
  async getModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.endpoint}/api/tags`)
      const data = await response.json()
      return data.models?.map((m: any) => m.name) || []
    } catch {
      return []
    }
  }

  /**
   * 生成单词例句
   */
  async generateExamples(
    params: GenerateExamplesParams
  ): Promise<GeneratedExample[]> {
    const {
      word,
      partOfSpeech,
      scenarios,
      count = 3,
      minLength = 6,
      maxLength = 14
    } = params

    const prompt = this.buildPrompt(word, partOfSpeech, scenarios, count, minLength, maxLength)

    try {
      const examples = await this.callOllama(prompt)
      return this.parseExamples(examples)
    } catch (error) {
      console.error('生成例句失败:', error)
      throw new Error('AI 生成例句失败，请检查 Ollama 服务是否运行')
    }
  }

  /**
   * 构建提示词
   */
  private buildPrompt(
    word: string,
    partOfSpeech: string,
    scenarios: string[],
    count: number,
    minLength: number,
    maxLength: number
  ): string {
    const scenariosText = scenarios.length > 0
      ? `使用场景: ${scenarios.join(', ')}`
      : '使用场景: 日常对话'

    return `请为单词 "${word}" (${partOfSpeech}) 生成 ${count} 个英语例句。

要求：
1. 句子长度在 ${minLength} 到 ${maxLength} 个单词之间
2. ${scenariosText}
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
  }

  /**
   * 调用 Ollama API
   */
  private async callOllama(prompt: string): Promise<string> {
    const requestBody: OllamaRequest = {
      model: this.model,
      prompt,
      stream: false,
      options: {
        temperature: 0.8,
        top_p: 0.9,
        num_predict: 500
      }
    }

    const response = await fetch(`${this.endpoint}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`Ollama API 错误: ${response.status}`)
    }

    const data = await response.json()

    if (data?.error) {
      throw new Error(data.error)
    }

    const typed = data as OllamaResponse
    if (!typed.response || typeof typed.response !== 'string') {
      throw new Error('Ollama 返回内容为空或格式不正确')
    }

    return typed.response
  }

  /**
   * 解析 AI 返回的例句
   */
  private parseExamples(text: string): GeneratedExample[] {
    try {
      if (!text || typeof text !== 'string') {
        throw new Error('返回内容为空')
      }
      // 尝试提取 JSON 数组
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        throw new Error('未找到 JSON 数组')
      }

      const examples = JSON.parse(jsonMatch[0])

      // 验证格式
      if (!Array.isArray(examples)) {
        throw new Error('返回的不是数组')
      }

      return examples.map((item: any) => ({
        sentence: item.sentence || '',
        translation: item.translation || '',
        scenario: item.scenario,
        usage: item.usage
      })).filter((item: GeneratedExample) => item.sentence && item.translation)
    } catch (error) {
      console.error('解析例句失败:', error, '原始文本:', text)

      // 返回默认例句
      return [{
        sentence: `This is an example of using the word.`,
        translation: '这是使用该单词的例子。',
        scenario: '示例'
      }]
    }
  }

  /**
   * 批量生成多个单词的例句
   */
  async generateBatch(
    words: Array<{ word: string; partOfSpeech: string; scenarios: string[] }>,
    onProgress?: (current: number, total: number) => void
  ): Promise<Map<string, GeneratedExample[]>> {
    const results = new Map<string, GeneratedExample[]>()

    for (let i = 0; i < words.length; i++) {
      const wordData = words[i]
      try {
        const examples = await this.generateExamples({
          ...wordData,
          count: 3
        })
        results.set(wordData.word, examples)

        onProgress?.(i + 1, words.length)

        // 避免请求过快
        if (i < words.length - 1) {
          await this.delay(500)
        }
      } catch (error) {
        console.error(`生成 "${wordData.word}" 例句失败:`, error)
      }
    }

    return results
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * 创建全局 Ollama 客户端实例
 */
let ollamaClient: OllamaClient | null = null

export const getOllamaClient = (): OllamaClient => {
  if (!ollamaClient) {
    ollamaClient = new OllamaClient()
  }
  return ollamaClient
}

/**
 * 初始化 Ollama 客户端
 */
export const initOllamaClient = async (
  endpoint?: string,
  model?: string
): Promise<OllamaClient> => {
  const client = new OllamaClient(endpoint, model)

  const isConnected = await client.checkConnection()
  if (!isConnected) {
    throw new Error('无法连接到 Ollama 服务，请确保 Ollama 已安装并运行')
  }

  ollamaClient = client
  return client
}
