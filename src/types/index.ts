export type AgentId = 'analyst' | 'creator' | 'evaluator'
export type AgentStatus = 'online' | 'offline' | 'typing' | 'error'

export interface AIAgent {
  id: AgentId
  name: string
  mention: string
  color: 'blue' | 'purple' | 'green'
  role: string
  systemPrompt: string
  model: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  agentId?: AgentId
  timestamp: number
  mentions?: AgentId[]
}

export interface AgentState {
  id: AgentId
  status: AgentStatus
  lastActive: number
}

export interface MentionParseResult {
  mentions: AgentId[]
  cleanContent: string
  isAll: boolean
}

export interface AutocompleteOption {
  id: AgentId | 'all'
  label: string
  color?: string
  isOnline: boolean
}
