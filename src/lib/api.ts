import { AIAgent } from '@/types'
import { Message } from '@/types'
import { estimateTokens } from '@/utils/markdown'
import { getAgentById } from '@/lib/agents'
import { getTranslation } from './i18n'

export interface ChatAPIRequest {
  agentId: string
  message: string
  history?: Message[]
  filterByAgent?: boolean // Filter to show only this agent's own messages
  isMentioned?: boolean // Whether @mentioned (used for context compression strategy)
  mentionedByAgent?: string // Which AI mentioned this agent (if any, adds system prompt)
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
const MAX_CONTEXT_TOKENS = 200000 // Max context tokens (when not @mentioned)
const MAX_MENTION_CONTEXT_TOKENS = 20000 // Max context tokens when @mentioned

/**
 * Get user's local context information (time, language, timezone)
 */
function getUserContextInfo(): { localTime: string; language: string; timezone: string } {
  if (typeof window === 'undefined') {
    return {
      localTime: new Date().toISOString(),
      language: 'en',
      timezone: 'UTC'
    }
  }

  const now = new Date()
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  const language = navigator.language || 'en'

  // Format local time in a readable way
  const localTime = now.toLocaleString(language, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  })

  return {
    localTime,
    language,
    timezone
  }
}

/**
 * Extract the last paragraph from content, trimmed to maxLength
 */
function extractLastParagraph(content: string, maxLength: number): string {
  // Split by double newlines to find paragraphs (preserves code blocks better than splitting by single \n)
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim())
  const lastParagraph = paragraphs[paragraphs.length - 1] || content

  if (lastParagraph.length <= maxLength) {
    return lastParagraph.trim()
  }
  // Truncate and add ellipsis prefix
  return '...' + lastParagraph.slice(-maxLength + 3).trim()
}

/**
 * Check if a message is an error message and extract status code
 */
function extractErrorStatusCode(content: string): string | null {
  // Match common error patterns with status codes
  const statusMatch = content.match(/(?:Error|错误|失败)[:\s]*(\d{3})/i) ||
    content.match(/\[.*?(\d{3}).*?\]/) ||
    content.match(/^(🌐|⏱️|❌|🔑|⚡).*?(\d{3})/m)

  if (statusMatch) {
    const code = statusMatch[2] || statusMatch[1]
    return `[Error: ${code}]`
  }

  // Check for error indicators without status code
  if (/^(🌐|⏱️|❌|🔑|⚡|请求超时|Network|API|Failed)/m.test(content)) {
    return '[Error]'
  }

  return null
}

/**
 * Compress message history with tiered strategy based on role:
 * 
 * User Messages (High Priority):
 * - Last 20: keep full content
 * - 21-50 ago: keep last paragraph up to 280 chars
 * - 51+ ago: discard
 * 
 * Assistant Messages (Lower Priority):
 * - Last 5: keep full content
 * - 6-15 ago: keep last paragraph up to 140 chars
 * - 16+ ago: discard
 * 
 * For error messages: keep last error full (global pin), others compressed based on role quotas.
 */
function compressHistory(messages: Message[], maxTokens: number = MAX_CONTEXT_TOKENS): Message[] {
  const totalCount = messages.length
  if (totalCount === 0) return []

  // Find the index of the last error message (for special handling)
  let lastErrorIndex = -1
  for (let i = totalCount - 1; i >= 0; i--) {
    if (extractErrorStatusCode(messages[i].content)) {
      lastErrorIndex = i
      break
    }
  }

  const processedMessages: Message[] = []
  let userCount = 0
  let assistantCount = 0

  // Iterate backwards (Newest -> Oldest) to easily track "depth" per role
  for (let i = totalCount - 1; i >= 0; i--) {
    const msg = messages[i]

    // Check if this is an error message
    const errorCode = extractErrorStatusCode(msg.content)
    const isLastError = (i === lastErrorIndex)

    // 1. PINNED ERROR (Highest Priority)
    // We keep it regardless of quota, to ensure we never lose the most recent error
    if (isLastError && errorCode) {
      processedMessages.push(msg)
      // Increment quota counters to account for this slot
      if (msg.role === 'user') userCount++
      else assistantCount++
      continue
    }

    // 2. OTHER ERRORS
    // If it's an error but not the last one, we heavily compress it
    // We treat it as part of the normal quota flow
    if (errorCode) {
      const compressedErrorMsg = { ...msg, content: errorCode }

      if (msg.role === 'user') {
        userCount++
        if (userCount <= 50) processedMessages.push(compressedErrorMsg)
      } else {
        assistantCount++
        // Assistant errors are common, keep them only if recent
        if (assistantCount <= 15) processedMessages.push(compressedErrorMsg)
      }
      continue
    }

    // 3. NORMAL MESSAGES
    if (msg.role === 'user') {
      userCount++
      if (userCount <= 20) {
        // User Messages 1-20: Keep FULL
        processedMessages.push(msg)
      } else if (userCount <= 50) {
        // User Messages 21-50: Compress (280 chars)
        // We want to keep user intent as long as possible
        processedMessages.push({
          ...msg,
          content: extractLastParagraph(msg.content, 280)
        })
      }
      // User Messages 51+: Discard
    } else {
      assistantCount++
      if (assistantCount <= 5) {
        // AI Messages 1-5: Keep FULL
        processedMessages.push(msg)
      } else if (assistantCount <= 15) {
        // AI Messages 6-15: Heavily Compress (140 chars)
        processedMessages.push({
          ...msg,
          content: extractLastParagraph(msg.content, 140)
        })
      }
      // AI Messages 16+: Discard
    }
  }

  // Restore chronological order (Oldest -> Newest)
  // processedMessages was built Newest -> Oldest
  const compressedMessages = processedMessages.reverse()

  // Additional token-based check (safety net)
  let totalTokens = 0
  const finalMessages: Message[] = []

  // Iterate backwards to prioritize recent messages
  for (let i = compressedMessages.length - 1; i >= 0; i--) {
    const msg = compressedMessages[i]
    const msgTokens = estimateTokens(msg.content)

    if (totalTokens + msgTokens < maxTokens) {
      finalMessages.unshift(msg)
      totalTokens += msgTokens
    }
  }

  return finalMessages
}

/**
 * Summarize multiple messages into one sentence
 */
function summarizeMessages(messages: Message[]): string {
  if (messages.length === 0) return 'No message history'

  const userMessages = messages.filter(m => m.role === 'user')
  const assistantMessages = messages.filter(m => m.role === 'assistant')

  const summary = `User asked ${userMessages.length} questions, AI responded ${assistantMessages.length} times.`

  // Extract most important keywords
  const allContent = messages.map(m => m.content).join(' ')
  const keywords = extractKeywords(allContent, 5)

  if (keywords.length > 0) {
    return `${summary} Discussion topics include: ${keywords.join(', ')}`
  }

  return summary
}

/**
 * Extract keywords (simple implementation)
 */
function extractKeywords(text: string, maxCount: number): string[] {
  // Remove Markdown syntax
  const cleanText = text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_#>-]/g, '')

  // Tokenize (simple split by spaces and punctuation)
  const words = cleanText
    .split(/[\s,，。！？；：、\n]+/)
    .filter(w => w.length > 2 && w.length < 20)

  // Count word frequency
  const wordCount = new Map<string, number>()
  words.forEach(word => {
    const count = wordCount.get(word) || 0
    wordCount.set(word, count + 1)
  })

  // Sort and return top N
  return Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxCount)
    .map(([word]) => word)
}

/**
 * Call AI API directly from client
 * Supports OpenRouter and custom API endpoints
 * Supports streaming output
 */
export async function callChatAPI(
  request: ChatAPIRequest,
  agent: AIAgent,
  apiKey: string,
  customEndpoint?: string,
  onStream?: (content: string) => void,
  signal?: AbortSignal
): Promise<ChatAPIResponse> {
  const t = getTranslation()

  if (!apiKey) {
    throw new Error(t.errors.apiKeyRequired)
  }

  const endpoint = customEndpoint || DEFAULT_ENDPOINT

  // Build message history
  let historyMessages = request.history || []

  // If filtering needed, keep only this agent's messages and user messages
  if (request.filterByAgent) {
    historyMessages = historyMessages.filter(
      msg => msg.role === 'user' || msg.agentId === request.agentId
    )
  }

  // Compress history messages
  // If @mentioned, use 20K limit; otherwise use 200K limit
  const maxTokens = request.isMentioned ? MAX_MENTION_CONTEXT_TOKENS : MAX_CONTEXT_TOKENS
  const compressedHistory = compressHistory(historyMessages, maxTokens)

  // Build API message array - include speaker identity for assistant messages
  const messages: Array<{ role: 'system' | 'user' | 'assistant', content: string }> = compressedHistory.map((msg: Message) => {
    // For assistant messages, prefix with the AI's name so other AIs know who said it
    if (msg.role === 'assistant' && msg.agentId) {
      const speakerAgent = getAgentById(msg.agentId)
      const speakerName = speakerAgent?.name || msg.agentId
      return {
        role: msg.role,
        content: `[${speakerName}]: ${msg.content}`
      }
    }
    // User messages pass through directly
    return {
      role: msg.role,
      content: msg.content
    }
  })

  // Add comprehensive system prompt with user context
  const userContext = getUserContextInfo()
  const currentAgent = getAgentById(request.agentId)
  messages.unshift({
    role: 'system',
    content: `You are ${currentAgent?.name || 'AI Assistant'} (Model: ${(currentAgent?.model || 'unknown').split('/').pop()}) in a multi-agent group.

## CONTEXT
- Time: ${userContext.localTime} (${userContext.timezone})
- Language: ${userContext.language}

## INSTRUCTIONS
1. **Identity**: You are explicitly ${currentAgent?.name || 'AI Assistant'}. Do NOT impersonate others.
2. **Response**: Be concise, natural, and use the user's language.
3. **Format**: Use Markdown. Escape special chars.
4. **Tools**: If available, use silently. Cite docs as [^1].

## MULTI-AGENT PROTOCOL
- You are one of multiple AIs.
- **Input**: Other AIs' messages are prefixed [Name]: for context.
- **Output**: PLAIN TEXT ONLY. DO NOT prefix your response with [Name]:.
- **Collaboration**: Reference others naturally ("As Gemini said..."). Add unique insights.`
  })

  // If mentioned by another AI, add system prompt at the beginning
  if (request.mentionedByAgent) {
    const mentioningAgent = getAgentById(request.mentionedByAgent)
    const currentAgent = getAgentById(request.agentId)
    if (mentioningAgent && currentAgent) {
      messages.unshift({
        role: 'system',
        content: `${mentioningAgent.name} has invoked you.
ACTION REQUIRED:
    1. Analyze the context from ${mentioningAgent.name} and the User.
2. Provide a sharp, additive insight or solution.
3. PROTOCOL: Be concise.Do NOT use @mentions unless explicitly handing off control.`
      })
    }
  }

  // Check if the current user message already exists in history
  // In sequential mode (e.g., counting games with @All), the user message is already in history
  // and we have subsequent AI responses. We should NOT re-add the user message in this case.
  // Only add the current message if it's genuinely new (not already the last user message in history)
  const userMessagesInHistory = compressedHistory.filter(m => m.role === 'user')
  const lastUserMessage = userMessagesInHistory[userMessagesInHistory.length - 1]
  const isMessageAlreadyInHistory = lastUserMessage && lastUserMessage.content === request.message

  if (!isMessageAlreadyInHistory) {
    // Pass message content directly without formatting
    messages.push({
      role: 'user',
      content: request.message
    })
  }

  // Declare fullContent before try block so it's accessible in catch
  let fullContent = ''
  let buffer = '' // Buffer for incomplete lines

  try {
    // Call AI API with streaming enabled
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
        'X-Title': 'Group AI Chat'
      },
      body: JSON.stringify({
        model: agent.model,
        messages,
        temperature: 1.0,
        stream: true // Enable streaming output
      }),
      signal // Pass AbortSignal to support request interruption
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API error:', errorText)

      const errorMsgs = t.errors as Record<string, string>

      if (response.status === 400) {
        throw new Error(errorMsgs.badRequest400 || `${t.errors.apiError}: 400`)
      } else if (response.status === 401) {
        throw new Error(errorMsgs.invalidApiKey401 || t.errors.invalidApiKey)
      } else if (response.status === 403) {
        throw new Error(errorMsgs.forbidden403 || t.errors.invalidApiKey)
      } else if (response.status === 404) {
        throw new Error(errorMsgs.notFound404 || `${t.errors.apiError}: 404`)
      } else if (response.status === 429) {
        throw new Error(t.errors.rateLimitExceeded)
      } else if (response.status >= 500) {
        throw new Error(errorMsgs.serverError500 || `${t.errors.apiError}: ${response.status}`)
      } else {
        throw new Error(`${t.errors.apiError}: ${response.status}`)
      }
    }

    // Process streaming response
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error(t.errors.noResponseBody)
    }

    try {
      while (true) {
        // Check if aborted
        if (signal?.aborted) {
          await reader.cancel()
          throw new Error(t.errors.requestAborted)
        }

        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })

        // Add chunk to buffer
        buffer += chunk

        // Split by newline and process complete lines only
        const lines = buffer.split('\n')

        // Keep the last incomplete line in buffer
        buffer = lines.pop() || ''

        // Process complete lines
        for (const line of lines) {
          if (line.trim() === '') continue

          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content

              if (content) {
                fullContent += content
                // Call streaming callback
                if (onStream) {
                  onStream(fullContent)
                }
              }
            } catch (e) {
              // Ignore parse errors
              console.warn('Failed to parse SSE data:', data)
            }
          }
        }
      }
    } finally {
      // Ensure reader is properly released and connection closed promptly
      reader.releaseLock()
    }

    if (!fullContent) {
      throw new Error(t.errors.noContent)
    }

    return { content: fullContent }
  } catch (error) {
    // Handle abort errors - silently return current content without interrupting user
    if (error instanceof Error && error.name === 'AbortError') {
      return { content: fullContent || '' }
    }
    // Handle network errors (Failed to fetch)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const errorMsgs = t.errors as Record<string, string>
      throw new Error(errorMsgs.networkError || '🌐 Network connection failed. Please check your internet connection.')
    }
    if (error instanceof Error) {
      throw error
    }
    throw new Error(t.errors.apiCallFailed)
  }
}

/**
 * Get API keys from URL parameters
 * Supports multiple ?api= parameters
 */
export function getAPIKeysFromURL(): string[] {
  if (typeof window === 'undefined') return []

  const params = new URLSearchParams(window.location.search)
  const apiKeys: string[] = []

  // Get all api parameters
  params.forEach((value, key) => {
    if (key === 'api' && value.trim()) {
      apiKeys.push(value.trim())
    }
  })

  return apiKeys
}

/**
 * Get saved API key from localStorage
 */
export function getSavedAPIKey(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('openrouter_api_key')
}

/**
 * Save API key to localStorage
 */
export function saveAPIKey(apiKey: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('openrouter_api_key', apiKey)
}

/**
 * Clear saved API key
 */
export function clearSavedAPIKey(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('openrouter_api_key')
}

/**
 * Get available API key
 * Priority: URL parameter > localStorage
 */
export function getAvailableAPIKey(): string | null {
  // First try URL
  const urlKeys = getAPIKeysFromURL()
  if (urlKeys.length > 0) {
    return urlKeys[0]
  }

  // Then try localStorage
  return getSavedAPIKey()
}

/**
 * Get all available API keys (from both URL and localStorage)
 */
export function getAllAPIKeys(): string[] {
  const keys = new Set<string>()

  // Add keys from URL
  getAPIKeysFromURL().forEach(key => keys.add(key))

  // Add key from localStorage
  const savedKey = getSavedAPIKey()
  if (savedKey) {
    keys.add(savedKey)
  }

  return Array.from(keys)
}

/**
 * Save custom API endpoint
 */
export function saveCustomEndpoint(endpoint: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('custom_api_endpoint', endpoint)
}

/**
 * Get API endpoint from URL parameters
 */
export function getEndpointFromURL(): string | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  return params.get('endpoint')
}

/**
 * Get custom API endpoint
 * Priority: URL parameter > localStorage
 */
export function getCustomEndpoint(): string | null {
  if (typeof window === 'undefined') return null

  // First try URL
  const urlEndpoint = getEndpointFromURL()
  if (urlEndpoint) return urlEndpoint

  // Then try localStorage
  return localStorage.getItem('custom_api_endpoint')
}

/**
 * Clear custom API endpoint
 */
export function clearCustomEndpoint(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('custom_api_endpoint')
}

/**
 * Get models from URL parameters
 * Format: ?models=model1,model2,model3
 */
export function getModelsFromURL(): string[] | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  const modelsParam = params.get('models')
  if (modelsParam) {
    return modelsParam.split(',').map(m => m.trim()).filter(m => m)
  }
  return null
}

/**
 * Save models configuration to localStorage
 */
export function saveModelsConfig(models: string[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('custom_models', JSON.stringify(models))
}

/**
 * Get saved models configuration from localStorage
 */
export function getSavedModelsConfig(): string[] | null {
  if (typeof window === 'undefined') return null
  const saved = localStorage.getItem('custom_models')
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch {
      return null
    }
  }
  return null
}

/**
 * Clean sensitive parameters from URL
 * Removes api, endpoint, and models from URL without page reload
 */
export function cleanURLParameters(): void {
  if (typeof window === 'undefined') return

  const url = new URL(window.location.href)
  const params = url.searchParams

  // Check if any sensitive parameters exist
  const hasApi = params.has('api')
  const hasEndpoint = params.has('endpoint')
  const hasModels = params.has('models')

  if (hasApi || hasEndpoint || hasModels) {
    // Remove sensitive parameters
    params.delete('api')
    params.delete('endpoint')
    params.delete('models')

    // Update URL without reload
    const newUrl = params.toString() ? `${url.pathname}?${params.toString()}` : url.pathname
    window.history.replaceState({}, '', newUrl)
  }
}

/**
 * Fetch available model list from API
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
      const t = getTranslation()
      throw new Error(`${t.errors.fetchModelsFailed}: ${response.status}`)
    }

    const data = await response.json()
    // OpenRouter returns { data: [{ id: "model-name" }] }
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
 * Extract short name from full model name
 * Examples: "anthropic/claude-sonnet-4.5" => "Sonnet"
 *          "openai/gpt-5" => "GPT"
 *          "google/gemini-2.5-pro" => "Gemini"
 */
export function extractModelShortName(fullModelName: string): string {
  // Remove provider prefix (provider/)
  const withoutProvider = fullModelName.split('/').pop() || fullModelName

  // Extract main name
  if (withoutProvider.includes('claude')) {
    if (withoutProvider.includes('sonnet')) return 'Sonnet'
    if (withoutProvider.includes('opus')) return 'Opus'
    if (withoutProvider.includes('haiku')) return 'Haiku'
    return 'Claude'
  } else if (withoutProvider.includes('gpt')) {
    return 'GPT'
  } else if (withoutProvider.includes('gemini')) {
    return 'Gemini'
  } else if (withoutProvider.includes('llama')) {
    return 'Llama'
  } else if (withoutProvider.includes('mistral')) {
    return 'Mistral'
  }

  // If unrecognized, return first word with capitalized first letter
  const firstWord = withoutProvider.split('-')[0]
  return firstWord.charAt(0).toUpperCase() + firstWord.slice(1)
}
