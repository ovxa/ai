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
                // 跟随系统主题设置
                const updateTheme = () => {
                  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                };

                // 初始化主题
                updateTheme();

                // 监听系统主题变化
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateTheme);
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
