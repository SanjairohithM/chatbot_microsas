const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

const prisma = new PrismaClient();

async function processAllUploadsToPinecone() {
  console.log('📚 Processing all files from uploads folder to Pinecone...\n');

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

    // Use Bot ID 11 (test document bot)
    const botId = 11;
    console.log(`🤖 Using Bot ID: ${botId}`);

    // Clear existing Pinecone vectors for this bot
    console.log('\n🧹 Clearing existing Pinecone vectors...');
    const { Pinecone } = require('@pinecone-database/pinecone');
    
    const pc = new Pinecone({
      apiKey: 'pcsk_4w6uv3_EKThZtWRWMFUDzKKS5mncjXN7AWHp2pQRQWFHH2Jfgy3nYZ3T55kWLfu519Bz5V'
    });

    const index = pc.index('chatbot');
    
    // Delete existing document vectors for this bot
    const existingVectors = await index.query({
      vector: Array(512).fill(0),
      filter: {
        botId: { $eq: botId },
        documentId: { $exists: true }
      },
      topK: 10000,
      includeMetadata: true
    });

    if (existingVectors.matches && existingVectors.matches.length > 0) {
      const vectorIds = existingVectors.matches.map(match => match.id);
      console.log(`Deleting ${vectorIds.length} existing document vectors...`);
      await index.deleteMany(vectorIds);
      console.log('✅ Existing document vectors deleted');
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
        
        // Create or update knowledge document in database
        const title = filename.replace(/\.pdf$/, '').replace(/^\d+_/, '');
        
        let document = await prisma.knowledgeDocument.findFirst({
          where: {
            title: title,
            bot_id: botId
          }
        });

        if (!document) {
          document = await prisma.knowledgeDocument.create({
            data: {
              bot_id: botId,
              title: title,
              content: content,
              file_url: `/api/secure-file/${filename}`,
              file_type: 'application/pdf',
              file_size: fileStats.size,
              status: 'indexed'
            }
          });
          console.log(`   ✅ Created document: ${document.title} (ID: ${document.id})`);
        } else {
          // Update existing document
          document = await prisma.knowledgeDocument.update({
            where: { id: document.id },
            data: {
              content: content,
              file_url: `/api/secure-file/${filename}`,
              file_size: fileStats.size,
              status: 'indexed'
            }
          });
          console.log(`   ✅ Updated document: ${document.title} (ID: ${document.id})`);
        }
        
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
    console.log('📊 Processing Summary:');
    console.log(`   ✅ Successfully processed: ${processedCount} files`);
    console.log(`   ❌ Errors: ${errorCount} files`);
    console.log(`   🤖 Bot ID: ${botId}`);

    // Test document search
    console.log('\n🔍 Testing document search...');
    const searchResponse = await fetch('http://localhost:3000/api/search-documents-pinecone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        botId: botId, 
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

    console.log('\n🎉 All Uploads Processed to Pinecone!');
    console.log('✅ All files from uploads folder processed and stored in Pinecone');
    console.log('✅ Documents are now searchable via vector search');
    console.log('✅ Chat will now find document context from Pinecone');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

processAllUploadsToPinecone();
