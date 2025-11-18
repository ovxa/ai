import { AIAgent, AgentStatus } from '@/types'
import { useChatStore } from '@/lib/store'

interface AIAgentCardProps {
  agent: AIAgent
  isMentioned: boolean
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-500',
    text: 'text-blue-600 dark:text-blue-400',
    dim: 'bg-blue-50/50 dark:bg-blue-900/10'
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-500',
    text: 'text-purple-600 dark:text-purple-400',
    dim: 'bg-purple-50/50 dark:bg-purple-900/10'
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-500',
    text: 'text-green-600 dark:text-green-400',
    dim: 'bg-green-50/50 dark:bg-green-900/10'
  }
}

const statusConfig: Record<AgentStatus, { label: string; color: string; icon: JSX.Element }> = {
  online: {
    label: '在线',
    color: 'bg-green-500',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="4" />
      </svg>
    )
  },
  typing: {
    label: '正在输入...',
    color: 'bg-blue-500',
    icon: (
      <div className="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    )
  },
  offline: {
    label: '离线',
    color: 'bg-gray-400',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="4" />
      </svg>
    )
  },
  error: {
    label: '错误',
    color: 'bg-red-500',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    )
  }
}

export default function AIAgentCard({ agent, isMentioned }: AIAgentCardProps) {
  const agents = useChatStore(state => state.agents)
  const agentState = agents.get(agent.id)
  const status = agentState?.status || 'offline'

  const colors = colorClasses[agent.color]
  const statusInfo = statusConfig[status]

  return (
    <div
      className={`
        rounded-lg border-2 p-4 transition-all duration-300
        ${isMentioned
          ? `${colors.border} ${colors.bg} opacity-100 scale-100`
          : `border-gray-200 dark:border-gray-700 ${colors.dim} opacity-50`
        }
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className={`font-semibold text-lg ${colors.text}`}>
            {agent.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
            {agent.role}
          </p>
        </div>

        {/* 状态指示器 */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${statusInfo.color}`} />
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {statusInfo.label}
          </span>
        </div>
      </div>

      {/* Mention tag */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`
          text-sm font-mono px-2 py-1 rounded
          ${isMentioned
            ? `${colors.bg} ${colors.text} border ${colors.border}`
            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600'
          }
        `}>
          {agent.mention}
        </span>
      </div>

      {/* Status animation */}
      {status === 'typing' && (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="typing-dots text-blue-500">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span>正在思考...</span>
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>响应失败</span>
        </div>
      )}
    </div>
  )
}
