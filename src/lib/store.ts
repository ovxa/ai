import { create } from 'zustand'
import { AgentId, AgentStatus, Message, AgentState } from '@/types'
import { getAllAgentIds, getAgentById, initializeCustomModels, getModelsFromURL, saveCustomModels } from './agents'
import { parseMessage } from '@/utils/mention'
import { callChatAPI, getAvailableAPIKey, saveAPIKey, getCustomEndpoint, getEndpointFromURL, saveCustomEndpoint, cleanURLParameters, migrateAPIKey } from './api'
import { getTranslation } from './i18n'
import { secureGetItem, secureSetItem } from '@/utils/encryption'

interface ChatStore {
  // State
  messages: Message[]
  agents: Map<AgentId, AgentState>
  currentMentions: AgentId[] // Agents mentioned in current message
  pendingAgents: AgentId[] // Agents waiting for response (show generating animation)
  isLoading: boolean
  error: string | null
  apiKey: string | null // Currently used API key
  customEndpoint: string | null // Custom API endpoint
  streamingMessages: Map<AgentId, string> // Streaming content from multiple AIs simultaneously
  abortControllers: Map<AgentId, AbortController> // Independent abort controller for each AI
  aiMentionCount: number // AI-to-AI mention counter (starts from latest user message)
  sequentialMode: boolean // Sequential mode for low-power devices

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
  setAPIKey: (key: string) => Promise<void>
  setCustomEndpoint: (endpoint: string | null) => void
  setSequentialMode: (enabled: boolean) => Promise<void>
  initializeAPIKey: () => Promise<void>
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

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  agents: initializeAgents(),
  currentMentions: [],
  pendingAgents: [],
  isLoading: false,
  error: null,
  apiKey: null,
  customEndpoint: null,
  streamingMessages: new Map(),
  abortControllers: new Map(),
  aiMentionCount: 0,
  sequentialMode: false,

  addMessage: (message) => {
    const newMessage: Message = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      timestamp: Date.now()
    }
    set(state => ({
      messages: [...state.messages, newMessage]
    }))
  },

  deleteMessage: (messageId) => {
    set(state => ({
      messages: state.messages.filter(msg => msg.id !== messageId)
    }))
  },

  updateStreamingMessage: (agentId, content) => {
    set(state => {
      const newStreamingMessages = new Map(state.streamingMessages)
      newStreamingMessages.set(agentId, content)
      return { streamingMessages: newStreamingMessages }
    })
    // Remove from pendingAgents when AI starts streaming output
    const { pendingAgents } = get()
    if (pendingAgents.includes(agentId)) {
      set({ pendingAgents: pendingAgents.filter(id => id !== agentId) })
    }
  },

  finalizeStreamingMessage: (agentId) => {
    const { streamingMessages, addMessage, sendToSpecificAgents, aiMentionCount } = get()
    const content = streamingMessages.get(agentId)
    if (content) {
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
    streamingMessages.forEach((content, agentId) => {
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
    const { addMessage, sendToSpecificAgents, stopAllGeneration, sequentialMode } = get()

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

    // Decide send strategy based on mentions and sequential mode
    if (mentions.length > 0) {
      // Has @mention: send to specific agents, use sequential mode preference
      await sendToSpecificAgents(cleanContent, mentions, sequentialMode, false)
    } else {
      // No @mention: use sequential mode preference, each AI only sees their own and user's conversation (filter messages)
      const allAgents = getAllAgentIds()
      await sendToSpecificAgents(cleanContent, allAgents, sequentialMode, true)
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

    set({ isLoading: true, error: null, pendingAgents: agentIds })

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
      set({ isLoading: false, pendingAgents: [] })
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
        const newPendingAgents = state.pendingAgents.filter(id => id !== agentId)

        return {
          abortControllers: newControllers,
          pendingAgents: newPendingAgents,
          // If no more AIs are generating, set isLoading to false
          isLoading: newPendingAgents.length > 0 || state.streamingMessages.size > 1
        }
      })
    }
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
      pendingAgents: []
    })
  },

  setAPIKey: async (key) => {
    set({ apiKey: key })
    if (key) {
      await saveAPIKey(key)
    }
  },

  setCustomEndpoint: (endpoint) => {
    set({ customEndpoint: endpoint })
  },

  setSequentialMode: async (enabled) => {
    set({ sequentialMode: enabled })
    await secureSetItem('sequential_mode', enabled ? 'true' : 'false')
  },

  initializeAPIKey: async () => {
    // Migrate existing API key to encrypted storage
    await migrateAPIKey()

    // Read and save API key from URL if present
    const key = await getAvailableAPIKey()
    if (key) {
      set({ apiKey: key })
      await saveAPIKey(key) // Ensure saved to localStorage before URL cleanup
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

    // Initialize sequential mode preference
    const sequentialModeStr = await secureGetItem('sequential_mode')
    if (sequentialModeStr) {
      set({ sequentialMode: sequentialModeStr === 'true' })
    }

    // Clean sensitive URL parameters after all data is saved
    cleanURLParameters()
  },

  reset: () => {
    // Stop all ongoing generation first
    get().stopAllGeneration()

    // Clear conversation and reset state
    set({
      messages: [],
      agents: initializeAgents(),
      currentMentions: [],
      pendingAgents: [],
      isLoading: false,
      error: null,
      aiMentionCount: 0,
      streamingMessages: new Map()
    })
  }
}))
