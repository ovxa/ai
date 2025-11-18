import { AgentId, MentionParseResult, AutocompleteOption } from '@/types'
import { AI_AGENTS, getAllAgentIds } from '@/lib/agents'

/**
 * 解析消息中的 @mention
 * @param input 用户输入的消息
 * @returns 解析结果，包含提及的 Agent IDs、清理后的内容、是否为 @all
 */
export function parseMessage(input: string): MentionParseResult {
  // 动态生成所有可能的 agent IDs
  const allAgentIds = getAllAgentIds()
  const agentIdsPattern = allAgentIds.join('|')

  // 匹配 @agentId 或 @all
  const mentionRegex = new RegExp(`@(${agentIdsPattern}|all)\\b`, 'gi')
  const matches = input.match(mentionRegex)

  if (!matches) {
    return {
      mentions: [],
      cleanContent: input.trim(),
      isAll: false
    }
  }

  // 检查是否有 @all
  const hasAll = matches.some(m => m.toLowerCase() === '@all')

  // 提取所有提及的 agent IDs
  const mentions = new Set<AgentId>()

  if (hasAll) {
    // @all 优先级最高，返回所有 agents
    getAllAgentIds().forEach(id => mentions.add(id))
  } else {
    matches.forEach(match => {
      const id = match.slice(1).toLowerCase() as AgentId
      // 验证是否是有效的 agent ID
      if (allAgentIds.includes(id)) {
        mentions.add(id)
      }
    })
  }

  // 移除 @mention 获得清理后的内容
  const cleanContent = input.replace(mentionRegex, '').trim()

  return {
    mentions: Array.from(mentions),
    cleanContent,
    isAll: hasAll
  }
}

/**
 * 检测光标位置是否在 @ 之后，用于触发自动补全
 * @param text 输入文本
 * @param cursorPosition 光标位置
 * @returns 如果在 @ 之后返回 @mention 的起始位置和搜索词，否则返回 null
 */
export function detectMentionTrigger(
  text: string,
  cursorPosition: number
): { start: number; search: string } | null {
  // 向后查找最近的 @
  let atPosition = -1
  for (let i = cursorPosition - 1; i >= 0; i--) {
    const char = text[i]
    if (char === '@') {
      atPosition = i
      break
    }
    if (char === ' ' || char === '\n') {
      // 遇到空格或换行，说明不在 mention 中
      break
    }
  }

  if (atPosition === -1) {
    return null
  }

  // 提取 @ 和光标之间的搜索词
  const search = text.slice(atPosition + 1, cursorPosition)

  // 检查搜索词是否有效（只包含字母）
  if (!/^[a-z]*$/i.test(search)) {
    return null
  }

  return { start: atPosition, search }
}

/**
 * 获取自动补全选项
 * @param search 搜索词
 * @param agentStates Agent 状态映射
 * @returns 过滤后的自动补全选项
 */
export function getAutocompleteOptions(
  search: string,
  agentStates: Map<AgentId, string>
): AutocompleteOption[] {
  const searchLower = search.toLowerCase()

  const options: AutocompleteOption[] = [
    {
      id: 'all',
      label: '@all (所有 AI)',
      isOnline: true
    },
    ...AI_AGENTS.map(agent => ({
      id: agent.id,
      label: `${agent.mention} (${agent.name})`,
      color: agent.color,
      isOnline: agentStates.get(agent.id) !== 'offline'
    }))
  ]

  // 如果有搜索词，进行过滤
  if (searchLower) {
    return options.filter(option => {
      const id = option.id.toLowerCase()
      const label = option.label.toLowerCase()
      return id.includes(searchLower) || label.includes(searchLower)
    })
  }

  return options
}

/**
 * 在文本中插入选中的 mention
 * @param text 原始文本
 * @param mention 选中的 mention
 * @param start @ 的起始位置
 * @param cursorPosition 当前光标位置
 * @returns 新的文本和光标位置
 */
export function insertMention(
  text: string,
  mention: string,
  start: number,
  cursorPosition: number
): { newText: string; newCursorPosition: number } {
  const before = text.slice(0, start)
  const after = text.slice(cursorPosition)
  const mentionText = `@${mention} `

  const newText = before + mentionText + after
  const newCursorPosition = start + mentionText.length

  return { newText, newCursorPosition }
}

/**
 * 高亮显示消息中的 @mentions
 * @param content 消息内容
 * @returns 包含高亮标记的 HTML 字符串或 React 元素数组
 */
export function highlightMentions(content: string): Array<{ type: 'text' | 'mention'; content: string; agentId?: AgentId }> {
  // 动态生成所有可能的 agent IDs
  const allAgentIds = getAllAgentIds()
  const agentIdsPattern = allAgentIds.join('|')

  const mentionRegex = new RegExp(`(@(?:${agentIdsPattern}|all))\\b`, 'gi')
  const parts: Array<{ type: 'text' | 'mention'; content: string; agentId?: AgentId }> = []

  let lastIndex = 0
  let match

  while ((match = mentionRegex.exec(content)) !== null) {
    // 添加 mention 之前的文本
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex, match.index)
      })
    }

    // 添加 mention
    const mention = match[1]
    const agentId = mention.slice(1).toLowerCase() as AgentId | 'all'
    parts.push({
      type: 'mention',
      content: mention,
      agentId: agentId === 'all' ? undefined : agentId
    })

    lastIndex = mentionRegex.lastIndex
  }

  // 添加最后的文本
  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      content: content.slice(lastIndex)
    })
  }

  return parts
}
