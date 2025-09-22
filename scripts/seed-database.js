const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create users
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'john@example.com' },
      update: {},
      create: {
        email: 'john@example.com',
        password_hash: await bcrypt.hash('password123', 12),
        name: 'John Doe',
      },
    }),
    prisma.user.upsert({
      where: { email: 'jane@example.com' },
      update: {},
      create: {
        email: 'jane@example.com',
        password_hash: await bcrypt.hash('password123', 12),
        name: 'Jane Smith',
      },
    }),
    prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        password_hash: await bcrypt.hash('password123', 12),
        name: 'Admin User',
      },
    }),
  ])

  console.log('✅ Created users:', users.length)

  // Create bots
  const bots = await Promise.all([
    prisma.bot.upsert({
      where: { id: 1 },
      update: {},
      create: {
        user_id: users[0].id,
        name: 'Customer Support Bot',
        description: 'Handles customer inquiries and support tickets',
        system_prompt: 'You are a helpful customer support assistant. Be polite, professional, and try to resolve customer issues efficiently.',
        model: 'deepseek-chat',
        temperature: 0.7,
        max_tokens: 1000,
        status: 'active',
        is_deployed: true,
        deployment_url: 'https://bot1.example.com',
      },
    }),
    prisma.bot.upsert({
      where: { id: 2 },
      update: {},
      create: {
        user_id: users[0].id,
        name: 'Sales Assistant',
        description: 'Helps with product recommendations and sales inquiries',
        system_prompt: 'You are a knowledgeable sales assistant. Help customers find the right products and answer their questions about features and pricing.',
        model: 'deepseek-chat',
        temperature: 0.5,
        max_tokens: 800,
        status: 'active',
        is_deployed: false,
      },
    }),
    prisma.bot.upsert({
      where: { id: 3 },
      update: {},
      create: {
        user_id: users[0].id,
        name: 'FAQ Bot',
        description: 'Answers frequently asked questions',
        system_prompt: 'You are an FAQ bot. Provide clear, concise answers to common questions about our products and services.',
        model: 'deepseek-chat',
        temperature: 0.3,
        max_tokens: 500,
        status: 'draft',
        is_deployed: false,
      },
    }),
  ])

  console.log('✅ Created bots:', bots.length)

  // Create knowledge documents
  const knowledgeDocs = await Promise.all([
    prisma.knowledgeDocument.upsert({
      where: { id: 1 },
      update: {},
      create: {
        bot_id: bots[0].id,
        title: 'Product Catalog',
        content: 'Our comprehensive product catalog includes laptops, desktops, accessories, and software solutions. Each product comes with detailed specifications, pricing, and availability information.',
        file_type: 'text',
        file_size: 1024,
        status: 'indexed',
      },
    }),
    prisma.knowledgeDocument.upsert({
      where: { id: 2 },
      update: {},
      create: {
        bot_id: bots[0].id,
        title: 'Return Policy',
        content: 'We offer a 30-day return policy for all products. Items must be in original condition with all packaging and accessories included.',
        file_type: 'text',
        file_size: 512,
        status: 'indexed',
      },
    }),
  ])

  console.log('✅ Created knowledge documents:', knowledgeDocs.length)

  // Create conversations
  const conversations = await Promise.all([
    prisma.conversation.upsert({
      where: { id: 1 },
      update: {},
      create: {
        bot_id: bots[0].id,
        user_id: users[0].id,
        title: 'Product inquiry about laptops',
        is_test: false,
      },
    }),
    prisma.conversation.upsert({
      where: { id: 2 },
      update: {},
      create: {
        bot_id: bots[0].id,
        user_id: users[0].id,
        title: 'Return request assistance',
        is_test: false,
      },
    }),
  ])

  console.log('✅ Created conversations:', conversations.length)

  // Create messages
  const messages = await Promise.all([
    prisma.message.upsert({
      where: { id: 1 },
      update: {},
      create: {
        conversation_id: conversations[0].id,
        role: 'user',
        content: 'Hi, I am looking for a gaming laptop under $1500',
        tokens_used: 25,
      },
    }),
    prisma.message.upsert({
      where: { id: 2 },
      update: {},
      create: {
        conversation_id: conversations[0].id,
        role: 'assistant',
        content: 'I would be happy to help you find a gaming laptop under $1500. Based on our current inventory, I recommend the following options: 1) Gaming Pro X15 - $1299, 2) PowerBook Gaming - $1399. Both offer excellent performance for gaming.',
        tokens_used: 45,
        response_time_ms: 850,
      },
    }),
  ])

  console.log('✅ Created messages:', messages.length)

  // Create analytics data
  const today = new Date()
  const analytics = await Promise.all([
    prisma.botAnalytics.upsert({
      where: {
        bot_id_date: {
          bot_id: bots[0].id,
          date: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      update: {},
      create: {
        bot_id: bots[0].id,
        date: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
        total_conversations: 15,
        total_messages: 45,
        total_tokens_used: 2250,
        avg_response_time_ms: 750.5,
        user_satisfaction_score: 4.2,
      },
    }),
    prisma.botAnalytics.upsert({
      where: {
        bot_id_date: {
          bot_id: bots[0].id,
          date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
        },
      },
      update: {},
      create: {
        bot_id: bots[0].id,
        date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
        total_conversations: 28,
        total_messages: 84,
        total_tokens_used: 4200,
        avg_response_time_ms: 690.7,
        user_satisfaction_score: 4.7,
      },
    }),
  ])

  console.log('✅ Created analytics data:', analytics.length)

  console.log('🎉 Database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
