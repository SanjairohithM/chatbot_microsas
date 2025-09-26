const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

async function fixDocumentProcessing() {
  try {
    console.log('🔧 Fixing document processing for bot 11...\n');
    
    // Get all documents for bot 11
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
        processing_error: true
      }
    });
    
    console.log(`Found ${documents.length} documents to process\n`);
    
    for (const doc of documents) {
      console.log(`📄 Processing document: ${doc.title} (ID: ${doc.id})`);
      console.log(`   Current status: ${doc.status}`);
      console.log(`   Current content length: ${doc.content ? doc.content.length : 0}`);
      console.log(`   Current file URL: ${doc.file_url || 'null'}`);
      
      // Find the corresponding file in uploads directory
      const uploadsDir = path.join(process.cwd(), 'uploads');
      const files = fs.readdirSync(uploadsDir);
      
      // Find file that matches the document title
      const matchingFile = files.find(file => 
        file.includes('Zoho_Corporation_Handbook') || 
        file.includes('Webnox_Official_Documents')
      );
      
      if (!matchingFile) {
        console.log(`   ❌ No matching file found in uploads directory`);
        continue;
      }
      
      const filePath = path.join(uploadsDir, matchingFile);
      const fileUrl = `/uploads/${matchingFile}`;
      console.log(`   📁 Found file: ${matchingFile}`);
      
      try {
        // First, update the document with the correct file URL
        console.log(`   🔄 Updating file URL...`);
        await prisma.knowledgeDocument.update({
          where: { id: doc.id },
          data: {
            file_url: fileUrl,
            file_size: fs.statSync(filePath).size
          }
        });
        console.log(`   ✅ File URL updated`);
        
        // Now process the document using manual PDF parsing
        console.log(`   🔄 Processing PDF content...`);
        
        const pdfParse = require('pdf-parse');
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        
        console.log(`   ✅ PDF processing successful!`);
        console.log(`   📊 Content length: ${data.text.length} characters`);
        console.log(`   📈 Pages: ${data.numpages}`);
        
        // Update the document with processed content
        await prisma.knowledgeDocument.update({
          where: { id: doc.id },
          data: {
            content: data.text,
            status: 'indexed',
            file_size: dataBuffer.length
          }
        });
        
        console.log(`   ✅ Database updated successfully`);
        console.log(`   📝 New status: indexed`);
        console.log(`   📏 New content length: ${data.text.length}`);
        
      } catch (error) {
        console.log(`   ❌ Processing failed: ${error.message}`);
        
        // Update document with error status
        await prisma.knowledgeDocument.update({
          where: { id: doc.id },
          data: {
            status: 'error',
            processing_error: error.message
          }
        });
      }
      
      console.log('');
    }
    
    // Verify the fix
    console.log('🔍 Verifying the fix...\n');
    const updatedDocuments = await prisma.knowledgeDocument.findMany({
      where: { bot_id: 11 },
      select: {
        id: true,
        title: true,
        status: true,
        content: true,
        file_url: true,
        file_size: true
      }
    });
    
    updatedDocuments.forEach(doc => {
      console.log(`📄 ${doc.title}:`);
      console.log(`   Status: ${doc.status}`);
      console.log(`   Content Length: ${doc.content ? doc.content.length : 0}`);
      console.log(`   File URL: ${doc.file_url}`);
      console.log(`   File Size: ${doc.file_size} bytes`);
      
      if (doc.content && doc.content.length > 100) {
        console.log(`   Content Preview: "${doc.content.substring(0, 100)}..."`);
      }
      console.log('');
    });
    
    // Test the search functionality
    console.log('🔍 Testing document search...\n');
    
    const testQueries = [
      'Zoho Corporation',
      'company policies',
      'employee handbook',
      'benefits',
      'training'
    ];
    
    for (const query of testQueries) {
      console.log(`🔍 Testing query: "${query}"`);
      
      const documents = await prisma.knowledgeDocument.findMany({
        where: { 
          bot_id: 11,
          status: 'indexed',
          content: {
            contains: query,
            mode: 'insensitive'
          }
        },
        select: {
          id: true,
          title: true,
          content: true
        }
      });
      
      console.log(`   Found ${documents.length} matching documents`);
      
      if (documents.length > 0) {
        documents.forEach(doc => {
          const contentIndex = doc.content.toLowerCase().indexOf(query.toLowerCase());
          if (contentIndex !== -1) {
            const start = Math.max(0, contentIndex - 50);
            const end = Math.min(doc.content.length, contentIndex + query.length + 50);
            const snippet = doc.content.substring(start, end);
            console.log(`   📄 ${doc.title}: "...${snippet}..."`);
          }
        });
      }
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error fixing document processing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDocumentProcessing();