const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAndFixDocument() {
  console.log('🔍 Checking and fixing document...\n');

  try {
    // Get the document
    const document = await prisma.knowledgeDocument.findFirst({
      where: { bot_id: 11 },
      select: {
        id: true,
        title: true,
        content: true,
        file_url: true,
        status: true,
        file_type: true
      }
    });

    if (document) {
      console.log('📄 Document found:');
      console.log(`   ID: ${document.id}`);
      console.log(`   Title: ${document.title}`);
      console.log(`   Status: ${document.status}`);
      console.log(`   File URL: ${document.file_url}`);
      console.log(`   File Type: ${document.file_type}`);
      console.log(`   Content Length: ${document.content?.length || 0}`);

      // Check if file exists
      const fs = require('fs');
      const path = require('path');
      
      if (document.file_url) {
        const fullPath = path.join(process.cwd(), document.file_url);
        console.log(`\n📁 Checking file: ${fullPath}`);
        
        if (fs.existsSync(fullPath)) {
          console.log('✅ File exists');
          
          // Update the document to ensure it has the correct file_url
          const updated = await prisma.knowledgeDocument.update({
            where: { id: document.id },
            data: { 
              file_url: document.file_url,
              status: 'indexed'
            }
          });
          
          console.log('✅ Document updated');
          
          // Now try to process it
          console.log('\n🔄 Processing document...');
          const response = await fetch('${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/documents/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documentId: document.id })
          });
          
          const data = await response.json();
          if (data.success) {
            console.log('✅ Document processed successfully');
            console.log('📊 Pinecone stored:', data.pinecone_stored);
          } else {
            console.log('❌ Document processing failed:', data.error);
          }
          
        } else {
          console.log('❌ File does not exist');
          
          // Try to find the file in uploads directory
          const uploadsDir = path.join(process.cwd(), 'uploads');
          if (fs.existsSync(uploadsDir)) {
            const files = fs.readdirSync(uploadsDir);
            console.log(`\n📁 Files in uploads directory:`);
            files.forEach(file => {
              console.log(`   - ${file}`);
            });
            
            // Try to find a matching file
            const matchingFile = files.find(file => 
              file.includes('Zoho') || file.includes('Handbook')
            );
            
            if (matchingFile) {
              console.log(`\n🔧 Found matching file: ${matchingFile}`);
              const newFileUrl = `/uploads/${matchingFile}`;
              
              // Update the document with the correct file URL
              await prisma.knowledgeDocument.update({
                where: { id: document.id },
                data: { file_url: newFileUrl }
              });
              
              console.log(`✅ Updated file URL to: ${newFileUrl}`);
              
              // Try processing again
              console.log('\n🔄 Processing document with correct file URL...');
              const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || '${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}'}/api/documents/process`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documentId: document.id })
              });
              
              const data = await response.json();
              if (data.success) {
                console.log('✅ Document processed successfully');
                console.log('📊 Pinecone stored:', data.pinecone_stored);
              } else {
                console.log('❌ Document processing failed:', data.error);
              }
            }
          }
        }
      } else {
        console.log('❌ No file URL found');
      }
    } else {
      console.log('❌ No document found for bot 11');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndFixDocument();
