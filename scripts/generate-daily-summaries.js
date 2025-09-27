

/**
 * Script to generate daily summaries for existing analytics data
 * Usage: node scripts/generate-daily-summaries.js [botId] [startDate] [endDate] [useAI]
 * 
 * Examples:
 * node scripts/generate-daily-summaries.js 1 2024-01-01 2024-01-31 true
 * node scripts/generate-daily-summaries.js 1 2024-01-15 2024-01-15 false
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// AI Summary Generation Function
async function generateAISummary(textBlob, useAI = true) {
  if (!useAI) {
    // Fallback to simple analysis if AI is disabled
    return {
      issues: ['AI analysis disabled - using basic analysis'],
      trends: { basic_analysis: 1 },
      generated_at: new Date().toISOString(),
      method: 'keyword'
    }
  }

  try {
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

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response')
    }

    const parsed = JSON.parse(jsonMatch[0])
    
    return {
      issues: parsed.issues || ['No specific issues detected'],
      trends: parsed.trends || {},
      generated_at: new Date().toISOString(),
      method: 'ai'
    }

  } catch (error) {
    console.error('AI summary generation failed:', error)
    
    // Fallback to basic analysis
    return {
      issues: ['AI analysis failed - using basic analysis'],
      trends: { analysis_error: 1 },
      generated_at: new Date().toISOString(),
      method: 'keyword'
    }
  }
}

async function generateDailySummaries(botId, startDate, endDate, useAI = true) {
  console.log(`Generating daily summaries for bot ${botId} from ${startDate} to ${endDate} (AI: ${useAI})`)
  
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  // Get all dates in the range
  const dates = []
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split('T')[0])
  }
  
  console.log(`Found ${dates.length} dates to process`)
  
  for (const date of dates) {
    try {
      console.log(`Processing ${date}...`)
      
      // Get messages for this date
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      const messages = await prisma.message.findMany({
        where: {
          conversation: { bot_id: botId },
          created_at: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
        select: { content: true },
        orderBy: { created_at: 'asc' },
      })

      if (messages.length === 0) {
        console.log(`  No messages found for ${date}`)
        continue
      }

      console.log(`  Found ${messages.length} messages for ${date}`)
      
      // Generate summary using AI analysis
      const textBlob = messages.map(m => m.content).join(' ')
      
      // Use AI to analyze the conversations naturally
      const dailySummary = await generateAISummary(textBlob, useAI)
      
      // Update or create analytics record
      await prisma.botAnalytics.upsert({
        where: {
          bot_id_date: {
            bot_id: botId,
            date: new Date(date),
          },
        },
        update: {
          daily_summary: dailySummary,
        },
        create: {
          bot_id: botId,
          date: new Date(date),
          total_conversations: 0,
          total_messages: messages.length,
          total_tokens_used: 0,
          daily_summary: dailySummary,
        },
      })
      
      console.log(`  ✓ Generated summary for ${date} (${dailySummary.issues.length} issues, ${Object.keys(dailySummary.trends).length} trends)`)
      
    } catch (error) {
      console.error(`  ✗ Error processing ${date}:`, error.message)
    }
  }
  
  console.log('Daily summary generation completed!')
}

async function main() {
  const args = process.argv.slice(2)
  
  if (args.length < 3) {
    console.log('Usage: node scripts/generate-daily-summaries.js <botId> <startDate> <endDate> [useAI]')
    console.log('Example: node scripts/generate-daily-summaries.js 1 2024-01-01 2024-01-31 true')
    process.exit(1)
  }
  
  const botId = parseInt(args[0])
  const startDate = args[1]
  const endDate = args[2]
  const useAI = args[3] === 'true'
  
  if (isNaN(botId)) {
    console.error('Invalid bot ID')
    process.exit(1)
  }
  
  try {
    await generateDailySummaries(botId, startDate, endDate, useAI)
  } catch (error) {
    console.error('Script failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
