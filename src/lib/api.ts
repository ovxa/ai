import { AIAgent } from '@/types'
import { Message } from '@/types'
import { estimateTokens } from '@/utils/markdown'

export interface ChatAPIRequest {
  agentId: string
  message: string
  history?: Message[]
  filterByAgent?: boolean // 是否过滤只显示该 agent 自己的消息
}

export interface ChatAPIResponse {
  content: string
}

export interface APIEndpoint {
  url: string
  key: string
  name?: string
}

const DEFAULT_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions'
const MAX_CONTEXT_TOKENS = 200000 // 最大上下文 tokens

/**
 * 压缩消息历史，保留最近的消息，旧消息总结
 */
function compressHistory(messages: Message[]): Message[] {
  // 估算总 tokens
  let totalTokens = 0
  const compressedMessages: Message[] = []

  // 从后往前遍历（保留最新消息）
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    const msgTokens = estimateTokens(msg.content)

    if (totalTokens + msgTokens < MAX_CONTEXT_TOKENS) {
      compressedMessages.unshift(msg)
      totalTokens += msgTokens
    } else {
      // 超过限制，总结剩余所有旧消息
      const oldMessages = messages.slice(0, i + 1)
      const summary = summarizeMessages(oldMessages)

      // 添加总结消息到开头
      compressedMessages.unshift({
        id: 'summary',
        role: 'assistant',
        content: `[历史消息总结]: ${summary}`,
        timestamp: oldMessages[0]?.timestamp || Date.now()
      })

      break
    }
  }

  return compressedMessages
}

/**
 * 总结多条消息为一句话
 */
function summarizeMessages(messages: Message[]): string {
  if (messages.length === 0) return '无历史消息'

  const userMessages = messages.filter(m => m.role === 'user')
  const assistantMessages = messages.filter(m => m.role === 'assistant')

  const summary = `用户提出了 ${userMessages.length} 个问题，AI 回复了 ${assistantMessages.length} 次。`

  // 提取最重要的几个关键词
  const allContent = messages.map(m => m.content).join(' ')
  const keywords = extractKeywords(allContent, 5)

  if (keywords.length > 0) {
    return `${summary} 讨论主题包括：${keywords.join('、')}`
  }

  return summary
}

/**
 * 提取关键词（简单实现）
 */
function extractKeywords(text: string, maxCount: number): string[] {
  // 移除 Markdown 语法
  const cleanText = text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_#>-]/g, '')

  // 分词（简单按空格和标点分割）
  const words = cleanText
    .split(/[\s,，。！？；：、\n]+/)
    .filter(w => w.length > 2 && w.length < 20)

  // 统计词频
  const wordCount = new Map<string, number>()
  words.forEach(word => {
    const count = wordCount.get(word) || 0
    wordCount.set(word, count + 1)
  })

  // 排序并返回前 N 个
  return Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxCount)
    .map(([word]) => word)
}

/**
 * 客户端直接调用 AI API
 * 支持 OpenRouter 和自定义 API endpoints
 * 支持流式输出
 */
export async function callChatAPI(
  request: ChatAPIRequest,
  agent: AIAgent,
  apiKey: string,
  customEndpoint?: string,
  onStream?: (content: string) => void
): Promise<ChatAPIResponse> {
  if (!apiKey) {
    throw new Error('API key is required. Please add ?api=YOUR_KEY to the URL or set it in settings.')
  }

  const endpoint = customEndpoint || DEFAULT_ENDPOINT

  // 构建消息历史
  let historyMessages = request.history || []

  // 如果需要过滤，只保留该 agent 自己的消息和用户的消息
  if (request.filterByAgent) {
    historyMessages = historyMessages.filter(
      msg => msg.role === 'user' || msg.agentId === request.agentId
    )
  }

  // 压缩历史消息（超过 200K tokens 时自动总结）
  const compressedHistory = compressHistory(historyMessages)

  const messages = [
    // 使用压缩后的消息历史
    ...compressedHistory.map((msg: Message) => ({
      role: msg.role,
      content: msg.content
    })),
    {
      role: 'user',
      content: request.message
    }
  ]

  try {
    // 调用 AI API，启用流式输出
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
        'X-Title': 'AI Trio Chat'
      },
      body: JSON.stringify({
        model: agent.model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: true // 启用流式输出
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API error:', errorText)

      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your API key.')
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.')
      } else {
        throw new Error(`API error: ${response.status}`)
      }
    }

    // 处理流式响应
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let fullContent = ''

    if (!reader) {
      throw new Error('No response body')
    }

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n').filter(line => line.trim() !== '')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') continue

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content

            if (content) {
              fullContent += content
              // 调用流式回调
              if (onStream) {
                onStream(fullContent)
              }
            }
          } catch (e) {
            // 忽略解析错误
            console.warn('Failed to parse SSE data:', data)
          }
        }
      }
    }

    if (!fullContent) {
      throw new Error('No content in response')
    }

    return { content: fullContent }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to call API')
  }
}

/**
 * 从 URL 参数获取 API keys
 * 支持多个 ?api= 参数
 */
export function getAPIKeysFromURL(): string[] {
  if (typeof window === 'undefined') return []

  const params = new URLSearchParams(window.location.search)
  const apiKeys: string[] = []

  // 获取所有 api 参数
  params.forEach((value, key) => {
    if (key === 'api' && value.trim()) {
      apiKeys.push(value.trim())
    }
  })

  return apiKeys
}

/**
 * 从 localStorage 获取保存的 API key
 */
export function getSavedAPIKey(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('openrouter_api_key')
}

/**
 * 保存 API key 到 localStorage
 */
export function saveAPIKey(apiKey: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('openrouter_api_key', apiKey)
}

/**
 * 清除保存的 API key
 */
export function clearSavedAPIKey(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('openrouter_api_key')
}

/**
 * 获取可用的 API key
 * 优先级：URL 参数 > localStorage
 */
export function getAvailableAPIKey(): string | null {
  // 优先从 URL 获取
  const urlKeys = getAPIKeysFromURL()
  if (urlKeys.length > 0) {
    return urlKeys[0]
  }

  // 其次从 localStorage 获取
  return getSavedAPIKey()
}

/**
 * 获取所有可用的 API keys（包括 URL 和 localStorage）
 */
export function getAllAPIKeys(): string[] {
  const keys = new Set<string>()

  // 添加 URL 中的 keys
  getAPIKeysFromURL().forEach(key => keys.add(key))

  // 添加 localStorage 中的 key
  const savedKey = getSavedAPIKey()
  if (savedKey) {
    keys.add(savedKey)
  }

  return Array.from(keys)
}

/**
 * 保存自定义 API endpoint
 */
export function saveCustomEndpoint(endpoint: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('custom_api_endpoint', endpoint)
}

/**
 * 从 URL 参数获取 API endpoint
 */
export function getEndpointFromURL(): string | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  return params.get('endpoint')
}

/**
 * 获取自定义 API endpoint
 * 优先级：URL 参数 > localStorage
 */
export function getCustomEndpoint(): string | null {
  if (typeof window === 'undefined') return null

  // 优先从 URL 获取
  const urlEndpoint = getEndpointFromURL()
  if (urlEndpoint) return urlEndpoint

  // 其次从 localStorage 获取
  return localStorage.getItem('custom_api_endpoint')
}

/**
 * 清除自定义 API endpoint
 */
export function clearCustomEndpoint(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('custom_api_endpoint')
}

/**
 * 从 API 获取可用模型列表
 */
export async function fetchAvailableModels(
  apiKey: string,
  endpoint?: string
): Promise<string[]> {
  const baseEndpoint = endpoint || DEFAULT_ENDPOINT
  // 从 chat/completions endpoint 转换为 models endpoint
  const modelsEndpoint = baseEndpoint
    .replace('/chat/completions', '/models')
    .replace('/v1/chat/completions', '/v1/models')
    .replace('/api/v1/chat/completions', '/api/v1/models')

  try {
    const response = await fetch(modelsEndpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status}`)
    }

    const data = await response.json()
    // OpenRouter 返回 { data: [{ id: "model-name" }] }
    if (data.data && Array.isArray(data.data)) {
      return data.data.map((model: any) => model.id)
    }

    return []
  } catch (error) {
    console.error('Error fetching models:', error)
    return []
  }
}

/**
 * 从模型全称提取简称
 * 例如: "anthropic/claude-sonnet-4.5" => "Sonnet"
 *      "openai/gpt-5" => "GPT"
 *      "google/gemini-2.5-pro" => "Gemini"
 */
export function extractModelShortName(fullModelName: string): string {
  // 移除前缀（提供商/）
  const withoutProvider = fullModelName.split('/').pop() || fullModelName

  // 提取主要名称
  if (withoutProvider.includes('claude')) {
    // claude-3-sonnet, claude-sonnet-4.5 => Sonnet
    if (withoutProvider.includes('sonnet')) return 'Sonnet'
    if (withoutProvider.includes('opus')) return 'Opus'
    if (withoutProvider.includes('haiku')) return 'Haiku'
    return 'Claude'
  } else if (withoutProvider.includes('gpt')) {
    // gpt-4, gpt-5, gpt-4-turbo => GPT
    return 'GPT'
  } else if (withoutProvider.includes('gemini')) {
    // gemini-pro, gemini-2.5-pro => Gemini
    return 'Gemini'
  } else if (withoutProvider.includes('llama')) {
    return 'Llama'
  } else if (withoutProvider.includes('mistral')) {
    return 'Mistral'
  }

  // 如果无法识别，返回首个单词并大写首字母
  const firstWord = withoutProvider.split('-')[0]
  return firstWord.charAt(0).toUpperCase() + firstWord.slice(1)
}
