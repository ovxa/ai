'use client'

import { useState, useEffect, useRef } from 'react'
import { Language, languageNames, getCurrentLanguage, saveLanguage, useTranslation } from '@/lib/i18n'
import ModelSettings from './ModelSettings'
import APIKeySettings from './APIKeySettings'

interface SettingsMenuProps {
  onOpenChange?: (isOpen: boolean) => void
}

type Theme = 'light' | 'dark'

export default function SettingsMenu({ onOpenChange }: SettingsMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en')
  const [theme, setTheme] = useState<Theme>('light')

  const modelSettingsRef = useRef<HTMLDivElement>(null)
  const apiKeySettingsRef = useRef<HTMLDivElement>(null)

  const t = useTranslation()

  useEffect(() => {
    setMounted(true)
    setCurrentLanguage(getCurrentLanguage())

    // Get saved theme from localStorage
    const savedTheme = localStorage.getItem('theme') as Theme | null
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme)
    } else {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      setTheme(systemTheme)
    }
  }, [])

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    onOpenChange?.(open)
    if (!open) {
      setExpandedSection(null)
    }
  }

  const handleLanguageChange = (lang: Language) => {
    setCurrentLanguage(lang)
    saveLanguage(lang)
    window.location.reload()
  }

  const handleThemeToggle = () => {
    const nextTheme: Theme = theme === 'light' ? 'dark' : 'light'
    setTheme(nextTheme)
    localStorage.setItem('theme', nextTheme)

    // Apply to DOM
    const root = document.documentElement
    if (nextTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  if (!mounted) return null

  return (
    <div className="relative">
      {/* Settings icon button */}
      <button
        onClick={() => handleOpenChange(!isOpen)}
        className="p-2 rounded-lg hover:bg-accent transition-colors"
        title={t.settings || 'Settings'}
      >
        <svg
          className="w-6 h-6 text-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-20"
            onClick={() => handleOpenChange(false)}
          />

          {/* Menu panel */}
          <div className="absolute left-0 top-full mt-2 z-30 bg-card rounded-lg shadow-xl border border-border min-w-[320px] max-w-[calc(100vw-2rem)] py-2" style={{ maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border mb-1">
              {t.settings || 'Settings'}
            </div>

            <div className="space-y-1">
              {/* Language Selector */}
              <div>
                <button
                  onClick={() => toggleSection('language')}
                  className="w-full flex items-center justify-between py-3 px-4 hover:bg-accent transition-colors"
                >
                  <span className="text-sm font-medium text-foreground">
                    {t.language}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {languageNames[currentLanguage]}
                    </span>
                    <svg
                      className={`w-4 h-4 text-muted-foreground transition-transform ${
                        expandedSection === 'language' ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {expandedSection === 'language' && (
                  <div className="bg-accent py-2 px-2 space-y-1 max-h-64 overflow-y-auto">
                    {(Object.keys(languageNames) as Language[]).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => handleLanguageChange(lang)}
                        className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                          currentLanguage === lang
                            ? 'bg-primary text-primary-foreground font-medium'
                            : 'hover:bg-secondary text-foreground'
                        }`}
                      >
                        {languageNames[lang]}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Theme Toggle */}
              <button
                onClick={handleThemeToggle}
                className="w-full flex items-center justify-between py-3 px-4 hover:bg-accent transition-colors"
              >
                <span className="text-sm font-medium text-foreground">
                  {t.theme}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground capitalize">
                    {theme}
                  </span>
                  <svg
                    className="w-5 h-5 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {theme === 'dark' ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    )}
                  </svg>
                </div>
              </button>

              {/* Models Settings */}
              <button
                onClick={() => {
                  const button = modelSettingsRef.current?.querySelector('button')
                  button?.click()
                }}
                className="w-full py-3 px-4 hover:bg-accent transition-colors flex items-center justify-between"
              >
                <span className="text-sm font-medium text-foreground">
                  {t.models}
                </span>
                <div ref={modelSettingsRef} onClick={(e) => e.stopPropagation()}>
                  <ModelSettings />
                </div>
              </button>

              {/* API Key Settings */}
              <button
                onClick={() => {
                  const button = apiKeySettingsRef.current?.querySelector('button')
                  button?.click()
                }}
                className="w-full py-3 px-4 hover:bg-accent transition-colors flex items-center justify-between"
              >
                <span className="text-sm font-medium text-foreground">
                  {t.apiKey}
                </span>
                <div ref={apiKeySettingsRef} onClick={(e) => e.stopPropagation()}>
                  <APIKeySettings />
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
