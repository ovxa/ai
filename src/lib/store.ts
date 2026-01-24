import { create } from 'zustand'
import { AgentId, AgentStatus, Message, AgentState } from '@/types'
import { getAllAgentIds, getAgentById, initializeCustomModels, getModelsFromURL, saveCustomModels } from './agents'
import { parseMessage } from '@/utils/mention'
import { callChatAPI, getAvailableAPIKey, saveAPIKey, getCustomEndpoint, getEndpointFromURL, saveCustomEndpoint, cleanURLParameters } from './api'
import { getTranslation } from './i18n'

interface ChatStore {
  // State
  messages: Message[]
  agents: Map<AgentId, AgentState>
  currentMentions: AgentId[] // Agents mentioned in current message
  pendingAgents: Map<AgentId, number> // Agents waiting for response with request start timestamp
  isLoading: boolean
  error: string | null
  apiKey: string | null // Currently used API key
  customEndpoint: string | null // Custom API endpoint
  streamingMessages: Map<AgentId, string> // Streaming content from multiple AIs simultaneously
  abortControllers: Map<AgentId, AbortController> // Independent abort controller for each AI
  aiMentionCount: number // AI-to-AI mention counter (starts from latest user message)

  // Actions
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  deleteMessage: (messageId: string) => void
  updateStreamingMessage: (agentId: AgentId, content: string) => void
  finalizeStreamingMessage: (agentId: AgentId) => void
  finalizeAllStreamingMessages: () => void
  setAgentStatus: (agentId: AgentId, status: AgentStatus) => void
  setCurrentMentions: (mentions: AgentId[]) => void
  clearCurrentMentions: () => void
  clearError: () => void
  sendMessage: (content: string) => Promise<void>
  sendToSpecificAgents: (content: string, agentIds: AgentId[], sequential?: boolean, filterByAgent?: boolean, mentionedBy?: AgentId) => Promise<void>
  stopGeneration: (agentId: AgentId) => void
  stopAllGeneration: () => void
  timeoutAgent: (agentId: AgentId) => void // Timeout with friendly error message
  showErrorMessage: (agentId: AgentId, errorMessage: string) => void // Show error as AI message
  setAPIKey: (key: string) => void
  setCustomEndpoint: (endpoint: string | null) => void
  initializeAPIKey: () => void
  loadMessages: () => void // Load messages from localStorage
  reset: () => void
}

// Initialize all agents as online
const initializeAgents = (): Map<AgentId, AgentState> => {
  const agents = new Map<AgentId, AgentState>()
  getAllAgentIds().forEach(id => {
    agents.set(id, {
      id,
      status: 'online',
      lastActive: Date.now()
    })
  })
  return agents
}

// LocalStorage keys for chat history
const CHAT_HISTORY_KEY = 'ai_chat_history'

// Load messages from localStorage
const loadMessagesFromStorage = (): Message[] => {
  if (typeof window === 'undefined') return []
  try {
    const saved = localStorage.getItem(CHAT_HISTORY_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.error('Failed to load chat history:', error)
  }
  return []
}

// Save messages to localStorage
const saveMessagesToStorage = (messages: Message[]) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages))
  } catch (error) {
    console.error('Failed to save chat history:', error)
  }
}

// Strip any [AIName]: prefix from AI response (AIs sometimes copy the format)
const stripAIPrefix = (content: string): string => {
  // Match patterns like "[AIName]: " or "[AIName]:" at the beginning
  // Also handle cases where AI outputs multiple "[Name]: content" lines
  let cleaned = content.trim()

  // Remove leading [Name]: prefix (single line)
  const prefixMatch = cleaned.match(/^\[[^\]]+\]:\s*/)
  if (prefixMatch) {
    cleaned = cleaned.slice(prefixMatch[0].length)
  }

  // If the content contains multiple "[Name]:" lines (AI trying to role-play as others),
  // only keep the content that's NOT prefixed with [OtherAI]:
  // This is a simple heuristic - take just the first real content
  const lines = cleaned.split('\n')
  const cleanedLines: string[] = []
  for (const line of lines) {
    const trimmedLine = line.trim()
    // Skip lines that start with [Name]: format
    if (/^\[[^\]]+\]:/.test(trimmedLine)) {
      continue
    }
    cleanedLines.push(line)
  }

  return cleanedLines.join('\n').trim() || cleaned
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  agents: initializeAgents(),
  currentMentions: [],
  pendingAgents: new Map(),
  isLoading: false,
  error: null,
  apiKey: null,
  customEndpoint: null,
  streamingMessages: new Map(),
  abortControllers: new Map(),
  aiMentionCount: 0,

  addMessage: (message) => {
    const newMessage: Message = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      timestamp: Date.now()
    }
    set(state => {
      const newMessages = [...state.messages, newMessage]
      // Save to localStorage
      saveMessagesToStorage(newMessages)
      return { messages: newMessages }
    })
  },

  deleteMessage: (messageId) => {
    // Stop all pending/streaming generations when deleting a message
    get().stopAllGeneration()

    set(state => {
      const newMessages = state.messages.filter(msg => msg.id !== messageId)
      // Save to localStorage
      saveMessagesToStorage(newMessages)
      return { messages: newMessages }
    })
  },

  updateStreamingMessage: (agentId, content) => {
    set(state => {
      const newStreamingMessages = new Map(state.streamingMessages)
      newStreamingMessages.set(agentId, content)
      return { streamingMessages: newStreamingMessages }
    })
    // Remove from pendingAgents when AI starts streaming output
    const { pendingAgents } = get()
    if (pendingAgents.has(agentId)) {
      set(state => {
        const newPendingAgents = new Map(state.pendingAgents)
        newPendingAgents.delete(agentId)
        return { pendingAgents: newPendingAgents }
      })
    }
  },

  finalizeStreamingMessage: (agentId) => {
    const { streamingMessages, addMessage, sendToSpecificAgents, aiMentionCount } = get()
    const rawContent = streamingMessages.get(agentId)
    if (rawContent) {
      // Clean any [AIName]: prefix from AI response (AIs sometimes copy the format)
      const content = stripAIPrefix(rawContent)

      // Parse @mentions in AI response, exclude self
      const { mentions } = parseMessage(content, agentId)

      addMessage({
        role: 'assistant',
        content,
        agentId,
        mentions: mentions.length > 0 ? mentions : undefined
      })
      set(state => {
        const newStreamingMessages = new Map(state.streamingMessages)
        newStreamingMessages.delete(agentId)
        return { streamingMessages: newStreamingMessages }
      })

      // If AI response has @mentions to other AIs and hasn't exceeded count limit
      // Limit: From user message start, allow max 5 AI-to-AI mentions
      if (mentions.length > 0 && aiMentionCount < 5) {
        // Atomic operation: increment counter first, then trigger
        const newCount = aiMentionCount + 1
        set({ aiMentionCount: newCount })

        console.log(`[AI Mention Chain] ${agentId} mentioned ${mentions.join(', ')} (count: ${newCount}/5)`)

        // Synchronously trigger mentioned AIs (don't use setTimeout to avoid race conditions)
        // Pass agentId as mentionedBy so mentioned AI receives system prompt
        sendToSpecificAgents(content, mentions, false, false, agentId).catch(error => {
          console.error('Error in AI mention chain:', error)
        })
      } else if (mentions.length > 0) {
        console.log(`[AI Mention Chain] Limit reached (${aiMentionCount}/5), blocking ${agentId}'s mention of ${mentions.join(', ')}`)
      }
    }
  },

  finalizeAllStreamingMessages: () => {
    const { streamingMessages, addMessage } = get()
    streamingMessages.forEach((rawContent, agentId) => {
      // Clean any [AIName]: prefix from AI response
      const content = stripAIPrefix(rawContent)
      addMessage({
        role: 'assistant',
        content,
        agentId
      })
    })
    set({ streamingMessages: new Map() })
  },

  setAgentStatus: (agentId, status) => {
    set(state => {
      const newAgents = new Map(state.agents)
      const agent = newAgents.get(agentId)
      if (agent) {
        newAgents.set(agentId, {
          ...agent,
          status,
          lastActive: Date.now()
        })
      }
      return { agents: newAgents }
    })
  },

  setCurrentMentions: (mentions) => {
    set({ currentMentions: mentions })
  },

  clearCurrentMentions: () => {
    set({ currentMentions: [] })
  },

  clearError: () => {
    set({ error: null })
  },

  sendMessage: async (content) => {
    const { addMessage, sendToSpecificAgents, stopAllGeneration } = get()

    // Stop all previous generation
    stopAllGeneration()

    // Reset AI mention counter (reset when user sends new message)
    set({ aiMentionCount: 0 })

    // Parse @mentions in message
    const { mentions, cleanContent, isAll } = parseMessage(content)

    // Add user message
    addMessage({
      role: 'user',
      content: cleanContent,
      mentions: mentions.length > 0 ? mentions : undefined
    })

    // Decide send strategy based on mentions
    if (mentions.length > 0) {
      // Has @mention: send to specific agents SEQUENTIALLY, so each AI can see previous responses
      // This enables proper turn-based interactions like counting games
      await sendToSpecificAgents(cleanContent, mentions, true, false)
    } else {
      // No @mention: parallel execution, each AI only sees their own and user's conversation (filter messages)
      const allAgents = getAllAgentIds()
      await sendToSpecificAgents(cleanContent, allAgents, false, true)
    }
  },

  sendToSpecificAgents: async (content, agentIds, sequential = false, filterByAgent = false, mentionedBy?: AgentId) => {
    const { updateStreamingMessage, finalizeStreamingMessage, setAgentStatus, apiKey, customEndpoint, messages } = get()

    // Check API key
    if (!apiKey) {
      const t = getTranslation()
      set({
        error: t.errors.apiKeyRequired
      })
      return
    }

    // Create pendingAgents Map with request start timestamps
    const now = Date.now()
    const newPendingAgents = new Map<AgentId, number>()

    // Initialize pending agents
    if (sequential) {
      agentIds.forEach((agentId, index) => {
        // For sequential, only start the timer for the first agent
        // Others get a temporary placeholder (future time) to avoid premature timeout
        // checking in MessageList.tsx
        if (index === 0) {
          newPendingAgents.set(agentId, now)
        } else {
          newPendingAgents.set(agentId, now + 86400000) // +24 hours
        }
      })
    } else {
      agentIds.forEach(agentId => {
        newPendingAgents.set(agentId, now)
      })
    }

    set({ isLoading: true, error: null, pendingAgents: newPendingAgents })

    // Create independent AbortController for each AI
    const newAbortControllers = new Map<AgentId, AbortController>()
    agentIds.forEach(agentId => {
      newAbortControllers.set(agentId, new AbortController())
    })
    set(state => ({
      abortControllers: new Map([...state.abortControllers, ...newAbortControllers])
    }))

    // Determine if @mentioned (by checking last user message)
    const lastUserMessage = messages[messages.length - 1]
    const isMentioned = lastUserMessage?.mentions && lastUserMessage.mentions.length > 0

    try {
      if (sequential) {
        // Sequential execution: one by one, each AI waits for previous AI's response
        for (const agentId of agentIds) {
          // Check if aborted
          const agentAbortController = get().abortControllers.get(agentId)
          if (agentAbortController?.signal.aborted) {
            break
          }

          const agent = getAgentById(agentId)
          if (!agent) {
            console.error(`Agent ${agentId} not found`)
            continue
          }

          setAgentStatus(agentId, 'typing')

          // Update start time for timeout tracking upon actual start
          set(state => {
            const newPending = new Map(state.pendingAgents)
            newPending.set(agentId, Date.now())
            return { pendingAgents: newPending }
          })

          try {
            const response = await callChatAPI(
              {
                agentId,
                message: content,
                history: get().messages, // Get latest message history in real-time
                filterByAgent, // Pass filter parameter
                isMentioned, // Pass whether @mentioned
                mentionedByAgent: mentionedBy // Pass which AI mentioned
              },
              agent,
              apiKey,
              customEndpoint || undefined,
              (chunk) => {
                // Streaming update callback
                updateStreamingMessage(agentId, chunk)
              },
              agentAbortController?.signal
            )

            // Complete streaming output
            finalizeStreamingMessage(agentId)
            setAgentStatus(agentId, 'online')
          } catch (error) {
            console.error(`Error from ${agentId}:`, error)
            const t = getTranslation()
            const errorMsg = error instanceof Error ? error.message : t.errors.aiResponseError

            updateStreamingMessage(agentId, errorMsg)
            finalizeStreamingMessage(agentId)
            setAgentStatus(agentId, 'error')
          }
        }
      } else {
        // Parallel execution: send to multiple agents simultaneously, supports streaming output
        agentIds.forEach(id => setAgentStatus(id, 'typing'))

        const responses = await Promise.allSettled(
          agentIds.map(async (agentId) => {
            const agent = getAgentById(agentId)
            if (!agent) {
              throw new Error(`Agent ${agentId} not found`)
            }

            // Get independent AbortController for this AI
            const agentAbortController = get().abortControllers.get(agentId)

            try {
              // Use streaming output in parallel mode, each AI has independent streaming callback
              const response = await callChatAPI(
                {
                  agentId,
                  message: content,
                  history: get().messages,
                  filterByAgent, // Pass filter parameter
                  isMentioned, // Pass whether @mentioned
                  mentionedByAgent: mentionedBy // Pass which AI mentioned
                },
                agent,
                apiKey,
                customEndpoint || undefined,
                (chunk) => {
                  // Independent streaming update callback for each AI
                  updateStreamingMessage(agentId, chunk)
                },
                agentAbortController?.signal // Use this AI's independent signal
              )

              // Complete streaming output
              finalizeStreamingMessage(agentId)
              setAgentStatus(agentId, 'online')

              // Clean up this AI's AbortController
              set(state => {
                const newControllers = new Map(state.abortControllers)
                newControllers.delete(agentId)
                return { abortControllers: newControllers }
              })

              return { agentId, success: true }
            } catch (error) {
              console.error(`Error from ${agentId}:`, error)
              const t = getTranslation()
              const errorMsg = error instanceof Error ? error.message : t.errors.aiResponseError

              updateStreamingMessage(agentId, errorMsg)
              finalizeStreamingMessage(agentId)
              setAgentStatus(agentId, 'error')

              // Clean up this AI's AbortController
              set(state => {
                const newControllers = new Map(state.abortControllers)
                newControllers.delete(agentId)
                return { abortControllers: newControllers }
              })

              throw error
            }
          })
        )

        // Check if all requests failed
        const allFailed = responses.every(r => r.status === 'rejected')
        if (allFailed) {
          const t = getTranslation()
          set({ error: t.errors.allAisFailed })
        }
      }
    } catch (error) {
      console.error('Send message error:', error)
      const t = getTranslation()
      set({ error: t.errors.sendMessageFailed })
    } finally {
      set({ isLoading: false, pendingAgents: new Map() })
    }
  },

  stopGeneration: (agentId) => {
    const { abortControllers, finalizeStreamingMessage, pendingAgents } = get()
    const agentAbortController = abortControllers.get(agentId)

    if (agentAbortController) {
      // Abort this AI's request
      agentAbortController.abort()

      // Save this AI's generated content to message history
      finalizeStreamingMessage(agentId)

      // Remove from abortControllers
      set(state => {
        const newControllers = new Map(state.abortControllers)
        newControllers.delete(agentId)

        // Remove this AI from pendingAgents
        const newPendingAgents = new Map(state.pendingAgents)
        newPendingAgents.delete(agentId)

        return {
          abortControllers: newControllers,
          pendingAgents: newPendingAgents,
          // If no more AIs are generating, set isLoading to false
          isLoading: newPendingAgents.size > 0 || state.streamingMessages.size > 1
        }
      })
    }
  },

  timeoutAgent: (agentId) => {
    const { abortControllers, addMessage, setAgentStatus } = get()
    const agentAbortController = abortControllers.get(agentId)
    const t = getTranslation()

    // Abort the request
    if (agentAbortController) {
      agentAbortController.abort()
    }

    // Add friendly timeout error message
    addMessage({
      role: 'assistant',
      content: (t.errors as Record<string, string>).timeout || '⏱️ **Request timed out** (60s)\n\nThe AI is taking too long to respond.',
      agentId
    })

    setAgentStatus(agentId, 'error')

    // Clean up
    set(state => {
      const newControllers = new Map(state.abortControllers)
      newControllers.delete(agentId)

      const newPendingAgents = new Map(state.pendingAgents)
      newPendingAgents.delete(agentId)

      return {
        abortControllers: newControllers,
        pendingAgents: newPendingAgents,
        isLoading: newPendingAgents.size > 0 || state.streamingMessages.size > 0
      }
    })
  },

  showErrorMessage: (agentId, errorMessage) => {
    const { addMessage, setAgentStatus } = get()

    addMessage({
      role: 'assistant',
      content: errorMessage,
      agentId
    })

    setAgentStatus(agentId, 'error')
  },

  stopAllGeneration: () => {
    const { abortControllers, finalizeAllStreamingMessages } = get()

    // Abort all requests
    abortControllers.forEach((controller) => {
      controller.abort()
    })

    // Save all generated content to message history
    finalizeAllStreamingMessages()

    set({
      abortControllers: new Map(),
      isLoading: false,
      pendingAgents: new Map()
    })
  },

  setAPIKey: (key) => {
    set({ apiKey: key })
    if (key) {
      saveAPIKey(key)
    }
  },

  setCustomEndpoint: (endpoint) => {
    set({ customEndpoint: endpoint })
  },

  initializeAPIKey: () => {
    // Read and save API key from URL if present
    const key = getAvailableAPIKey()
    if (key) {
      set({ apiKey: key })
      saveAPIKey(key) // Ensure saved to localStorage before URL cleanup
    }

    // Read and save custom endpoint from URL if present
    const urlEndpoint = getEndpointFromURL()
    if (urlEndpoint) {
      saveCustomEndpoint(urlEndpoint)
      set({ customEndpoint: urlEndpoint })
    }

    // Read and save models from URL if present
    const urlModels = getModelsFromURL()
    if (urlModels && urlModels.length > 0) {
      saveCustomModels(urlModels)
    }

    // Initialize custom model configuration (reads from localStorage or defaults)
    initializeCustomModels()

    // Initialize custom endpoint from localStorage if not from URL
    const endpoint = getCustomEndpoint()
    if (endpoint) {
      set({ customEndpoint: endpoint })
    }

    // Clean sensitive URL parameters after all data is saved
    cleanURLParameters()
  },

  loadMessages: () => {
    const savedMessages = loadMessagesFromStorage()
    if (savedMessages.length > 0) {
      set({ messages: savedMessages })
    }
  },

  reset: () => {
    // Stop all ongoing generation first
    get().stopAllGeneration()

    // Clear conversation and reset state
    set({
      messages: [],
      agents: initializeAgents(),
      currentMentions: [],
      pendingAgents: new Map(),
      isLoading: false,
      error: null,
      aiMentionCount: 0,
      streamingMessages: new Map()
    })
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CHAT_HISTORY_KEY)
    }
  }
}))
