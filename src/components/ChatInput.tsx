import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react'
import { AgentId } from '@/types'
import { useChatStore } from '@/lib/store'
import { detectMentionTrigger, getAutocompleteOptions, insertMention, parseMessage } from '@/utils/mention'
import MentionAutocomplete from './MentionAutocomplete'
import { useTranslation } from '@/lib/i18n'

export default function ChatInput() {
  const [input, setInput] = useState('')
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [autocompleteOptions, setAutocompleteOptions] = useState<ReturnType<typeof getAutocompleteOptions>>([])
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0)
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 })
  const [mentionTrigger, setMentionTrigger] = useState<{ start: number; search: string } | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { sendMessage, isLoading, agents, setCurrentMentions, clearCurrentMentions } = useChatStore()
  const t = useTranslation()

  // 更新自动补全
  const updateAutocomplete = (text: string, cursorPosition: number) => {
    const trigger = detectMentionTrigger(text, cursorPosition)
    setMentionTrigger(trigger)

    if (trigger) {
      const agentStatesMap = new Map(
        Array.from(agents.entries()).map(([id, state]) => [id, state.status])
      )
      const options = getAutocompleteOptions(trigger.search, agentStatesMap)
      setAutocompleteOptions(options)
      setShowAutocomplete(options.length > 0)
      setSelectedOptionIndex(0)

      // 计算自动补全位置
      if (textareaRef.current) {
        const textarea = textareaRef.current
        const rect = textarea.getBoundingClientRect()

        // 简化定位：显示在输入框上方
        setAutocompletePosition({
          top: rect.top - 10,
          left: rect.left
        })
      }
    } else {
      setShowAutocomplete(false)
    }
  }

  // 处理输入变化
  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setInput(newValue)

    const cursorPosition = e.target.selectionStart
    updateAutocomplete(newValue, cursorPosition)

    // 更新当前提及的 agents
    const { mentions } = parseMessage(newValue)
    setCurrentMentions(mentions)
  }

  // 处理键盘事件
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showAutocomplete) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedOptionIndex(prev =>
          prev < autocompleteOptions.length - 1 ? prev + 1 : prev
        )
        return
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedOptionIndex(prev => (prev > 0 ? prev - 1 : prev))
        return
      }

      if (e.key === 'Enter') {
        e.preventDefault()
        handleSelectOption(autocompleteOptions[selectedOptionIndex])
        return
      }

      if (e.key === 'Escape') {
        e.preventDefault()
        setShowAutocomplete(false)
        return
      }
    }

    // 非自动补全状态下，Enter 发送消息（Shift+Enter 换行）
    if (e.key === 'Enter' && !e.shiftKey && !showAutocomplete) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // 选择自动补全选项
  const handleSelectOption = (option: typeof autocompleteOptions[0]) => {
    if (!mentionTrigger || !textareaRef.current) return

    const mentionId = option.id
    const { newText, newCursorPosition } = insertMention(
      input,
      mentionId,
      mentionTrigger.start,
      textareaRef.current.selectionStart
    )

    setInput(newText)
    setShowAutocomplete(false)

    // 设置光标位置
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = newCursorPosition
        textareaRef.current.selectionEnd = newCursorPosition
        textareaRef.current.focus()

        // 更新提及列表
        const { mentions } = parseMessage(newText)
        setCurrentMentions(mentions)
      }
    }, 0)
  }

  // 提交消息
  const handleSubmit = async () => {
    const trimmedInput = input.trim()
    if (!trimmedInput) return

    // 立即清空输入框和提及列表
    setInput('')
    clearCurrentMentions()

    try {
      await sendMessage(trimmedInput)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  // 自动调整 textarea 高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  return (
    <div className="relative">
      {/* 自动补全弹窗 */}
      {showAutocomplete && (
        <MentionAutocomplete
          options={autocompleteOptions}
          selectedIndex={selectedOptionIndex}
          onSelect={handleSelectOption}
          onClose={() => setShowAutocomplete(false)}
          position={autocompletePosition}
        />
      )}

      {/* 输入框 */}
      <div className="flex gap-2 items-center">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={t.inputPlaceholder}
            rows={1}
            className="w-full px-4 py-3 min-h-[48px] rounded-lg border border-input
                     bg-background text-foreground
                     focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring
                     resize-none overflow-hidden"
            style={{ maxHeight: '200px' }}
          />
        </div>

        {/* 发送按钮 */}
        <button
          onClick={handleSubmit}
          disabled={!input.trim()}
          className="px-6 py-3 h-[48px] bg-primary hover:bg-primary/90 disabled:bg-muted
                   text-primary-foreground disabled:text-muted-foreground font-medium rounded-lg transition-colors
                   disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center"
        >
          {t.send}
        </button>
      </div>
    </div>
  )
}
