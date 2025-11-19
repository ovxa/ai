/**
 * Detect if text contains Markdown syntax
 * @param text Text to detect
 * @returns Whether contains Markdown
 */
export function hasMarkdownSyntax(text: string): boolean {
  // Detect common Markdown syntax features
  const markdownPatterns = [
    /^#{1,6}\s/m, // Headings # ## ###
    /\*\*[^*]+\*\*/g, // Bold **text**
    /\*[^*]+\*/g, // Italic *text*
    /```[\s\S]*?```/g, // Code blocks ```code```
    /`[^`]+`/g, // Inline code `code`
    /^\s*[-*+]\s/m, // Unordered lists - * +
    /^\s*\d+\.\s/m, // Ordered lists 1. 2.
    /\[([^\]]+)\]\(([^)]+)\)/g, // Links [text](url)
    /!\[([^\]]*)\]\(([^)]+)\)/g, // Images ![alt](url)
    /^\s*>\s/m, // Blockquotes >
    /^\s*---\s*$/m, // Horizontal rules ---
    /\|[^\n]+\|/g, // Tables | col |
  ]

  return markdownPatterns.some(pattern => pattern.test(text))
}

/**
 * Estimate token count for text (improved version, more accurate for mixed Chinese/English)
 * @param text Text content
 * @returns Estimated token count
 *
 * Estimation rules:
 * - CJK characters: ~1.2-1.5 chars/token, use 1.3
 * - English words: ~1.3 chars/token (including spaces)
 * - Numbers and punctuation: ~3-4 chars/token
 *
 * Note: This is a rough estimate, actual token count may vary by ±20%
 */
export function estimateTokens(text: string): number {
  if (!text) return 0

  // Count CJK characters (including CJK Unified Ideographs)
  const cjkChars = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length

  // Count English words (including numbers)
  const words = (text.match(/[a-zA-Z0-9]+/g) || []).length

  // Count spaces
  const spaces = (text.match(/\s/g) || []).length

  // Other characters (punctuation, etc.)
  const alphanumericAndSpaces = (text.match(/[a-zA-Z0-9\s]/g) || []).length
  const otherChars = text.length - cjkChars - alphanumericAndSpaces

  // Estimate tokens:
  // - CJK: 1.3 chars/token
  // - English words: average 1.3 chars/token
  // - Punctuation and others: 3 chars/token
  const cjkTokens = cjkChars / 1.3
  const wordTokens = words * 1.3 // Average ~1.3 tokens per word
  const punctTokens = otherChars / 3

  return Math.ceil(cjkTokens + wordTokens + punctTokens)
}

/**
 * Generate message summary
 * @param content Message content
 * @param maxLength Maximum length
 * @returns Summary
 */
export function generateSummary(content: string, maxLength: number = 50): string {
  // Remove Markdown syntax
  let summary = content
    .replace(/```[\s\S]*?```/g, '[code]') // Code blocks
    .replace(/`[^`]+`/g, '[code]') // Inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '[image]') // Images
    .replace(/^#{1,6}\s+/gm, '') // Headings
    .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1') // Bold/Italic
    .replace(/^\s*[-*+>]\s+/gm, '') // Lists/Blockquotes
    .replace(/\n+/g, ' ') // Newlines
    .trim()

  if (summary.length > maxLength) {
    summary = summary.substring(0, maxLength) + '...'
  }

  return summary
}
