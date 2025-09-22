import { NextRequest, NextResponse } from 'next/server'
import { deepSeekAPI } from '@/lib/deepseek-api'
import { config } from '@/lib/config'
import { ServerMessageService } from '@/lib/server-database'
import type { DeepSeekMessage } from '@/lib/deepseek-api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, botConfig, conversationId } = body

    // Validate request
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    // Validate messages format
    const validMessages: DeepSeekMessage[] = messages.map((msg: any) => {
      if (!msg.role || !msg.content) {
        throw new Error('Invalid message format')
      }
      if (!['system', 'user', 'assistant'].includes(msg.role)) {
        throw new Error('Invalid message role')
      }
      return {
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content
      }
    })

    // Use bot configuration or defaults
    const model = botConfig?.model || config.deepseek.defaultModel
    const temperature = botConfig?.temperature || config.deepseek.defaultTemperature
    const maxTokens = botConfig?.max_tokens || config.deepseek.defaultMaxTokens

    const startTime = Date.now()

    // Generate response from DeepSeek
    const response = await deepSeekAPI.generateResponse(validMessages, {
      model,
      temperature,
      max_tokens: maxTokens
    })

    const responseTime = Date.now() - startTime

    // Extract the assistant's message
    const assistantMessage = response.choices[0]?.message?.content || 'Sorry, I could not generate a response.'

    // Save the assistant's message to database if conversationId is provided
    if (conversationId) {
      try {
        await ServerMessageService.create(
          conversationId,
          'assistant',
          assistantMessage,
          response.usage?.total_tokens,
          responseTime
        )
      } catch (dbError) {
        console.error('Failed to save message to database:', dbError)
        // Don't fail the request if database save fails
      }
    }

    return NextResponse.json({
      message: assistantMessage,
      usage: response.usage,
      model: response.model,
      finish_reason: response.choices[0]?.finish_reason,
      response_time_ms: responseTime
    })

  } catch (error) {
    console.error('Chat API error:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Sorry, I encountered an error while processing your request.'
      },
      { status: 500 }
    )
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
