import { OpenAIService } from './openai.service'

export interface ImageGenerationRequest {
  prompt: string
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792'
  quality?: 'standard' | 'hd'
  style?: 'vivid' | 'natural'
}

export interface ImageGenerationResponse {
  success: boolean
  image?: {
    url: string
    revised_prompt?: string
    prompt: string
    size: string
    quality: string
    style: string
  }
  message: string
  error?: string
}

export class ImageGenerationService {
  /**
   * Check if a message is requesting image generation
   */
  static isImageGenerationRequest(message: string): boolean {
    const lowerMessage = message.toLowerCase().trim()
    
    // Common image generation keywords and phrases
    const imageKeywords = [
      'create an image',
      'generate an image',
      'draw an image',
      'make an image',
      'create a picture',
      'generate a picture',
      'draw a picture',
      'make a picture',
      'create a photo',
      'generate a photo',
      'create a visual',
      'generate a visual',
      'create artwork',
      'generate artwork',
      'create art',
      'generate art',
      'draw something',
      'paint something',
      'illustrate',
      'sketch',
      'design',
      'visualize',
      'show me an image',
      'show me a picture',
      'show me a visual',
      'i want to see',
      'can you create',
      'can you generate',
      'can you draw',
      'can you make',
      'image of',
      'picture of',
      'photo of',
      'visual of',
      'artwork of',
      'art of'
    ]

    // Check for image generation patterns
    const hasImageKeyword = imageKeywords.some(keyword => lowerMessage.includes(keyword))
    
    // Check for specific patterns like "create image of X" or "generate picture of Y"
    const hasImagePattern = /(create|generate|draw|make|show)\s+(an?\s+)?(image|picture|photo|visual|artwork|art|drawing|painting|sketch|illustration)/i.test(message)
    
    // Check for "image of" or "picture of" patterns
    const hasOfPattern = /(image|picture|photo|visual|artwork|art|drawing|painting|sketch|illustration)\s+of\s+/i.test(message)
    
    return hasImageKeyword || hasImagePattern || hasOfPattern
  }

  /**
   * Extract the image generation prompt from a message
   */
  static extractImagePrompt(message: string): string {
    let prompt = message.trim()
    
    // Remove common prefixes
    const prefixes = [
      /^(create|generate|draw|make|show)\s+(an?\s+)?(image|picture|photo|visual|artwork|art|drawing|painting|sketch|illustration)\s+(of\s+)?/i,
      /^(i\s+want\s+to\s+see\s+an?\s+)?(image|picture|photo|visual|artwork|art|drawing|painting|sketch|illustration)\s+(of\s+)?/i,
      /^(can\s+you\s+)?(create|generate|draw|make)\s+(an?\s+)?(image|picture|photo|visual|artwork|art|drawing|painting|sketch|illustration)\s+(of\s+)?/i,
      /^(please\s+)?(create|generate|draw|make|show)\s+(an?\s+)?(image|picture|photo|visual|artwork|art|drawing|painting|sketch|illustration)\s+(of\s+)?/i
    ]
    
    for (const prefix of prefixes) {
      prompt = prompt.replace(prefix, '').trim()
    }
    
    // If the prompt is empty or too short, use the original message
    if (!prompt || prompt.length < 3) {
      prompt = message.trim()
    }
    
    // Clean up the prompt
    prompt = prompt.replace(/^(of\s+)/i, '').trim()
    
    // Clean up common typos and unclear text
    prompt = this.cleanPrompt(prompt)
    
    // If the prompt is still very short or unclear, enhance it for image generation
    if (prompt.length < 5 || this.isUnclearPrompt(prompt)) {
      prompt = `A beautiful, creative image of ${prompt}`
    }
    
    return prompt
  }

  /**
   * Clean up common typos and unclear text in prompts
   */
  private static cleanPrompt(prompt: string): string {
    // Fix common typos
    const typos = {
      'iimage': 'image',
      'imge': 'image',
      'img': 'image',
      'pic': 'picture',
      'pics': 'pictures',
      'draw': 'drawing',
      'paint': 'painting'
    }
    
    let cleaned = prompt.toLowerCase()
    
    // Replace typos
    for (const [typo, correction] of Object.entries(typos)) {
      cleaned = cleaned.replace(new RegExp(typo, 'g'), correction)
    }
    
    // Remove repeated words
    cleaned = cleaned.replace(/\b(\w+)\s+\1\b/g, '$1')
    
    // Remove meaningless words that might trigger content policy
    const meaninglessWords = ['generate', 'create', 'make', 'draw', 'show', 'display', 'render']
    for (const word of meaninglessWords) {
      cleaned = cleaned.replace(new RegExp(`\\b${word}\\b`, 'g'), '')
    }
    
    // Clean up extra spaces
    cleaned = cleaned.replace(/\s+/g, ' ').trim()
    
    // If the cleaned prompt is empty or too short, use a default
    if (!cleaned || cleaned.length < 3) {
      return 'abstract art'
    }
    
    return cleaned
  }

  /**
   * Check if a prompt is unclear for image generation
   */
  private static isUnclearPrompt(prompt: string): boolean {
    const unclearPatterns = [
      /^(hi|hello|hey|thanks?|thank you|ok|okay|yes|no|sure|maybe)$/i,
      /^(what|how|when|where|why|who|which)$/i,
      /^(help|assist|support)$/i,
      /^(test|testing|check)$/i
    ]
    
    return unclearPatterns.some(pattern => pattern.test(prompt.trim()))
  }

  /**
   * Generate an image based on the request
   */
  static async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    try {
      if (!request.prompt || request.prompt.trim().length === 0) {
        return {
          success: false,
          message: 'Image prompt is required',
          error: 'Empty prompt'
        }
      }

      console.log(`[ImageGenerationService] Generating image with prompt: "${request.prompt}"`)

      const images = await OpenAIService.generateImage(request.prompt, {
        size: request.size || '1024x1024',
        quality: request.quality || 'standard',
        style: request.style || 'vivid',
        n: 1
      })

      if (!images || images.length === 0) {
        return {
          success: false,
          message: 'Failed to generate image',
          error: 'No images returned from OpenAI'
        }
      }

      const image = images[0]

      return {
        success: true,
        image: {
          url: image.url,
          revised_prompt: image.revised_prompt,
          prompt: request.prompt,
          size: request.size || '1024x1024',
          quality: request.quality || 'standard',
          style: request.style || 'vivid'
        },
        message: 'Image generated successfully'
      }

    } catch (error: any) {
      console.error('[ImageGenerationService] Error generating image:', error)
      
      let errorMessage = 'Failed to generate image'
      let errorCode = 'unknown_error'
      
      if (error.message) {
        if (error.message.includes('content_policy_violation') || error.code === 'content_policy_violation') {
          errorMessage = 'Your prompt was rejected by our safety system. Please try a different, more descriptive prompt like "a beautiful sunset" or "a cute cat".'
          errorCode = 'content_policy_violation'
        } else if (error.message.includes('billing_hard_limit_reached')) {
          errorMessage = 'Billing limit reached. Please check your OpenAI account.'
          errorCode = 'billing_limit'
        } else if (error.message.includes('rate_limit_exceeded')) {
          errorMessage = 'Rate limit exceeded. Please try again later.'
          errorCode = 'rate_limit'
        } else {
          errorMessage = `Failed to generate image: ${error.message}`
        }
      }

      return {
        success: false,
        message: errorMessage,
        error: errorCode
      }
    }
  }

  /**
   * Process a chat message and determine if it should generate an image
   */
  static async processMessage(message: string, forceImageMode: boolean = false): Promise<{
    isImageRequest: boolean
    prompt?: string
    response?: ImageGenerationResponse
  }> {
    console.log('[ImageGenerationService] Processing message:', { message, forceImageMode })
    
    const isImageRequest = forceImageMode || this.isImageGenerationRequest(message)
    console.log('[ImageGenerationService] Is image request:', isImageRequest)
    
    if (!isImageRequest) {
      return { isImageRequest: false }
    }

    const prompt = this.extractImagePrompt(message)
    console.log('[ImageGenerationService] Extracted prompt:', prompt)
    
    let response = await this.generateImage({ prompt })
    console.log('[ImageGenerationService] First attempt result:', response)

    // If the first attempt fails due to content policy, try with a safer prompt
    if (!response.success && response.error === 'content_policy_violation') {
      console.log('[ImageGenerationService] First attempt failed, trying with safer prompt')
      const saferPrompt = this.createSaferPrompt(prompt)
      console.log('[ImageGenerationService] Safer prompt:', saferPrompt)
      response = await this.generateImage({ prompt: saferPrompt })
      console.log('[ImageGenerationService] Second attempt result:', response)
    }

    return {
      isImageRequest: true,
      prompt,
      response
    }
  }

  /**
   * Create a safer prompt that's less likely to trigger content policy violations
   */
  private static createSaferPrompt(originalPrompt: string): string {
    // If the original prompt is very short or unclear, use a default safe prompt
    if (originalPrompt.length < 5 || this.isUnclearPrompt(originalPrompt)) {
      return 'abstract art with vibrant colors'
    }

    // Create a safer version by adding positive descriptors
    const safeDescriptors = [
      'beautiful', 'colorful', 'artistic', 'creative', 'vibrant', 'peaceful', 'serene'
    ]
    
    const randomDescriptor = safeDescriptors[Math.floor(Math.random() * safeDescriptors.length)]
    return `a ${randomDescriptor} ${originalPrompt}`
  }
}
