import { db } from '@/lib/db'

export class UserApiKeyService {
  /**
   * Get user's OpenAI API key by user ID
   */
  static async getUserApiKey(userId: string): Promise<string | null> {
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { openai_api_key: true }
      })
      
      return user?.openai_api_key || null
    } catch (error) {
      console.error('Error fetching user API key:', error)
      return null
    }
  }

  /**
   * Get user's OpenAI API key by bot ID
   */
  static async getApiKeyByBotId(botId: number): Promise<string | null> {
    try {
      const bot = await db.bot.findUnique({
        where: { id: botId },
        select: { 
          user_id: true,
          user: {
            select: { openai_api_key: true }
          }
        }
      })
      
      return bot?.user?.openai_api_key || null
    } catch (error) {
      console.error('Error fetching API key by bot ID:', error)
      return null
    }
  }

  /**
   * Check if user has a valid API key
   */
  static async hasValidApiKey(userId: string): Promise<boolean> {
    const apiKey = await this.getUserApiKey(userId)
    return apiKey !== null && apiKey.trim().length > 0
  }

  /**
   * Get API key for user - returns null if not found
   */
  static async getApiKeyWithFallback(userId: string): Promise<string | null> {
    const userApiKey = await this.getUserApiKey(userId)
    return userApiKey
  }

  /**
   * Get API key by bot ID - returns null if not found
   */
  static async getApiKeyByBotWithFallback(botId: number): Promise<string | null> {
    const userApiKey = await this.getApiKeyByBotId(botId)
    return userApiKey
  }
}
