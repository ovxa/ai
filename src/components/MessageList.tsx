import { useEffect, useRef, useState } from 'react'
import { Message, AgentColor } from '@/types'
import { useChatStore } from '@/lib/store'
import { getAgentById } from '@/lib/agents'
import { highlightMentions } from '@/utils/mention'
import { hasMarkdownSyntax, generateSummary } from '@/utils/markdown'
import MarkdownRenderer from './MarkdownRenderer'
import FullscreenMarkdown from './FullscreenMarkdown'

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

function MessageBubble({ message }: { message: Message }) {
  const agent = message.agentId ? getAgentById(message.agentId) : null
  const isUser = message.role === 'user'
  const [isExpanded, setIsExpanded] = useState(false)
  const [showFullscreen, setShowFullscreen] = useState(false)

  // 检测是否包含 Markdown
  const hasMarkdown = hasMarkdownSyntax(message.content)

  // 高亮显示 @mentions（仅用于纯文本模式）
  const parts = highlightMentions(message.content)

  // 生成摘要（用于折叠显示）
  const summary = generateSummary(message.content, 80)

  // 自动折叠长消息或包含 Markdown 的消息
  const shouldCollapse = hasMarkdown || message.content.length > 200
  const isCollapsed = shouldCollapse && !isExpanded

  const handleClick = () => {
    if (shouldCollapse) {
      if (hasMarkdown) {
        // Markdown 消息：打开全屏查看
        setShowFullscreen(true)
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
              rounded-lg px-4 py-3 break-words transition-all
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
      {showFullscreen && (
        <FullscreenMarkdown
          content={message.content}
          onClose={() => setShowFullscreen(false)}
        />
      )}
    </>
  )
}

export default function MessageList() {
  const messages = useChatStore(state => state.messages)
  const streamingAgentId = useChatStore(state => state.streamingAgentId)
  const streamingContent = useChatStore(state => state.streamingContent)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-lg font-medium">开始对话</p>
          <p className="text-sm mt-2">使用 @ 提及特定 AI，或直接发送消息</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-6">
      {messages.map(message => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {/* 流式输出中的消息 */}
      {streamingAgentId && streamingContent && (
        <MessageBubble
          message={{
            id: 'streaming',
            role: 'assistant',
            content: streamingContent,
            agentId: streamingAgentId,
            timestamp: Date.now()
          }}
        />
      )}

      <div ref={messagesEndRef} />
    </div>
  )
}
