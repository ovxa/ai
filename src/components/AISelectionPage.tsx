'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { getAgents, getCustomModels, initializeCustomModels, saveCustomModels } from '@/lib/agents'
import { fetchAvailableModels } from '@/lib/api'
import { AIAgent, AgentColor } from '@/types'
import { useTranslation } from '@/lib/i18n'
import ThemeToggle from './ThemeToggle'

// LocalStorage keys specific to select page (independent from main app)
const SELECT_PAGE_ENDPOINT_KEY = 'select_page_api_endpoint'
const SELECT_PAGE_API_KEY_KEY = 'select_page_api_key'

// Mask API key: show first 6 and last 6 characters
const maskApiKey = (key: string): string => {
    if (!key || key.length <= 12) return key
    return `${key.slice(0, 6)}${'*'.repeat(Math.min(key.length - 12, 20))}${key.slice(-6)}`
}

// Simple black/white color scheme
const colorClasses: Record<AgentColor, { bg: string; border: string; text: string }> = {
    blue: {
        bg: 'bg-gray-50 dark:bg-gray-800/50',
        border: 'border-black dark:border-white',
        text: 'text-black dark:text-white'
    },
    purple: {
        bg: 'bg-gray-50 dark:bg-gray-800/50',
        border: 'border-black dark:border-white',
        text: 'text-black dark:text-white'
    },
    green: {
        bg: 'bg-gray-50 dark:bg-gray-800/50',
        border: 'border-black dark:border-white',
        text: 'text-black dark:text-white'
    },
    orange: {
        bg: 'bg-gray-50 dark:bg-gray-800/50',
        border: 'border-black dark:border-white',
        text: 'text-black dark:text-white'
    },
    pink: {
        bg: 'bg-gray-50 dark:bg-gray-800/50',
        border: 'border-black dark:border-white',
        text: 'text-black dark:text-white'
    },
    cyan: {
        bg: 'bg-gray-50 dark:bg-gray-800/50',
        border: 'border-black dark:border-white',
        text: 'text-black dark:text-white'
    }
}

// Extract version number from model name (ignore date patterns like 2024-05-13 or 20241022)
const extractVersionNumber = (model: string): number => {
    const lower = model.toLowerCase()

    // Remove date patterns like 2024-05-13, 20241022, -2024, etc.
    const withoutDates = lower
        .replace(/\d{8}/g, '') // Remove 8-digit dates like 20241022
        .replace(/\d{4}-\d{2}-\d{2}/g, '') // Remove YYYY-MM-DD
        .replace(/-\d{4}$/g, '') // Remove trailing -YYYY
        .replace(/-\d{4}-/g, '-') // Remove -YYYY- in middle

    // Match version numbers like 4, 4.5, 3.5, 2.0, 5.2, etc.
    const numbers = withoutDates.match(/\d+(\.\d+)?/g)
    if (!numbers) return 0

    // Return the largest number found (usually the main version)
    return Math.max(...numbers.map(n => parseFloat(n)))
}

// Get brand priority for sorting (priority brands first, others after)
const getBrandPriority = (model: string): number => {
    const lower = model.toLowerCase()
    // Priority brands get lower numbers (sorted first)
    if (lower.includes('openai') || lower.includes('gpt') || lower.includes('o1') || lower.includes('o3') || lower.includes('o4')) return 0
    if (lower.includes('google') || lower.includes('gemini') || lower.includes('gemma')) return 1
    if (lower.includes('anthropic') || lower.includes('claude')) return 2
    if (lower.includes('meta') || lower.includes('llama')) return 3
    if (lower.includes('microsoft') || lower.includes('phi')) return 4
    if (lower.includes('mistral')) return 5
    // All other vendors come after
    return 10
}

// Sort models: priority brands first, then by version number descending
const sortModelsWithPriority = (models: string[]): string[] => {
    return [...models].sort((a, b) => {
        const brandA = getBrandPriority(a)
        const brandB = getBrandPriority(b)

        // First sort by brand priority
        if (brandA !== brandB) {
            return brandA - brandB
        }

        // Then sort by version number (larger = newer, so descending)
        const numA = extractVersionNumber(a)
        const numB = extractVersionNumber(b)
        if (numA !== numB) {
            return numB - numA // Descending order (5.2 before 4.0)
        }

        // Finally alphabetical
        return a.localeCompare(b)
    })
}

// Default API endpoint for select page only
const DEFAULT_API_ENDPOINT = 'https://open.ai.je/api/nvidia/chat/completions'

// Extract vendor from model name (e.g., "google/gemini-pro" -> "google")
const extractVendor = (model: string): string => {
    if (model.includes('/')) {
        return model.split('/')[0]
    }
    // For models without vendor prefix, try to infer from name
    const lower = model.toLowerCase()
    if (lower.includes('gpt') || lower.includes('o1') || lower.includes('o3')) return 'openai'
    if (lower.includes('gemini')) return 'google'
    if (lower.includes('claude')) return 'anthropic'
    return 'other'
}

// Group models by vendor
interface VendorGroup {
    vendor: string
    models: string[]
    priority: number
}

const groupModelsByVendor = (models: string[]): VendorGroup[] => {
    const groups: Record<string, string[]> = {}

    models.forEach(model => {
        const vendor = extractVendor(model)
        if (!groups[vendor]) {
            groups[vendor] = []
        }
        groups[vendor].push(model)
    })

    // Convert to array and sort by priority
    return Object.entries(groups)
        .map(([vendor, vendorModels]) => ({
            vendor,
            models: vendorModels,
            priority: getBrandPriority(vendor)
        }))
        .sort((a, b) => a.priority - b.priority)
}

export default function AISelectionPage() {
    const router = useRouter()
    const t = useTranslation()
    const [agents, setAgents] = useState<AIAgent[]>([])
    const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set())
    const [isLoading, setIsLoading] = useState(true)

    // API Model Fetching States
    const [availableModels, setAvailableModels] = useState<string[]>([])
    const [modelSearchTerm, setModelSearchTerm] = useState('')
    const [isLoadingModels, setIsLoadingModels] = useState(false)
    const [modelError, setModelError] = useState<string | null>(null)

    // Custom endpoint state (independent from main app)
    const [customEndpoint, setCustomEndpoint] = useState<string>(DEFAULT_API_ENDPOINT)

    // API Key state (independent from main app)
    const [apiKey, setApiKey] = useState<string>('')
    const [showApiKey, setShowApiKey] = useState(false)

    // Expanded vendor groups state
    const [expandedVendors, setExpandedVendors] = useState<Set<string>>(new Set())

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

        // Load saved custom endpoint (specific to select page)
        const savedEndpoint = localStorage.getItem(SELECT_PAGE_ENDPOINT_KEY)
        if (savedEndpoint) {
            setCustomEndpoint(savedEndpoint)
        }

        // Load saved API key (specific to select page)
        const savedApiKey = localStorage.getItem(SELECT_PAGE_API_KEY_KEY)
        if (savedApiKey) {
            setApiKey(savedApiKey)
        }

        setIsLoading(false)

        // Auto-fetch available models on page load if API key exists
        const autoFetchModels = async () => {
            const keyToUse = savedApiKey
            if (!keyToUse) return

            setIsLoadingModels(true)
            try {
                const endpoint = savedEndpoint || DEFAULT_API_ENDPOINT
                const models = await fetchAvailableModels(keyToUse, endpoint)
                if (models.length > 0) {
                    // Sort models with priority brands first, then by version desc
                    const sortedModels = sortModelsWithPriority(models)
                    setAvailableModels(sortedModels)
                    // Auto-expand priority vendors
                    setExpandedVendors(new Set(['openai', 'google', 'anthropic', 'meta', 'microsoft', 'mistralai']))
                }
            } catch (error) {
                console.error('Error fetching models:', error)
            } finally {
                setIsLoadingModels(false)
            }
        }
        autoFetchModels()
    }, [])

    // Filter models based on search term
    const filteredModels = useMemo(() => {
        if (!modelSearchTerm.trim()) return availableModels
        const term = modelSearchTerm.toLowerCase()
        return availableModels.filter(model =>
            model.toLowerCase().includes(term)
        )
    }, [availableModels, modelSearchTerm])

    // Group filtered models by vendor
    const groupedModels = useMemo(() => {
        return groupModelsByVendor(filteredModels)
    }, [filteredModels])

    // Toggle vendor group expansion
    const toggleVendorExpand = (vendor: string) => {
        setExpandedVendors(prev => {
            const newSet = new Set(prev)
            if (newSet.has(vendor)) {
                newSet.delete(vendor)
            } else {
                newSet.add(vendor)
            }
            return newSet
        })
    }

    // Fetch models from endpoint
    const handleFetchModels = async () => {
        if (!apiKey) {
            setModelError(t.modelSettings?.setApiKeyFirst || 'Please set API Key first')
            return
        }

        setIsLoadingModels(true)
        setModelError(null)

        try {
            const models = await fetchAvailableModels(apiKey, customEndpoint)
            if (models.length > 0) {
                const sortedModels = sortModelsWithPriority(models)
                setAvailableModels(sortedModels)
                // Auto-expand priority vendors
                setExpandedVendors(new Set(['openai', 'google', 'anthropic', 'meta', 'microsoft', 'mistralai']))
            } else {
                setModelError(t.modelSettings?.fetchModelError || 'Failed to fetch models or no models found')
            }
        } catch (error) {
            console.error('Error fetching models:', error)
            setModelError(t.modelSettings?.fetchModelError || 'Failed to fetch models')
        } finally {
            setIsLoadingModels(false)
        }
    }

    // Handle endpoint change (save to select-page-specific localStorage)
    const handleEndpointChange = (newEndpoint: string) => {
        setCustomEndpoint(newEndpoint)
        localStorage.setItem(SELECT_PAGE_ENDPOINT_KEY, newEndpoint)
    }

    // Handle API key change (save to select-page-specific localStorage)
    const handleApiKeyChange = (newKey: string) => {
        setApiKey(newKey)
        localStorage.setItem(SELECT_PAGE_API_KEY_KEY, newKey)
    }

    // Add a model to the current configuration
    const addModelToConfig = (model: string) => {
        const currentModels = getCustomModels()
        if (!currentModels.includes(model)) {
            const newModels = [...currentModels, model]
            saveCustomModels(newModels)
            // Reinitialize agents
            initializeCustomModels()
            const updatedAgents = getAgents()
            setAgents(updatedAgents)
            // Select the new agent by default
            const newAgentId = model.split('/').pop()?.split('-')[0]?.toLowerCase() || model
            setSelectedAgents(prev => {
                const newSet = new Set(prev)
                updatedAgents.forEach(a => {
                    if (a.model === model) {
                        newSet.add(a.id)
                    }
                })
                return newSet
            })
        }
    }

    // Remove a model from the current configuration
    const removeModelFromConfig = (model: string) => {
        const currentModels = getCustomModels()
        if (currentModels.length > 1) {
            const newModels = currentModels.filter(m => m !== model)
            saveCustomModels(newModels)
            // Reinitialize agents
            initializeCustomModels()
            const updatedAgents = getAgents()
            setAgents(updatedAgents)
            // Update selected agents to remove the deleted one
            setSelectedAgents(prev => {
                const newSet = new Set(prev)
                const removedAgent = agents.find(a => a.model === model)
                if (removedAgent) {
                    newSet.delete(removedAgent.id)
                }
                return newSet
            })
        }
    }

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

                    {/* API Configuration */}
                    <div className="bg-card border border-border rounded-2xl p-6 mb-8">
                        <h3 className="text-lg font-semibold text-foreground mb-4">
                            API Configuration
                        </h3>

                        {/* API Key Input */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-muted-foreground mb-2">
                                API Key
                            </label>
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <input
                                        type={showApiKey ? 'text' : 'password'}
                                        value={apiKey}
                                        onChange={(e) => handleApiKeyChange(e.target.value)}
                                        placeholder="Enter your API key..."
                                        className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground font-mono text-sm focus:ring-2 focus:ring-ring focus:border-transparent pr-20"
                                    />
                                    {apiKey && (
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => setShowApiKey(!showApiKey)}
                                                className="p-1 text-muted-foreground hover:text-foreground"
                                                title={showApiKey ? 'Hide' : 'Show'}
                                            >
                                                {showApiKey ? (
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {apiKey && !showApiKey && (
                                <p className="mt-1 text-xs text-muted-foreground font-mono">
                                    {maskApiKey(apiKey)}
                                </p>
                            )}
                        </div>

                        {/* Endpoint Input */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-muted-foreground mb-2">
                                Endpoint URL
                            </label>
                            <input
                                type="text"
                                value={customEndpoint}
                                onChange={(e) => handleEndpointChange(e.target.value)}
                                placeholder="https://open.ai.je/api/nvidia/chat/completions"
                                className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground font-mono text-sm focus:ring-2 focus:ring-ring focus:border-transparent"
                            />
                        </div>

                        {/* Fetch Button */}
                        <button
                            onClick={handleFetchModels}
                            disabled={isLoadingModels || !apiKey}
                            className={`w-full px-4 py-3 rounded-lg border transition-colors flex items-center justify-center gap-2
                                ${isLoadingModels || !apiKey
                                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                    : 'border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black'
                                }`}
                        >
                            <svg className={`w-4 h-4 ${isLoadingModels ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {isLoadingModels ? 'Loading Models...' : 'Load Available Models'}
                        </button>
                    </div>

                    {/* Loading indicator for auto-fetching models */}
                    {isLoadingModels && (
                        <div className="mb-8 flex flex-col items-center gap-4">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                {t.modelSettings?.loading || 'Loading models...'}
                            </div>
                        </div>
                    )}
                    {modelError && (
                        <div className="mb-8 flex justify-center">
                            <p className="text-sm text-red-500">{modelError}</p>
                        </div>
                    )}

                    {/* Inline Model Picker Section - Grouped by Vendor */}
                    {groupedModels.length > 0 && (
                        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-foreground">
                                    {t.modelSettings?.select || 'Add Models'} ({filteredModels.length})
                                </h3>
                            </div>

                            {/* Search */}
                            <div className="mb-4">
                                <input
                                    type="text"
                                    value={modelSearchTerm}
                                    onChange={(e) => setModelSearchTerm(e.target.value)}
                                    placeholder={t.modelSettings?.searchModels || 'Search models...'}
                                    className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                                />
                            </div>

                            {/* Model List - Grouped by Vendor */}
                            <div className="max-h-96 overflow-y-auto space-y-2">
                                {groupedModels.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-4">
                                        {t.modelSettings?.noModelsFound || 'No matching models found'}
                                    </p>
                                ) : (
                                    groupedModels.map((group) => {
                                        const isExpanded = expandedVendors.has(group.vendor)
                                        const addedCount = group.models.filter(m => getCustomModels().includes(m)).length

                                        return (
                                            <div key={group.vendor} className="border border-border rounded-lg overflow-hidden">
                                                {/* Vendor Header */}
                                                <button
                                                    onClick={() => toggleVendorExpand(group.vendor)}
                                                    className="w-full px-4 py-3 flex items-center justify-between bg-muted/50 hover:bg-muted transition-colors"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <svg
                                                            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                        <span className="font-semibold text-foreground capitalize">
                                                            {group.vendor}
                                                        </span>
                                                        <span className="text-sm text-muted-foreground">
                                                            ({group.models.length} models{addedCount > 0 ? `, ${addedCount} added` : ''})
                                                        </span>
                                                    </div>
                                                </button>

                                                {/* Vendor Models */}
                                                {isExpanded && (
                                                    <div className="divide-y divide-border">
                                                        {group.models.map((model) => {
                                                            const isAdded = getCustomModels().includes(model)
                                                            const modelName = model.includes('/') ? model.split('/').slice(1).join('/') : model

                                                            return (
                                                                <button
                                                                    key={model}
                                                                    onClick={() => {
                                                                        if (!isAdded) {
                                                                            addModelToConfig(model)
                                                                        }
                                                                    }}
                                                                    disabled={isAdded}
                                                                    className={`
                                                                        w-full text-left px-4 py-2 transition-all
                                                                        flex items-center justify-between
                                                                        ${isAdded
                                                                            ? 'bg-gray-100 dark:bg-gray-800 cursor-default'
                                                                            : 'hover:bg-muted'
                                                                        }
                                                                    `}
                                                                >
                                                                    <span className={`font-mono text-sm ${isAdded ? 'text-black dark:text-white font-medium' : 'text-foreground'}`}>
                                                                        {modelName}
                                                                    </span>
                                                                    {isAdded ? (
                                                                        <svg className="w-4 h-4 text-black dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                        </svg>
                                                                    ) : (
                                                                        <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                                        </svg>
                                                                    )}
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    )}

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
                                <div
                                    key={agent.id}
                                    className={`
                                        relative p-6 rounded-2xl border-2 transition-all duration-300
                                        group
                                        ${isSelected
                                            ? `${colors.border} ${colors.bg} shadow-lg`
                                            : 'border-border bg-card hover:border-muted-foreground/50'
                                        }
                                    `}
                                >
                                    {/* Selection Toggle Button */}
                                    <button
                                        onClick={() => toggleAgent(agent.id)}
                                        className={`
                                            absolute top-4 right-4 w-6 h-6 rounded-full border-2 
                                            flex items-center justify-center transition-all duration-300
                                            ${isSelected
                                                ? `${colors.border} bg-black dark:bg-white`
                                                : 'border-muted-foreground/30 hover:border-muted-foreground'
                                            }
                                        `}
                                    >
                                        {isSelected && (
                                            <svg className="w-4 h-4 text-white dark:text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </button>

                                    {/* Delete Button */}
                                    {agents.length > 1 && (
                                        <button
                                            onClick={() => removeModelFromConfig(agent.model)}
                                            className="absolute top-4 right-12 w-6 h-6 rounded-full border-2 border-red-300 dark:border-red-700
                                                flex items-center justify-center transition-all duration-300
                                                opacity-0 group-hover:opacity-100
                                                hover:bg-red-500 hover:border-red-500 hover:text-white
                                                text-red-400"
                                            title={t.modelSettings?.delete || 'Delete'}
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}

                                    {/* Agent Info */}
                                    <div className="pr-14">
                                        <h3 className={`text-xl font-bold mb-2 ${isSelected ? colors.text : 'text-foreground'}`}>
                                            {agent.name}
                                        </h3>
                                        <p className="text-sm font-mono text-muted-foreground mb-3 truncate" title={agent.model}>
                                            {agent.model}
                                        </p>
                                        <span className={`
                                            inline-block px-3 py-1 rounded-full text-sm font-medium
                                            ${isSelected
                                                ? 'bg-black dark:bg-white text-white dark:text-black'
                                                : 'bg-muted text-muted-foreground'
                                            }
                                        `}>
                                            {agent.mention}
                                        </span>
                                    </div>

                                    {/* Hover Effect */}
                                    <div className={`
                                        absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-5 
                                        transition-opacity duration-300 pointer-events-none
                                        bg-black dark:bg-white
                                    `} style={{ opacity: isSelected ? 0 : undefined }} />
                                </div>
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
                                ? 'bg-black dark:bg-white text-white dark:text-black hover:scale-[1.02] hover:shadow-lg'
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
