const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDocuments() {
  try {
    console.log('🔍 Checking documents for bot 11...\n');
    
    const documents = await prisma.knowledgeDocument.findMany({
      where: { bot_id: 11 },
      select: {
        id: true,
        title: true,
        status: true,
        content: true,
        file_url: true,
        file_type: true,
        file_size: true,
        processing_error: true,
        created_at: true
      }
    });
    
    console.log(`Found ${documents.length} documents for bot 11:\n`);
    
    documents.forEach((doc, index) => {
      console.log(`${index + 1}. Document ID: ${doc.id}`);
      console.log(`   Title: ${doc.title}`);
      console.log(`   Status: ${doc.status}`);
      console.log(`   File Type: ${doc.file_type}`);
      console.log(`   File Size: ${doc.file_size} bytes`);
      console.log(`   File URL: ${doc.file_url}`);
      console.log(`   Content Length: ${doc.content ? doc.content.length : 0} characters`);
      console.log(`   Created: ${doc.created_at}`);
      
      if (doc.processing_error) {
        console.log(`   ❌ Processing Error: ${doc.processing_error}`);
      }
      
      if (doc.content && doc.content.length < 200) {
        console.log(`   Content Preview: "${doc.content}"`);
      } else if (doc.content) {
        console.log(`   Content Preview: "${doc.content.substring(0, 100)}..."`);
      } else {
        console.log(`   ❌ No content found`);
      }
      
      console.log('');
    });
    
    // Check if files exist
    console.log('📁 Checking if files exist on disk...\n');
    const fs = require('fs');
    const path = require('path');
    
    for (const doc of documents) {
      if (doc.file_url) {
        const filePath = path.join(process.cwd(), doc.file_url);
        const exists = fs.existsSync(filePath);
        console.log(`File: ${doc.file_url} - ${exists ? '✅ Exists' : '❌ Not found'}`);
        
        if (exists) {
          const stats = fs.statSync(filePath);
          console.log(`   Size on disk: ${stats.size} bytes`);
          console.log(`   Modified: ${stats.mtime}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking documents:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDocuments();