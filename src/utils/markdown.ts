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
 * 估算文本的 token 数量（改进版，更准确处理中英文混合）
 * @param text 文本内容
 * @returns token 数量估算值
 *
 * 估算规则：
 * - 中文字符（CJK）：约 1.2-1.5 字符/token，取 1.3
 * - 英文单词：约 1.3 字符/token（包括空格）
 * - 数字和标点：约 3-4 字符/token
 *
 * 注意：这是粗略估算，实际 token 数可能有 ±20% 的偏差
 */
export function estimateTokens(text: string): number {
  if (!text) return 0

  // 统计中文字符（包括中日韩统一表意文字）
  const cjkChars = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length

  // 统计英文单词（包括数字）
  const words = (text.match(/[a-zA-Z0-9]+/g) || []).length

  // 统计空格
  const spaces = (text.match(/\s/g) || []).length

  // 其他字符（标点符号等）
  const alphanumericAndSpaces = (text.match(/[a-zA-Z0-9\s]/g) || []).length
  const otherChars = text.length - cjkChars - alphanumericAndSpaces

  // 估算 tokens：
  // - CJK: 1.3 字符/token
  // - 英文单词: 平均 1.3 字符/token
  // - 标点和其他: 3 字符/token
  const cjkTokens = cjkChars / 1.3
  const wordTokens = words * 1.3 // 平均每个单词约 1.3 tokens
  const punctTokens = otherChars / 3

  return Math.ceil(cjkTokens + wordTokens + punctTokens)
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
