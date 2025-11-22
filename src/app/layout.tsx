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
    <html lang="zh-CN" suppressHydrationWarning>
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
                // GitHub Pages SPA redirect handler
                // Check if we were redirected from 404.html with a redirect parameter
                (function() {
                  var redirect = new URLSearchParams(window.location.search).get('redirect');
                  if (redirect) {
                    // Remove the redirect parameter from URL
                    var basePath = '/ai';
                    var newUrl = basePath + redirect + window.location.search.replace(/[?&]redirect=[^&]*/, '').replace(/^&/, '?') + window.location.hash;
                    window.history.replaceState(null, '', newUrl);
                  }
                })();

                // Theme initialization: supports light/dark modes
                const savedTheme = localStorage.getItem('theme');
                const root = document.documentElement;

                // If saved theme exists, use it; otherwise use system theme as initial value
                if (savedTheme === 'dark' || savedTheme === 'light') {
                  if (savedTheme === 'dark') {
                    root.classList.add('dark');
                  }
                } else {
                  // First visit: set initial theme based on system theme
                  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  if (systemTheme === 'dark') {
                    root.classList.add('dark');
                  }
                  localStorage.setItem('theme', systemTheme);
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
