import { NextRequest, NextResponse } from 'next/server'
import { getAgentById } from '@/lib/agents'
import { Message } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const { agentId, message, history } = await request.json()

    if (!agentId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const agent = getAgentById(agentId)
    if (!agent) {
      return NextResponse.json(
        { error: 'Invalid agent ID' },
        { status: 400 }
      )
    }

    const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured' },
        { status: 500 }
      )
    }

    // 构建消息历史
    const messages = [
      {
        role: 'system',
        content: agent.systemPrompt
      },
      // 只包含最近的消息历史（最多 10 条）
      ...(history || [])
        .slice(-10)
        .map((msg: Message) => ({
          role: msg.role,
          content: msg.content
        })),
      {
        role: 'user',
        content: message
      }
    ]

    // 调用 OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': process.env.NEXT_PUBLIC_APP_NAME || 'AI Trio Chat'
      },
      body: JSON.stringify({
        model: agent.model,
        messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenRouter API error:', error)
      return NextResponse.json(
        { error: 'Failed to get response from AI' },
        { status: response.status }
      )
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return NextResponse.json(
        { error: 'No content in response' },
        { status: 500 }
      )
    }

    return NextResponse.json({ content })
  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
