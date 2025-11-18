import { AIAgent, AgentColor } from '@/types'
import { extractModelShortName } from './api'

// 默认模型配置
const DEFAULT_MODELS = [
  'anthropic/claude-sonnet-4.5',
  'openai/gpt-5',
  'google/gemini-2.5-pro'
]

// 动态生成 AI agents 配置
const generateAgents = (models: string[]): AIAgent[] => {
  const colors: AgentColor[] = ['blue', 'purple', 'green', 'orange', 'pink', 'cyan']

  return models.map((model, index) => {
    const shortName = extractModelShortName(model)
    const agentId = shortName.toLowerCase()

    return {
      id: agentId,
      name: shortName,
      mention: `@${agentId}`,
      color: colors[index % colors.length],
      role: '', // 不再设置固定角色
      systemPrompt: '', // 不再设置系统提示词
      model
    }
  })
}

// 私有变量存储 AI agents
let AI_AGENTS: AIAgent[] = generateAgents(DEFAULT_MODELS)

// Getter 函数获取所有 agents（避免直接导出可变变量）
export const getAgents = (): AIAgent[] => AI_AGENTS

export const getAgentById = (id: string) => {
  return AI_AGENTS.find(agent => agent.id === id)
}

export const getAgentByMention = (mention: string) => {
  return AI_AGENTS.find(agent => agent.mention === mention)
}

export const getAllAgentIds = () => {
  return AI_AGENTS.map(agent => agent.id)
}

/**
 * 获取自定义模型配置（完整列表）
 */
export const getCustomModels = (): string[] => {
  if (typeof window === 'undefined') return DEFAULT_MODELS
  const saved = localStorage.getItem('ai_custom_models')
  return saved ? JSON.parse(saved) : DEFAULT_MODELS
}

/**
 * 保存自定义模型配置
 */
export const saveCustomModels = (models: string[]) => {
  if (typeof window === 'undefined') return
  localStorage.setItem('ai_custom_models', JSON.stringify(models))
  // 重新生成 agents
  AI_AGENTS = generateAgents(models)
}

/**
 * 添加新模型
 */
export const addModel = (model: string) => {
  const currentModels = getCustomModels()
  if (!currentModels.includes(model)) {
    const newModels = [...currentModels, model]
    saveCustomModels(newModels)
  }
}

/**
 * 删除模型
 */
export const removeModel = (index: number) => {
  const currentModels = getCustomModels()
  if (currentModels.length > 1) { // 至少保留一个模型
    const newModels = currentModels.filter((_, i) => i !== index)
    saveCustomModels(newModels)
  }
}

/**
 * 更新指定位置的模型
 */
export const updateModel = (index: number, model: string) => {
  const currentModels = getCustomModels()
  if (index >= 0 && index < currentModels.length) {
    const newModels = [...currentModels]
    newModels[index] = model
    saveCustomModels(newModels)
  }
}

/**
 * 初始化自定义模型配置
 */
export const initializeCustomModels = () => {
  const customModels = getCustomModels()
  AI_AGENTS = generateAgents(customModels)
}

/**
 * 重置所有模型为默认值
 */
export const resetModelsToDefault = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('ai_custom_models')
  }
  AI_AGENTS = generateAgents(DEFAULT_MODELS)
}
