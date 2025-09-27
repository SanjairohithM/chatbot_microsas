/**
 * Script to generate analytics data for existing messages
 * This will create analytics records for all existing conversations and messages
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function generateAnalyticsForBot(botId) {
  console.log(`Generating analytics for bot ${botId}...`)
  
  // Get all conversations for this bot
  const conversations = await prisma.conversation.findMany({
    where: { bot_id: botId },
    include: {
      messages: {
        orderBy: { created_at: 'asc' }
      }
    }
  })

  console.log(`Found ${conversations.length} conversations for bot ${botId}`)

  // Group messages by date
  const messagesByDate = {}
  
  conversations.forEach(conversation => {
    conversation.messages.forEach(message => {
      const date = message.created_at.toISOString().split('T')[0]
      
      if (!messagesByDate[date]) {
        messagesByDate[date] = {
          conversations: new Set(),
          messages: [],
          totalTokens: 0,
          responseTimes: []
        }
      }
      
      messagesByDate[date].conversations.add(conversation.id)
      messagesByDate[date].messages.push(message)
      
      if (message.tokens_used) {
        messagesByDate[date].totalTokens += message.tokens_used
      }
      
      if (message.response_time_ms) {
        messagesByDate[date].responseTimes.push(message.response_time_ms)
      }
    })
  })

  // Create analytics records for each date
  for (const [date, data] of Object.entries(messagesByDate)) {
    const totalConversations = data.conversations.size
    const totalMessages = data.messages.length
    const totalTokensUsed = data.totalTokens
    const avgResponseTime = data.responseTimes.length > 0 
      ? data.responseTimes.reduce((sum, time) => sum + time, 0) / data.responseTimes.length 
      : null

    console.log(`  ${date}: ${totalConversations} conversations, ${totalMessages} messages, ${totalTokensUsed} tokens`)

    // Upsert analytics record
    await prisma.botAnalytics.upsert({
      where: {
        bot_id_date: {
          bot_id: botId,
          date: new Date(date)
        }
      },
      update: {
        total_conversations: totalConversations,
        total_messages: totalMessages,
        total_tokens_used: totalTokensUsed,
        avg_response_time_ms: avgResponseTime,
        user_satisfaction_score: null
      },
      create: {
        bot_id: botId,
        date: new Date(date),
        total_conversations: totalConversations,
        total_messages: totalMessages,
        total_tokens_used: totalTokensUsed,
        avg_response_time_ms: avgResponseTime,
        user_satisfaction_score: null
      }
    })
  }

  console.log(`✓ Generated analytics for bot ${botId}`)
}

async function generateAnalyticsForAllBots() {
  console.log('Generating analytics for all bots...')
  
  // Get all bots
  const bots = await prisma.bot.findMany({
    select: { id: true, name: true }
  })

  console.log(`Found ${bots.length} bots`)

  for (const bot of bots) {
    await generateAnalyticsForBot(bot.id)
  }

  console.log('✓ Analytics generation completed for all bots!')
}

async function main() {
  const args = process.argv.slice(2)
  
  try {
    if (args.length > 0) {
      const botId = parseInt(args[0])
      if (isNaN(botId)) {
        console.error('Invalid bot ID')
        process.exit(1)
      }
      await generateAnalyticsForBot(botId)
    } else {
      await generateAnalyticsForAllBots()
    }
  } catch (error) {
    console.error('Script failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
