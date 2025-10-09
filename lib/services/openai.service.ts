import { OpenAIAPI, OpenAIMessage, OpenAIChatOptions } from '../openai-api'

export interface OpenAIServiceOptions {
  temperature?: number
  max_tokens?: number
}

export class OpenAIService {
  private static client = new OpenAIAPI()

  /**
   * Generate a response using OpenAI API
   */
  static async generateResponse(
    messages: OpenAIMessage[],
    options: OpenAIServiceOptions = {},
    apiKey?: string
  ): Promise<string> {
    try {
      const client = apiKey ? new OpenAIAPI(apiKey) : this.client
      const result = await client.generateChat(messages, {
        temperature: options.temperature,
        max_tokens: options.max_tokens
      })
      
      // Ensure we return a valid string
      if (!result || !result.message || typeof result.message !== 'string') {
        console.warn('OpenAI API returned invalid response:', result)
        return ''
      }
      
      return result.message.trim()
    } catch (error) {
      console.error('OpenAI API error:', error)
      throw new Error('Failed to generate response from OpenAI')
    }
  }

  /**
   * Generate a streaming response using OpenAI API
   */
  static async generateStreamingResponse(
    messages: OpenAIMessage[],
    options: OpenAIServiceOptions = {},
    apiKey?: string
  ): Promise<AsyncIterable<any> & { usage?: any; model?: string; finish_reason?: string }> {
    try {
      const client = apiKey ? new OpenAIAPI(apiKey) : this.client
      return await client.generateChatStream(messages, {
        temperature: options.temperature,
        max_tokens: options.max_tokens
      })
    } catch (error) {
      console.error('OpenAI streaming API error:', error)
      throw new Error('Failed to generate streaming response from OpenAI')
    }
  }

  /**
   * Create embeddings for text
   */
  static async createEmbedding(text: string, model: string = 'text-embedding-3-small', apiKey?: string): Promise<number[]> {
    try {
      const client = apiKey ? new OpenAIAPI(apiKey) : this.client
      return await client.createEmbedding(text, model)
    } catch (error) {
      console.error('OpenAI embedding error:', error)
      throw new Error('Failed to create embedding')
    }
  }

  /**
   * Convert text to speech
   */
  static async synthesizeSpeech(
    text: string,
    options?: { model?: string; voice?: string; format?: 'mp3' | 'wav' | 'opus' },
    apiKey?: string
  ): Promise<Uint8Array> {
    try {
      const client = apiKey ? new OpenAIAPI(apiKey) : this.client
      return await client.synthesizeSpeech(text, options)
    } catch (error) {
      console.error('OpenAI TTS error:', error)
      throw new Error('Failed to synthesize speech')
    }
  }

  /**
   * Convert speech to text
   */
  static async transcribeAudio(
    file: File | Blob,
    options?: { model?: string },
    apiKey?: string
  ): Promise<string> {
    try {
      const client = apiKey ? new OpenAIAPI(apiKey) : this.client
      return await client.transcribeAudio(file, options)
    } catch (error) {
      console.error('OpenAI STT error:', error)
      throw new Error('Failed to transcribe audio')
    }
  }
}
