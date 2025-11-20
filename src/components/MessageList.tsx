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

  // 判断当前消息是否正在流式输出
  const isStreaming = message.id === 'streaming' && message.agentId && streamingMessages.has(message.agentId)

  // 判断是否在等待此AI的回复（仅当该AI在pendingAgents列表中）
  const isWaitingForResponse = !isUser && message.agentId && pendingAgents.includes(message.agentId) && !isStreaming && message.id !== 'streaming'

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
              rounded-lg px-4 py-3 pb-8 break-words transition-all relative
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

            {/* 折叠状态标识 */}
            {shouldCollapse && (
              <div className="flex items-center gap-2 mb-2 text-xs opacity-70">
                {hasMarkdown && (
                  <span className="px-2 py-0.5 bg-white/20 dark:bg-black/20 rounded">
                    Markdown
                  </span>
                )}
                {isCollapsed && (
                  <span className="px-2 py-0.5 bg-white/20 dark:bg-black/20 rounded">
                    点击{hasMarkdown ? '全屏查看' : '展开'}
                  </span>
                )}
              </div>
            )}

            {/* 消息内容 */}
            {hasMarkdown && !isCollapsed ? (
              // Markdown 渲染
              <div className={isUser ? 'text-white' : ''}>
                <MarkdownRenderer content={message.content} />
              </div>
            ) : isCollapsed ? (
              // 折叠状态：显示摘要
              <div className="whitespace-pre-wrap opacity-80">
                {summary}
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

            {/* 生成中动画和停止按钮 - 显示在右下角 */}
            {isStreaming && (
              <div className="absolute bottom-2 right-2 flex items-center gap-2">
                {/* Generating SVG 动画 */}
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="4" cy="12" r="2" fill="currentColor">
                      <animate id="spinner_qFRN_1" begin="0;spinner_OcgL_1.end+0.25s" attributeName="cy" calcMode="spline" dur="0.6s" values="12;6;12" keySplines=".33,.66,.66,1;.33,0,.66,.33"></animate>
                    </circle>
                    <circle cx="12" cy="12" r="2" fill="currentColor">
                      <animate begin="spinner_qFRN_1.begin+0.1s" attributeName="cy" calcMode="spline" dur="0.6s" values="12;6;12" keySplines=".33,.66,.66,1;.33,0,.66,.33"></animate>
                    </circle>
                    <circle cx="20" cy="12" r="2" fill="currentColor">
                      <animate id="spinner_OcgL_1" begin="spinner_qFRN_1.begin+0.2s" attributeName="cy" calcMode="spline" dur="0.6s" values="12;6;12" keySplines=".33,.66,.66,1;.33,0,.66,.33"></animate>
                    </circle>
                  </svg>
                </div>

                {/* Stop Generating 按钮 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (message.agentId) {
                      stopGeneration(message.agentId)
                    }
                  }}
                  className="flex items-center gap-1 px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition-colors"
                  title={t.stop}
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" />
                  </svg>
                  <span>{t.stop}</span>
                </button>
              </div>
            )}

            {/* 等待生成动画 - 在收到用户消息后显示 */}
            {isWaitingForResponse && (
              <div className="absolute bottom-2 right-2 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="4" cy="12" r="2" fill="currentColor">
                    <animate id="spinner_qFRN_2" begin="0;spinner_OcgL_2.end+0.25s" attributeName="cy" calcMode="spline" dur="0.6s" values="12;6;12" keySplines=".33,.66,.66,1;.33,0,.66,.33"></animate>
                  </circle>
                  <circle cx="12" cy="12" r="2" fill="currentColor">
                    <animate begin="spinner_qFRN_2.begin+0.1s" attributeName="cy" calcMode="spline" dur="0.6s" values="12;6;12" keySplines=".33,.66,.66,1;.33,0,.66,.33"></animate>
                  </circle>
                  <circle cx="20" cy="12" r="2" fill="currentColor">
                    <animate id="spinner_OcgL_2" begin="spinner_qFRN_2.begin+0.2s" attributeName="cy" calcMode="spline" dur="0.6s" values="12;6;12" keySplines=".33,.66,.66,1;.33,0,.66,.33"></animate>
                  </circle>
                </svg>
              </div>
            )}

            {/* 字符计数 - 仅在流式输出时显示 */}
            {isStreaming && (
              <div className="absolute bottom-2 left-2 text-xs text-gray-400 dark:text-gray-500">
                {message.content.length} {t.responseCount}
              </div>
            )}
          </div>

          {/* 时间戳 */}
          <div className={`text-xs text-gray-500 dark:text-gray-500 mt-1 px-1 ${
            isUser ? 'text-right' : 'text-left'
          }`}>
            {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit'
            })}
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

  // 自动滚动到底部（仅当用户在底部附近时）
  useEffect(() => {
    if (shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, streamingMessages, shouldAutoScroll])

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
                  rounded-lg px-4 py-3 pb-8 break-words relative
                  ${bgColorClasses[agent.color]} text-gray-900 dark:text-gray-100
                `}
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
