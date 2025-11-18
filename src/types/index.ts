export type AgentId = string
export type AgentStatus = 'online' | 'offline' | 'typing' | 'error'
export type AgentColor = 'blue' | 'purple' | 'green' | 'orange' | 'pink' | 'cyan'

export interface AIAgent {
  id: AgentId
  name: string
  mention: string
  color: AgentColor
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
