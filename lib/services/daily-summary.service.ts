import { DailySummary } from '@/lib/types'

export class DailySummaryService {
  /**
   * Generate daily summary using AI analysis (OpenAI GPT)
   */
  static async generateKeywordSummary(messages: string[]): Promise<DailySummary> {
    // Use AI analysis instead of keyword patterns
    return await this.generateAISummary(messages)
  }
  
  /**
   * Extract specific context around matches
   */
  private static extractSpecificContext(text: string, pattern: RegExp): string | null {
    const matches = [...text.matchAll(pattern)]
    
    for (const match of matches) {
      const start = Math.max(0, match.index! - 50)
      const end = Math.min(text.length, match.index! + match[0].length + 50)
      const context = text.substring(start, end).trim()
      
      // Look for specific issue descriptions
      if (context.includes('not working') || context.includes('broken') || context.includes('doesn\'t work')) {
        return 'Users reporting functionality not working properly'
      }
      if (context.includes('add to cart') && context.includes('not working')) {
        return 'Add to cart functionality experiencing issues'
      }
      if (context.includes('error') && context.includes('message')) {
        return 'Error messages appearing to users'
      }
      if (context.includes('can\'t') || context.includes('cannot')) {
        return 'Users unable to complete certain actions'
      }
      if (context.includes('help') && context.includes('with')) {
        return 'Users requesting assistance with specific tasks'
      }
    }
    
    return null
  }
  
  /**
   * Generate daily summary using AI (OpenAI GPT)
   */
  static async generateAISummary(messages: string[]): Promise<DailySummary> {
    try {
      const textBlob = messages.join('\n')
      
      // Truncate if too long (GPT has token limits)
      const maxLength = 8000
      const truncatedText = textBlob.length > maxLength 
        ? textBlob.substring(0, maxLength) + '...'
        : textBlob
      
      const prompt = `You are an intelligent analytics assistant. Analyze the following chatbot conversations and provide a natural, insightful summary.

Conversations:
${truncatedText}

Please analyze these conversations and provide a JSON response with this exact structure:
{
  "issues": ["Natural, descriptive issue summaries", "Another issue insight"],
  "trends": {
    "natural_trend_name": count,
    "another_trend": count
  }
}

Instructions:
1. For ISSUES: Write natural, conversational summaries of what users are experiencing. Examples:
   - "Several users reported issues with the add to cart functionality not responding"
   - "Users are having trouble logging into their accounts"
   - "Payment processing seems to be causing frustration for customers"

2. For TRENDS: Use natural, descriptive names that capture the essence of what's happening. Examples:
   - "shopping_cart_issues": 5
   - "login_problems": 3
   - "payment_concerns": 4
   - "positive_feedback": 8
   - "feature_requests": 2

3. Analyze the conversations naturally and identify:
   - What problems users are actually facing
   - What topics are being discussed most
   - User sentiment and satisfaction
   - Common themes and patterns
   - Any positive feedback or success stories

4. Write like a human analyst would - natural, insightful, and actionable
5. Focus on the real user experience, not just keyword counting
6. Group related issues together meaningfully
7. Include both problems and positive aspects`

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful analytics assistant that analyzes chatbot conversations and extracts insights.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      })
      
      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }
      
      const data = await response.json()
      const content = data.choices[0]?.message?.content
      
      if (!content) {
        throw new Error('No content received from OpenAI')
      }
      
      // Parse the JSON response
      const summary = JSON.parse(content)
      
      return {
        issues: summary.issues || ['No issues detected'],
        trends: summary.trends || {},
        generated_at: new Date().toISOString(),
        method: 'ai'
      }
      
    } catch (error) {
      console.error('AI summary generation failed:', error)
      
      // Fallback to keyword analysis if AI fails
      return this.generateKeywordSummary(messages)
    }
  }
  
  /**
   * Generate daily summary (tries AI first, falls back to keyword)
   */
  static async generateDailySummary(messages: string[], useAI: boolean = true): Promise<DailySummary> {
    if (useAI && process.env.OPENAI_API_KEY) {
      return this.generateAISummary(messages)
    } else {
      return this.generateKeywordSummary(messages)
    }
  }
}
