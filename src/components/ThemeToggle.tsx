'use client'

import { useState, useEffect } from 'react'

type Theme = 'light' | 'dark' | 'system'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system')
  const [mounted, setMounted] = useState(false)

  // Only execute after client-side mount
  useEffect(() => {
    setMounted(true)
    // Get saved theme from localStorage
    const savedTheme = localStorage.getItem('theme') as Theme | null
    if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
      setTheme(savedTheme)
    } else {
      // Default to system for new users
      setTheme('system')
      localStorage.setItem('theme', 'system')
    }
  }, [])

  // Listen for system theme changes when theme is set to 'system'
  useEffect(() => {
    if (!mounted) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const applyTheme = (isDark: boolean) => {
      const root = document.documentElement
      if (isDark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }

    const handleSystemChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        applyTheme(e.matches)
      }
    }

    // Apply initial theme
    if (theme === 'system') {
      applyTheme(mediaQuery.matches)
    } else {
      applyTheme(theme === 'dark')
    }

    mediaQuery.addEventListener('change', handleSystemChange)
    return () => mediaQuery.removeEventListener('change', handleSystemChange)
  }, [theme, mounted])

  // Cycle through themes: light -> dark -> system -> light
  const cycleTheme = () => {
    let nextTheme: Theme
    if (theme === 'light') {
      nextTheme = 'dark'
    } else if (theme === 'dark') {
      nextTheme = 'system'
    } else {
      nextTheme = 'light'
    }
    setTheme(nextTheme)
    localStorage.setItem('theme', nextTheme)
  }

  // Get the actual displayed theme (for system mode, resolve to light/dark)
  const getDisplayedTheme = (): 'light' | 'dark' => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return theme
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <button
        className="flex items-center gap-2 px-3 py-1.5 text-sm
                   bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
                   rounded-lg transition-colors"
        disabled
      >
        <div className="w-4 h-4" />
      </button>
    )
  }

  const displayedTheme = getDisplayedTheme()

  return (
    <button
      onClick={cycleTheme}
      className="flex items-center gap-2 px-3 py-1.5 text-sm
                 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700
                 rounded-lg transition-colors"
      title={`Theme: ${theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'System'}`}
    >
      {/* Sun icon for light mode */}
      {theme === 'light' && (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
        </svg>
      )}
      {/* Moon icon for dark mode */}
      {theme === 'dark' && (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      )}
      {/* Monitor icon for system mode */}
      {theme === 'system' && (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  )
}
