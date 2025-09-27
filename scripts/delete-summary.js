const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function deleteSummary() {
  try {
    await prisma.botAnalytics.updateMany({
      where: {
        bot_id: 1,
        date: new Date('2025-09-27')
      },
      data: {
        daily_summary: null
      }
    })
    console.log('Deleted existing summary')
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

deleteSummary()
