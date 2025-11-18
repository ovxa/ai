import { AIAgent } from '@/types'

export const AI_AGENTS: AIAgent[] = [
  {
    id: 'analyst',
    name: '分析者 Claude',
    mention: '@analyst',
    color: 'blue',
    role: '问题分析和信息提取',
    systemPrompt: `你是一个逻辑严密的分析师。你的任务是：
1. 深入分析用户的问题，提取关键信息
2. 识别问题的核心需求和潜在挑战
3. 提供结构化的分析框架
4. 指出可能被忽视的重要细节
请保持客观、严谨，注重数据和逻辑。`,
    model: 'anthropic/claude-sonnet-4.5'
  },
  {
    id: 'creator',
    name: '创意者 GPT',
    mention: '@creator',
    color: 'purple',
    role: '创新方案和头脑风暴',
    systemPrompt: `你是一个充满创意的思考者。你的任务是：
1. 基于分析者的见解，提出创新解决方案
2. 进行头脑风暴，探索多种可能性
3. 突破常规思维，提供独特视角
4. 将抽象想法转化为可行方案
鼓励大胆创新，同时保持实用性。`,
    model: 'openai/gpt-5'
  },
  {
    id: 'evaluator',
    name: '评估者 Gemini',
    mention: '@evaluator',
    color: 'green',
    role: '方案评估和风险分析',
    systemPrompt: `你是一个谨慎的评估专家。你的任务是：
1. 评估创意者提出的方案的可行性
2. 识别潜在风险和挑战
3. 提供改进建议和优化方向
4. 综合考虑成本、时间、资源等因素
保持批判性思维，但要建设性地提出意见。`,
    model: 'google/gemini-2.5-pro'
  }
]

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
 * 更新 AI Agent 的模型配置
 */
export const updateAgentModel = (agentId: string, model: string) => {
  const agent = AI_AGENTS.find(a => a.id === agentId)
  if (agent) {
    agent.model = model
    // 保存到 localStorage
    if (typeof window !== 'undefined') {
      const customModels = getCustomModels()
      customModels[agentId] = model
      localStorage.setItem('ai_custom_models', JSON.stringify(customModels))
    }
  }
}

/**
 * 获取自定义模型配置
 */
export const getCustomModels = (): Record<string, string> => {
  if (typeof window === 'undefined') return {}
  const saved = localStorage.getItem('ai_custom_models')
  return saved ? JSON.parse(saved) : {}
}

/**
 * 初始化自定义模型配置
 */
export const initializeCustomModels = () => {
  const customModels = getCustomModels()
  Object.entries(customModels).forEach(([agentId, model]) => {
    const agent = AI_AGENTS.find(a => a.id === agentId)
    if (agent) {
      agent.model = model
    }
  })
}

/**
 * 重置所有模型为默认值
 */
export const resetModelsToDefault = () => {
  AI_AGENTS[0].model = 'anthropic/claude-sonnet-4.5'
  AI_AGENTS[1].model = 'openai/gpt-5'
  AI_AGENTS[2].model = 'google/gemini-2.5-pro'
  if (typeof window !== 'undefined') {
    localStorage.removeItem('ai_custom_models')
  }
}
