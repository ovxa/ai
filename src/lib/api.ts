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
 * Compress message history, keep recent messages, summarize old messages
 */
function compressHistory(messages: Message[], maxTokens: number = MAX_CONTEXT_TOKENS): Message[] {
  // Estimate total tokens
  let totalTokens = 0
  const compressedMessages: Message[] = []

  // Iterate backwards (preserve recent messages)
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    const msgTokens = estimateTokens(msg.content)

    if (totalTokens + msgTokens < maxTokens) {
      compressedMessages.unshift(msg)
      totalTokens += msgTokens
    } else {
      // Exceeded limit, summarize all remaining old messages
      const oldMessages = messages.slice(0, i + 1)

      // Boundary check: only add summary if old messages exist
      if (oldMessages.length > 0) {
        const summary = summarizeMessages(oldMessages)

        // Add summary message to the beginning
        compressedMessages.unshift({
          id: 'summary',
          role: 'assistant',
          content: `[History Summary]: ${summary}`,
          timestamp: oldMessages[0].timestamp
        })
      }

      break
    }
  }

  return compressedMessages
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

  // Build API message array - keep messages simple to avoid AI mimicking formats
  const messages: Array<{ role: 'system' | 'user' | 'assistant', content: string }> = compressedHistory.map((msg: Message) => {
    // Pass message content directly without adding prefixes or formatting
    // This prevents AI from learning and mimicking bracket/arrow patterns
    return {
      role: msg.role,
      content: msg.content
    }
  })

  // Add comprehensive system prompt with user context
  const userContext = getUserContextInfo()
  messages.unshift({
    role: 'system',
    content: `You are an AI assistant in group.ai.je, a multi-agent collaboration platform.

## Session Context
- Chat created: ${userContext.localTime}
- User timezone: ${userContext.timezone}
- System language: ${userContext.language}

## Core Behavior
- Provide brief answers for simple questions; detailed responses for complex ones.
- Adapt to the user's tone, vibe, and communication style for natural conversation.
- Reply in the user's likely native language (e.g., Chinese if they write in Chinese). For rewriting tasks, maintain the original text's language.
- Your knowledge has a training cutoff. For obscure topics with rare information, warn the user you may "hallucinate."

## Content Guidelines
- For controversial topics, offer careful, objective information without implying both sides are equally valid.
- When expressing widely-held views you disagree with, provide broader perspective afterward.
- Avoid stereotyping, including of majority groups.
- You cannot open URLs, links, or videos—ask the user to paste relevant content unless tools are provided.

## Formatting Rules
- For complex answers: use headings (## / ###), horizontal rules (---), lists, **bold**, and _italics_.
- Never use tildes (~) unless specifically for ~strikethrough~.
- Escape special markdown characters with \\ when needed (e.g., \\( outputs as \\\\().
- **Math**: Use LaTeX consistently. Inline: \\\\( E=mc^2 \\\\). Display: \\\\[ \\int f(x)\\,dx \\\\].
- Avoid nesting code blocks or tables inside lists. Keep them at root level.

## Document & Tool Usage
- When documents are attached, review and cite them using [^Index] syntax (e.g., [^1], [^1, 2]).
- If tools are enabled: respond to user first, then invoke tools silently. Avoid repeating raw tool output. Don't ask confirmation between multi-step actions unless truly ambiguous.

## Group Chat Protocol (STRICT RULES)
- You are ONE AI in a multi-agent chat. Other AIs will respond separately in their own messages.
- **FORBIDDEN BEHAVIORS** (violating these breaks the system):
  1. Do NOT start your response with any prefix like "[@name]:", "[name]:", "@name:", or similar formats.
  2. Do NOT speak for, quote, or role-play as other AI agents.
  3. Do NOT generate multiple responses on behalf of different agents.
  4. Do NOT use @mentions in your response UNLESS explicitly handing off a task.
  5. Do NOT reply to or acknowledge other AI's messages unless the user asks you to.
- Just respond directly as yourself with your answer. No labels, no prefixes, no role-play.
- Avoid mentioning your capabilities unless directly relevant.`
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
3. PROTOCOL: Be concise. Do NOT use @mentions unless explicitly handing off control.`
      })
    }
  }

  // Check if last message is already the current user message
  // If not, add current message (avoid duplication)
  const lastMessage = compressedHistory[compressedHistory.length - 1]
  if (!lastMessage || lastMessage.role !== 'user' || lastMessage.content !== request.message) {
    // Pass message content directly without formatting
    messages.push({
      role: 'user',
      content: request.message
    })
  }

  // Declare fullContent before try block so it's accessible in catch
  let fullContent = ''

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

      if (response.status === 401) {
        throw new Error(t.errors.invalidApiKey)
      } else if (response.status === 429) {
        throw new Error(t.errors.rateLimitExceeded)
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
