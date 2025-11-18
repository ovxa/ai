/**
 * 检测文本是否包含 Markdown 语法
 * @param text 要检测的文本
 * @returns 是否包含 Markdown
 */
export function hasMarkdownSyntax(text: string): boolean {
  // 检测常见的 Markdown 语法特征
  const markdownPatterns = [
    /^#{1,6}\s/m, // 标题 # ## ###
    /\*\*[^*]+\*\*/g, // 粗体 **text**
    /\*[^*]+\*/g, // 斜体 *text*
    /```[\s\S]*?```/g, // 代码块 ```code```
    /`[^`]+`/g, // 行内代码 `code`
    /^\s*[-*+]\s/m, // 无序列表 - * +
    /^\s*\d+\.\s/m, // 有序列表 1. 2.
    /\[([^\]]+)\]\(([^)]+)\)/g, // 链接 [text](url)
    /!\[([^\]]*)\]\(([^)]+)\)/g, // 图片 ![alt](url)
    /^\s*>\s/m, // 引用 >
    /^\s*---\s*$/m, // 分隔线 ---
    /\|[^\n]+\|/g, // 表格 | col |
  ]

  return markdownPatterns.some(pattern => pattern.test(text))
}

/**
 * 估算文本的 token 数量（粗略估计）
 * @param text 文本内容
 * @returns token 数量
 */
export function estimateTokens(text: string): number {
  // 粗略估计：1 token ≈ 4 个字符（英文）或 1.5 个中文字符
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const otherChars = text.length - chineseChars

  return Math.ceil(chineseChars / 1.5 + otherChars / 4)
}

/**
 * 生成消息摘要
 * @param content 消息内容
 * @param maxLength 最大长度
 * @returns 摘要
 */
export function generateSummary(content: string, maxLength: number = 50): string {
  // 移除 Markdown 语法
  let summary = content
    .replace(/```[\s\S]*?```/g, '[代码]') // 代码块
    .replace(/`[^`]+`/g, '[代码]') // 行内代码
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 链接
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '[图片]') // 图片
    .replace(/^#{1,6}\s+/gm, '') // 标题
    .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1') // 粗体/斜体
    .replace(/^\s*[-*+>]\s+/gm, '') // 列表/引用
    .replace(/\n+/g, ' ') // 换行
    .trim()

  if (summary.length > maxLength) {
    summary = summary.substring(0, maxLength) + '...'
  }

  return summary
}
