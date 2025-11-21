import { useEffect, useRef, useState, memo } from 'react'
import { Message, AgentColor } from '@/types'
import { useChatStore } from '@/lib/store'
import { getAgentById } from '@/lib/agents'
import { highlightMentions } from '@/utils/mention'
import { hasMarkdownSyntax, generateSummary } from '@/utils/markdown'
import MarkdownRenderer from './MarkdownRenderer'
import FullscreenMarkdown from './FullscreenMarkdown'
import { useTranslation } from '@/lib/i18n'

const colorClasses: Record<AgentColor, string> = {
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  pink: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  cyan: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
}

const bgColorClasses: Record<AgentColor, string> = {
  blue: 'bg-blue-50 dark:bg-blue-900/30',
  purple: 'bg-purple-50 dark:bg-purple-900/30',
  green: 'bg-green-50 dark:bg-green-900/30',
  orange: 'bg-orange-50 dark:bg-orange-900/30',
  pink: 'bg-pink-50 dark:bg-pink-900/30',
  cyan: 'bg-cyan-50 dark:bg-cyan-900/30',
}

const dotColorClasses: Record<AgentColor, string> = {
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  green: 'bg-green-500',
  orange: 'bg-orange-500',
  pink: 'bg-pink-500',
  cyan: 'bg-cyan-500',
}

interface MessageBubbleProps {
  message: Message
  stableKey: string // 稳定的键，用于维护状态
  isFullscreenOpen?: boolean
  onFullscreenToggle?: (open: boolean) => void
}

// 使用 React.memo 优化性能，避免不必要的重渲染
const MessageBubble = memo(function MessageBubble({
  message,
  stableKey,
  isFullscreenOpen = false,
  onFullscreenToggle
}: MessageBubbleProps) {
  const agent = message.agentId ? getAgentById(message.agentId) : null
  const isUser = message.role === 'user'
  const [isExpanded, setIsExpanded] = useState(false)
  const t = useTranslation()

  // 获取当前流式输出状态
  const streamingMessages = useChatStore(state => state.streamingMessages)
  const pendingAgents = useChatStore(state => state.pendingAgents)
  const stopGeneration = useChatStore(state => state.stopGeneration)
  const deleteMessage = useChatStore(state => state.deleteMessage)

  // 判断当前消息是否正在流式输出
  const isStreaming = message.id === 'streaming' && message.agentId && streamingMessages.has(message.agentId)

  // 检测是否包含 Markdown
  const hasMarkdown = hasMarkdownSyntax(message.content)

  // 高亮显示 @mentions（仅用于纯文本模式）
  const parts = highlightMentions(message.content)

  // 生成摘要（用于折叠显示）
  const summary = generateSummary(message.content, 80)

  // 自动折叠长消息（12行以上）或包含 Markdown 的消息
  const lineCount = message.content.split('\n').length
  const shouldCollapse = hasMarkdown || lineCount > 12
  const isCollapsed = shouldCollapse && !isExpanded

  const handleClick = () => {
    if (shouldCollapse) {
      if (hasMarkdown) {
        // Markdown 消息：打开全屏查看
        onFullscreenToggle?.(true)
      } else {
        // 长消息：展开/折叠
        setIsExpanded(!isExpanded)
      }
    }
  }

  return (
    <>
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
          {/* 发送者信息 */}
          {!isUser && agent && (
            <div className="flex items-center gap-2 mb-1 px-1">
              <div className={`w-2 h-2 rounded-full ${dotColorClasses[agent.color]}`} />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {agent.name}
              </span>
            </div>
          )}

          {/* 消息气泡 */}
          <div
            className={`
              rounded-lg px-4 py-3 break-words transition-all relative
              ${shouldCollapse ? 'cursor-pointer hover:shadow-lg' : ''}
              ${isUser
                ? 'bg-blue-500 text-white'
                : agent
                  ? `${bgColorClasses[agent.color]} text-gray-900 dark:text-gray-100`
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
              }
            `}
            onClick={handleClick}
          >
            {/* 显示提及的 agents（仅用户消息） */}
            {isUser && message.mentions && message.mentions.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2 pb-2 border-b border-white/20">
                {message.mentions.map(mentionId => {
                  const mentionedAgent = getAgentById(mentionId)
                  return mentionedAgent ? (
                    <span
                      key={mentionId}
                      className="text-xs px-2 py-0.5 rounded bg-white/20 backdrop-blur-sm"
                    >
                      {mentionedAgent.mention}
                    </span>
                  ) : null
                })}
              </div>
            )}

            {/* 消息内容 */}
            {hasMarkdown && !isCollapsed ? (
              // Markdown 渲染
              <div className={isUser ? 'text-white' : ''}>
                <MarkdownRenderer content={message.content} />
              </div>
            ) : isCollapsed ? (
              // 折叠状态：显示摘要 + More
              <div className="whitespace-pre-wrap opacity-80">
                {summary}
                <span className="ml-1 opacity-60">{t.more}</span>
              </div>
            ) : (
              // 纯文本：高亮 @mentions
              <div className="whitespace-pre-wrap">
                {parts.map((part, index) => {
                  if (part.type === 'mention') {
                    const mentionedAgent = part.agentId ? getAgentById(part.agentId) : null
                    const colorClass = mentionedAgent
                      ? colorClasses[mentionedAgent.color]
                      : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'

                    return (
                      <span
                        key={index}
                        className={`inline-block px-1.5 py-0.5 rounded text-sm font-medium ${
                          part.content === '@all'
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                            : isUser
                              ? 'bg-white/30 text-white'
                              : colorClass
                        }`}
                      >
                        {part.content}
                      </span>
                    )
                  }
                  return <span key={index}>{part.content}</span>
                })}
              </div>
            )}

          </div>

          {/* 时间戳和操作按钮 */}
          <div className={`flex items-center gap-2 mt-1 px-1 ${
            isUser ? 'justify-end' : 'justify-start'
          }`}>
            {/* 时间戳 */}
            <div className="text-xs text-gray-500 dark:text-gray-500">
              {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>

            {/* 字符计数 - 仅在流式输出时显示 */}
            {!isUser && isStreaming && (
              <div className="text-xs text-gray-400 dark:text-gray-500">
                {message.content.length} {t.responseCount}
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex items-center gap-1">
              {/* 停止按钮 - 仅在AI流式输出时显示 */}
              {!isUser && isStreaming && message.agentId && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    stopGeneration(message.agentId!)
                  }}
                  className="flex items-center gap-1 px-2 py-0.5 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition-colors"
                  title={t.stop}
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" />
                  </svg>
                  <span>{t.stop}</span>
                </button>
              )}

              {/* 复制和删除按钮 - AI消息在非流式时显示，用户消息始终显示 */}
              {(isUser || (!isStreaming && message.id !== 'streaming')) && (
                <>
                  {/* 复制按钮 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigator.clipboard.writeText(message.content).then(() => {
                        // 可以添加复制成功的提示
                      }).catch(err => {
                        console.error('Failed to copy:', err)
                      })
                    }}
                    className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    title="Copy"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>

                  {/* 删除按钮 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(t.confirmDelete)) {
                        deleteMessage(message.id)
                      }
                    }}
                    className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 全屏 Markdown 查看 */}
      {isFullscreenOpen && (
        <FullscreenMarkdown
          content={message.content}
          onClose={() => onFullscreenToggle?.(false)}
          agentId={message.agentId}
          isStreaming={!!isStreaming}
          onStopGeneration={stopGeneration}
        />
      )}
    </>
  )
})

export default function MessageList() {
  const messages = useChatStore(state => state.messages)
  const streamingMessages = useChatStore(state => state.streamingMessages)
  const pendingAgents = useChatStore(state => state.pendingAgents)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const t = useTranslation()
  // Maintain fullscreen state using stable key (based on message content hash or agentId+timestamp)
  const [fullscreenStates, setFullscreenStates] = useState<Record<string, boolean>>({})
  const lastUserMessageCountRef = useRef(0)
  const prevStreamingAgentsRef = useRef<Set<string>>(new Set())


  // 生成稳定的消息key
  const getStableKey = (message: Message, agentId?: string): string => {
    // 对于流式消息，使用 agentId + 最后一条用户消息的 ID
    if (message.id === 'streaming' && agentId) {
      const lastUserMessage = messages.filter(m => m.role === 'user').pop()
      return `${agentId}-${lastUserMessage?.id || 'init'}`
    }
    // 对于普通消息，使用消息ID
    return message.id
  }

  // 切换全屏状态
  const toggleFullscreen = (key: string, open: boolean) => {
    setFullscreenStates(prev => ({ ...prev, [key]: open }))
  }

  // 检测用户是否手动滚动
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget
    const isNearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 100
    setShouldAutoScroll(isNearBottom)
  }

  // 自动滚动到底部（只在用户发送新消息后滚动）
  useEffect(() => {
    const userMessageCount = messages.filter(m => m.role === 'user').length

    // 只在用户消息数量增加时自动滚动
    if (userMessageCount > lastUserMessageCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      lastUserMessageCountRef.current = userMessageCount
    }
  }, [messages])

  // 保持全屏状态在流式消息转为普通消息时不变
  useEffect(() => {
    const currentStreamingAgents = new Set(streamingMessages.keys())
    const prevStreamingAgents = prevStreamingAgentsRef.current

    // 检测哪些 agent 刚刚完成流式输出
    const finishedAgents = Array.from(prevStreamingAgents).filter(
      agentId => !currentStreamingAgents.has(agentId)
    )

    if (finishedAgents.length > 0) {
      setFullscreenStates(prev => {
        const newStates = { ...prev }

        finishedAgents.forEach(agentId => {
          // 生成流式消息的旧 key
          const lastUserMessage = messages.filter(m => m.role === 'user').pop()
          const oldStreamingKey = `${agentId}-${lastUserMessage?.id || 'init'}`

          // 找到该 agent 最新的消息（刚刚完成的）
          const latestMessage = [...messages]
            .reverse()
            .find(m => m.agentId === agentId && m.id !== 'streaming')

          // 如果旧 key 有全屏状态，复制到新消息的 key
          if (latestMessage && newStates[oldStreamingKey]) {
            newStates[latestMessage.id] = newStates[oldStreamingKey]
            delete newStates[oldStreamingKey] // 清理旧 key
          }
        })

        return newStates
      })
    }

    // 更新追踪的流式 agent
    prevStreamingAgentsRef.current = currentStreamingAgents
  }, [streamingMessages, messages])

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-lg font-medium">{t.startConversation}</p>
          <p className="text-sm mt-2">{t.startConversationHint}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-6" onScroll={handleScroll}>
      {messages.map(message => {
        const stableKey = getStableKey(message)
        return (
          <MessageBubble
            key={message.id}
            message={message}
            stableKey={stableKey}
            isFullscreenOpen={fullscreenStates[stableKey] || false}
            onFullscreenToggle={(open) => toggleFullscreen(stableKey, open)}
          />
        )
      })}

      {/* 流式输出中的消息 - 支持多个AI同时流式输出 */}
      {Array.from(streamingMessages.entries()).map(([agentId, content]) => {
        const streamingMessage = {
          id: 'streaming',
          role: 'assistant' as const,
          content,
          agentId,
          timestamp: Date.now()
        }
        const stableKey = getStableKey(streamingMessage, agentId)
        return (
          <MessageBubble
            key={`streaming-${agentId}`}
            message={streamingMessage}
            stableKey={stableKey}
            isFullscreenOpen={fullscreenStates[stableKey] || false}
            onFullscreenToggle={(open) => toggleFullscreen(stableKey, open)}
          />
        )
      })}

      {/* 等待回复的AI占位符 - 显示生成动画 */}
      {pendingAgents.map(agentId => {
        // 跳过正在流式输出的AI
        if (streamingMessages.has(agentId)) return null

        const agent = getAgentById(agentId)
        if (!agent) return null

        return (
          <div key={`pending-${agentId}`} className="flex justify-start mb-4">
            <div className="max-w-[80%]">
              {/* 发送者信息 */}
              <div className="flex items-center gap-2 mb-1 px-1">
                <div className={`w-2 h-2 rounded-full ${dotColorClasses[agent.color]}`} />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {agent.name}
                </span>
              </div>

              {/* 占位符消息气泡 */}
              <div
                className={`
                  rounded-lg px-4 py-3 break-words relative
                  ${bgColorClasses[agent.color]} text-gray-900 dark:text-gray-100
                `}
                style={{ paddingBottom: '0.75rem' }}
              >
                {/* 生成动画 */}
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="4" cy="12" r="2" fill="currentColor">
                      <animate id="spinner_qFRN_3" begin="0;spinner_OcgL_3.end+0.25s" attributeName="cy" calcMode="spline" dur="0.6s" values="12;6;12" keySplines=".33,.66,.66,1;.33,0,.66,.33"></animate>
                    </circle>
                    <circle cx="12" cy="12" r="2" fill="currentColor">
                      <animate begin="spinner_qFRN_3.begin+0.1s" attributeName="cy" calcMode="spline" dur="0.6s" values="12;6;12" keySplines=".33,.66,.66,1;.33,0,.66,.33"></animate>
                    </circle>
                    <circle cx="20" cy="12" r="2" fill="currentColor">
                      <animate id="spinner_OcgL_3" begin="spinner_qFRN_3.begin+0.2s" attributeName="cy" calcMode="spline" dur="0.6s" values="12;6;12" keySplines=".33,.66,.66,1;.33,0,.66,.33"></animate>
                    </circle>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )
      })}

      <div ref={messagesEndRef} />
    </div>
  )
}
