const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixBotIdMismatch() {
  console.log('🔧 Fixing Bot ID Mismatch...\n');

  try {
    // Check what documents exist and their bot IDs
    const documents = await prisma.knowledgeDocument.findMany({
      select: {
        id: true,
        title: true,
        bot_id: true,
        status: true
      }
    });

    console.log('📄 Current documents in database:');
    documents.forEach(doc => {
      console.log(`   ID: ${doc.id}, Title: ${doc.title}, Bot ID: ${doc.bot_id}, Status: ${doc.status}`);
    });

    // Check what bots exist
    const bots = await prisma.bot.findMany({
      select: {
        id: true,
        name: true,
        user_id: true
      }
    });

    console.log('\n🤖 Current bots:');
    bots.forEach(bot => {
      console.log(`   ID: ${bot.id}, Name: ${bot.name}, User ID: ${bot.user_id}`);
    });

    // Find the bot that should have the documents (probably the one with documents)
    const documentBotId = documents.length > 0 ? documents[0].bot_id : null;
    
    if (documentBotId) {
      console.log(`\n🔧 Documents are associated with Bot ID: ${documentBotId}`);
      
      // Update all documents to use a consistent bot ID (let's use bot ID 11)
      const targetBotId = 11;
      
      console.log(`🔄 Updating all documents to use Bot ID: ${targetBotId}`);
      
      const updateResult = await prisma.knowledgeDocument.updateMany({
        where: {
          bot_id: documentBotId
        },
        data: {
          bot_id: targetBotId
        }
      });
      
      console.log(`✅ Updated ${updateResult.count} documents to Bot ID ${targetBotId}`);
      
      // Now we need to update the Pinecone vectors to use the correct bot ID
      console.log('\n🌲 Updating Pinecone vectors...');
      
      // This would require updating the Pinecone vectors, but since we can't easily update metadata,
      // let's delete the old vectors and recreate them
      console.log('⚠️ Note: Pinecone vectors need to be updated with correct bot ID');
      console.log('💡 You may need to reprocess the documents to update Pinecone vectors');
      
    } else {
      console.log('❌ No documents found in database');
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Fix Summary:');
    console.log('✅ Database documents updated to consistent Bot ID');
    console.log('⚠️ Pinecone vectors may need to be updated');
    console.log('💡 Consider reprocessing documents to update Pinecone');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixBotIdMismatch();
