import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Trio Chat - 三 AI 协作助手',
  description: '与三个专业 AI 助手协作：分析者、创意者、评估者',
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
                // 主题初始化：支持 light/dark 两种模式
                const savedTheme = localStorage.getItem('theme');
                const root = document.documentElement;

                // 如果有保存的主题，使用保存的主题；否则根据系统主题设置初始值
                if (savedTheme === 'dark' || savedTheme === 'light') {
                  if (savedTheme === 'dark') {
                    root.classList.add('dark');
                  }
                } else {
                  // 首次访问：根据系统主题设置初始主题
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
