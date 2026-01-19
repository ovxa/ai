import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Group - AI Team Chat',
  description: 'Use @ to mention specific AI, or send message directly',
  other: {
    // Content Security Policy to prevent XSS attacks
    // Note: connect-src allows https: to support custom API endpoints
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-inline and unsafe-eval
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https:", // Allow all HTTPS connections for custom API endpoints
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta httpEquiv="Content-Security-Policy" content={[
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https:",
          "font-src 'self' data:",
          "connect-src 'self' https:", // Allow all HTTPS connections for custom API endpoints
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'"
        ].join('; ')} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                // Theme initialization: supports light/dark/system modes
                const savedTheme = localStorage.getItem('theme');
                const root = document.documentElement;

                // Default to 'system' for new users
                let targetTheme = savedTheme;
                if (savedTheme !== 'dark' && savedTheme !== 'light' && savedTheme !== 'system') {
                  targetTheme = 'system';
                  localStorage.setItem('theme', 'system');
                }
                
                // Resolve actual theme to apply
                let resolvedTheme = targetTheme;
                if (targetTheme === 'system') {
                  resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                
                // Explicitly set or remove dark class based on resolved theme
                if (resolvedTheme === 'dark') {
                  root.classList.add('dark');
                } else {
                  root.classList.remove('dark');
                }

                // Language initialization: set html lang attribute based on saved preference
                const savedLang = localStorage.getItem('language');
                const supportedLangs = ['de', 'en', 'es', 'fr', 'it', 'ja', 'ko', 'pt', 'zh', 'ru'];
                if (savedLang && supportedLangs.includes(savedLang)) {
                  root.lang = savedLang === 'zh' ? 'zh-CN' : savedLang;
                } else {
                  // Detect browser language
                  const browserLang = navigator.language.toLowerCase();
                  const langMap = { de: 'de', es: 'es', fr: 'fr', it: 'it', ja: 'ja', ko: 'ko', pt: 'pt', zh: 'zh-CN', ru: 'ru' };
                  for (const [prefix, lang] of Object.entries(langMap)) {
                    if (browserLang.startsWith(prefix)) {
                      root.lang = lang;
                      break;
                    }
                  }
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
