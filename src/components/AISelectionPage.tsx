'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getAgents, getCustomModels, initializeCustomModels } from '@/lib/agents'
import { AIAgent, AgentColor } from '@/types'
import { useTranslation } from '@/lib/i18n'
import ThemeToggle from './ThemeToggle'

const colorClasses: Record<AgentColor, { bg: string; border: string; text: string; gradient: string }> = {
    blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/30',
        border: 'border-blue-500',
        text: 'text-blue-600 dark:text-blue-400',
        gradient: 'from-blue-500 to-blue-600'
    },
    purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/30',
        border: 'border-purple-500',
        text: 'text-purple-600 dark:text-purple-400',
        gradient: 'from-purple-500 to-purple-600'
    },
    green: {
        bg: 'bg-green-50 dark:bg-green-900/30',
        border: 'border-green-500',
        text: 'text-green-600 dark:text-green-400',
        gradient: 'from-green-500 to-green-600'
    },
    orange: {
        bg: 'bg-orange-50 dark:bg-orange-900/30',
        border: 'border-orange-500',
        text: 'text-orange-600 dark:text-orange-400',
        gradient: 'from-orange-500 to-orange-600'
    },
    pink: {
        bg: 'bg-pink-50 dark:bg-pink-900/30',
        border: 'border-pink-500',
        text: 'text-pink-600 dark:text-pink-400',
        gradient: 'from-pink-500 to-pink-600'
    },
    cyan: {
        bg: 'bg-cyan-50 dark:bg-cyan-900/30',
        border: 'border-cyan-500',
        text: 'text-cyan-600 dark:text-cyan-400',
        gradient: 'from-cyan-500 to-cyan-600'
    }
}

export default function AISelectionPage() {
    const router = useRouter()
    const t = useTranslation()
    const [agents, setAgents] = useState<AIAgent[]>([])
    const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set())
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Initialize models and get agents
        initializeCustomModels()
        const currentAgents = getAgents()
        setAgents(currentAgents)

        // Load previously selected agents from localStorage
        const saved = localStorage.getItem('ai_selected_agents')
        if (saved) {
            try {
                const savedAgents = JSON.parse(saved)
                setSelectedAgents(new Set(savedAgents))
            } catch {
                // Default: select all agents
                setSelectedAgents(new Set(currentAgents.map(a => a.id)))
            }
        } else {
            // Default: select all agents
            setSelectedAgents(new Set(currentAgents.map(a => a.id)))
        }
        setIsLoading(false)
    }, [])

    const toggleAgent = (agentId: string) => {
        const newSelected = new Set(selectedAgents)
        if (newSelected.has(agentId)) {
            // Ensure at least one agent is selected
            if (newSelected.size > 1) {
                newSelected.delete(agentId)
            }
        } else {
            newSelected.add(agentId)
        }
        setSelectedAgents(newSelected)
        // Save to localStorage
        localStorage.setItem('ai_selected_agents', JSON.stringify([...newSelected]))
    }

    const selectAll = () => {
        const all = new Set(agents.map(a => a.id))
        setSelectedAgents(all)
        localStorage.setItem('ai_selected_agents', JSON.stringify([...all]))
    }

    const startChat = () => {
        // Save selection and navigate to chat
        localStorage.setItem('ai_selected_agents', JSON.stringify([...selectedAgents]))
        router.push('/')
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="typing-dots text-primary">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-10 bg-card/80 backdrop-blur-lg border-b border-border">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                            {t.aiTrioChat}
                        </h1>
                        <span className="text-sm text-muted-foreground">
                            {t.subtitle}
                        </span>
                    </div>
                    <ThemeToggle />
                </div>
            </header>

            {/* Main Content */}
            <main className="pt-24 pb-32 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Welcome Section */}
                    <div className="text-center mb-12">
                        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                            {t.selectPage?.title || 'Select AI Assistants'}
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            {t.selectPage?.description || 'Choose the AI assistants you want to join your group chat.'}
                        </p>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex justify-center gap-4 mb-8">
                        <button
                            onClick={selectAll}
                            className="px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors text-sm"
                        >
                            {t.selectPage?.selectAll || 'Select All'}
                        </button>
                        <span className="px-4 py-2 text-sm text-muted-foreground">
                            {t.selectPage?.selectedCount?.replace('{count}', selectedAgents.size.toString()).replace('{total}', agents.length.toString()) || `${selectedAgents.size}/${agents.length} selected`}
                        </span>
                    </div>

                    {/* Agent Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12">
                        {agents.map((agent) => {
                            const isSelected = selectedAgents.has(agent.id)
                            const colors = colorClasses[agent.color]

                            return (
                                <button
                                    key={agent.id}
                                    onClick={() => toggleAgent(agent.id)}
                                    className={`
                    relative p-6 rounded-2xl border-2 transition-all duration-300
                    text-left group hover:scale-[1.02]
                    ${isSelected
                                            ? `${colors.border} ${colors.bg} shadow-lg`
                                            : 'border-border bg-card hover:border-muted-foreground/50'
                                        }
                  `}
                                >
                                    {/* Selection Indicator */}
                                    <div className={`
                    absolute top-4 right-4 w-6 h-6 rounded-full border-2 
                    flex items-center justify-center transition-all duration-300
                    ${isSelected
                                            ? `${colors.border} bg-gradient-to-r ${colors.gradient}`
                                            : 'border-muted-foreground/30'
                                        }
                  `}>
                                        {isSelected && (
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>

                                    {/* Agent Info */}
                                    <div className="pr-8">
                                        <h3 className={`text-xl font-bold mb-2 ${isSelected ? colors.text : 'text-foreground'}`}>
                                            {agent.name}
                                        </h3>
                                        <p className="text-sm font-mono text-muted-foreground mb-3">
                                            {agent.model}
                                        </p>
                                        <span className={`
                      inline-block px-3 py-1 rounded-full text-sm font-medium
                      ${isSelected
                                                ? `bg-gradient-to-r ${colors.gradient} text-white`
                                                : 'bg-muted text-muted-foreground'
                                            }
                    `}>
                                            {agent.mention}
                                        </span>
                                    </div>

                                    {/* Hover Effect */}
                                    <div className={`
                    absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 
                    transition-opacity duration-300 pointer-events-none
                    bg-gradient-to-br ${colors.gradient} mix-blend-overlay
                  `} style={{ opacity: isSelected ? 0 : undefined }} />
                                </button>
                            )
                        })}
                    </div>

                    {/* Tips for Beginners */}
                    <div className="bg-card border border-border rounded-2xl p-6 mb-8">
                        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {t.selectPage?.tipsTitle || 'Tips for Beginners'}
                        </h3>
                        <ul className="space-y-3 text-muted-foreground">
                            <li className="flex items-start gap-3">
                                <span className="text-primary mt-1">•</span>
                                <span>{t.selectPage?.tip1 || 'Use @AI-name to ask a specific AI to respond'}</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-primary mt-1">•</span>
                                <span>{t.selectPage?.tip2 || 'Send a message directly and all selected AIs will participate'}</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-primary mt-1">•</span>
                                <span>{t.selectPage?.tip3 || 'Chat history is automatically saved locally in your browser'}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </main>

            {/* Fixed Bottom Button */}
            <div className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-lg border-t border-border p-4">
                <div className="max-w-4xl mx-auto">
                    <button
                        onClick={startChat}
                        disabled={selectedAgents.size === 0}
                        className={`
              w-full py-4 rounded-2xl font-semibold text-lg
              transition-all duration-300 transform
              ${selectedAgents.size > 0
                                ? 'bg-gradient-to-r from-primary to-purple-600 text-primary-foreground hover:scale-[1.02] hover:shadow-lg'
                                : 'bg-muted text-muted-foreground cursor-not-allowed'
                            }
            `}
                    >
                        {t.selectPage?.startChat || 'Start Chat'} →
                    </button>
                </div>
            </div>
        </div>
    )
}
