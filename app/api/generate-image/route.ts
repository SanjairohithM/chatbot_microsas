import { NextRequest, NextResponse } from 'next/server'
import { OpenAIService } from '@/lib/services/openai.service'
import { ApiResponse } from '@/lib/utils/api-response'
import { validateRequest } from '@/lib/middleware/validation'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, size = '1024x1024', quality = 'standard', style = 'vivid' } = body

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return ApiResponse.badRequest('Prompt is required and must be a non-empty string')
    }

    logger.apiRequest('POST', '/api/generate-image', 'anonymous')

    console.log(`[Image Generation] Generating image with prompt: "${prompt}"`)

    // Generate image using OpenAI DALL-E
    const images = await OpenAIService.generateImage(prompt.trim(), {
      size: size as any,
      quality: quality as any,
      style: style as any,
      n: 1
    })

    if (!images || images.length === 0) {
      return ApiResponse.internalServerError('Failed to generate image')
    }

    const image = images[0]

    console.log(`[Image Generation] Successfully generated image: ${image.url}`)

    return NextResponse.json({
      success: true,
      image: {
        url: image.url,
        revised_prompt: image.revised_prompt,
        prompt: prompt,
        size: size,
        quality: quality,
        style: style
      },
      message: 'Image generated successfully'
    })

  } catch (error) {
    console.error('[Image Generation] Error:', error)
    
    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('content_policy_violation')) {
        return ApiResponse.badRequest('The prompt violates OpenAI\'s content policy. Please try a different prompt.')
      }
      if (error.message.includes('billing_hard_limit_reached')) {
        return ApiResponse.paymentRequired('OpenAI billing limit reached. Please check your account.')
      }
      if (error.message.includes('rate_limit_exceeded')) {
        return ApiResponse.tooManyRequests('Rate limit exceeded. Please try again later.')
      }
    }

    return ApiResponse.internalServerError('Failed to generate image. Please try again.')
  }
}
