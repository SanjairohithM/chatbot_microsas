const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

const prisma = new PrismaClient();

async function uploadFilesDirectlyToPinecone() {
  console.log('📚 Uploading files directly to Pinecone from uploads folder...\n');

  try {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      console.log('❌ Uploads folder not found');
      return;
    }

    // Get all PDF files from uploads folder
    const files = fs.readdirSync(uploadsDir).filter(file => file.endsWith('.pdf'));
    console.log(`📄 Found ${files.length} PDF files in uploads folder`);

    if (files.length === 0) {
      console.log('❌ No PDF files found in uploads folder');
      return;
    }

    // Get or create a bot for these documents
    let bot = await prisma.bot.findFirst({
      where: { name: { contains: 'Document' } }
    });

    if (!bot) {
      console.log('🤖 Creating bot for documents...');
      bot = await prisma.bot.create({
        data: {
          name: 'Document Bot',
          description: 'Bot for document knowledge base',
          model: 'deepseek-chat',
          temperature: 0.7,
          max_tokens: 1000,
          system_prompt: 'You are a helpful assistant that answers questions based on the provided documents.',
          user_id: 1
        }
      });
      console.log(`✅ Created bot: ${bot.name} (ID: ${bot.id})`);
    } else {
      console.log(`✅ Using existing bot: ${bot.name} (ID: ${bot.id})`);
    }

    let processedCount = 0;
    let errorCount = 0;

    for (const filename of files) {
      console.log(`\n📄 Processing file: ${filename}`);
      
      try {
        const filePath = path.join(uploadsDir, filename);
        const fileStats = fs.statSync(filePath);
        
        console.log(`   📁 File size: ${(fileStats.size / 1024).toFixed(1)} KB`);
        
        // Extract content from PDF
        console.log(`   🔄 Extracting PDF content...`);
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(dataBuffer);
        const content = pdfData.text;
        
        console.log(`   📝 Content length: ${content.length} characters`);
        console.log(`   📊 Pages: ${pdfData.numpages}`);
        
        // Create knowledge document in database
        const document = await prisma.knowledgeDocument.create({
          data: {
            bot_id: bot.id,
            title: filename.replace(/\.pdf$/, '').replace(/^\d+_/, ''), // Remove timestamp prefix
            content: content,
            file_url: `/api/secure-file/${filename}`,
            file_type: 'application/pdf',
            file_size: fileStats.size,
            status: 'indexed'
          }
        });
        
        console.log(`   ✅ Created document: ${document.title} (ID: ${document.id})`);
        
        // Store in Pinecone
        console.log(`   🌲 Storing in Pinecone...`);
        const response = await fetch('http://localhost:3000/api/documents/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId: document.id })
        });
        
        const result = await response.json();
        
        if (result.success) {
          console.log(`   ✅ Stored in Pinecone successfully`);
          processedCount++;
        } else {
          console.log(`   ❌ Failed to store in Pinecone: ${result.error}`);
          errorCount++;
        }
        
      } catch (error) {
        console.error(`   ❌ Error processing ${filename}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Upload Summary:');
    console.log(`   ✅ Successfully processed: ${processedCount} files`);
    console.log(`   ❌ Errors: ${errorCount} files`);
    console.log(`   🤖 Bot ID: ${bot.id}`);
    console.log(`   📁 Files processed from: ${uploadsDir}`);

    // Test document search
    console.log('\n🔍 Testing document search...');
    const searchResponse = await fetch('http://localhost:3000/api/search-documents-pinecone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        botId: bot.id, 
        query: 'company information', 
        limit: 3 
      })
    });
    
    const searchData = await searchResponse.json();
    
    if (searchData.success) {
      console.log(`✅ Found ${searchData.data.totalResults} documents in Pinecone`);
      searchData.data.results.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.title} (Score: ${(result.score * 100).toFixed(1)}%)`);
      });
    } else {
      console.log('❌ Document search failed:', searchData.error);
    }

    console.log('\n🎉 Direct Pinecone Upload Complete!');
    console.log('✅ All files from uploads folder processed and stored in Pinecone');
    console.log('✅ Documents are now searchable via vector search');
    console.log('✅ No need for manual upload API calls');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

uploadFilesDirectlyToPinecone();
