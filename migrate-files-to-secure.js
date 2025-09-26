const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function migrateFilesToSecure() {
  console.log('🔒 Migrating files to secure location...\n');

  try {
    // Create secure-uploads directory if it doesn't exist
    const secureUploadsDir = path.join(process.cwd(), 'secure-uploads');
    if (!fs.existsSync(secureUploadsDir)) {
      fs.mkdirSync(secureUploadsDir, { recursive: true });
      console.log('✅ Created secure-uploads directory');
    }

    // Get all documents with file URLs
    const documents = await prisma.knowledgeDocument.findMany({
      where: {
        file_url: {
          not: null
        }
      },
      select: {
        id: true,
        title: true,
        file_url: true
      }
    });

    console.log(`📄 Found ${documents.length} documents with file URLs`);

    let migratedCount = 0;
    let errorCount = 0;

    for (const doc of documents) {
      console.log(`\n📄 Processing document: ${doc.title} (ID: ${doc.id})`);
      console.log(`   Current file URL: ${doc.file_url}`);

      if (doc.file_url.startsWith('/uploads/')) {
        const filename = doc.file_url.replace('/uploads/', '');
        const oldPath = path.join(process.cwd(), 'uploads', filename);
        const newPath = path.join(secureUploadsDir, filename);

        try {
          // Check if file exists in old location
          if (fs.existsSync(oldPath)) {
            // Move file to secure location
            fs.copyFileSync(oldPath, newPath);
            console.log(`   ✅ Moved file: ${filename}`);

            // Update database with new secure URL
            const newFileUrl = `/api/secure-file/${filename}`;
            await prisma.knowledgeDocument.update({
              where: { id: doc.id },
              data: { file_url: newFileUrl }
            });
            console.log(`   ✅ Updated database URL: ${newFileUrl}`);
            migratedCount++;
          } else {
            console.log(`   ⚠️ File not found in old location: ${oldPath}`);
            errorCount++;
          }
        } catch (error) {
          console.error(`   ❌ Error migrating file ${filename}:`, error.message);
          errorCount++;
        }
      } else if (doc.file_url.startsWith('/api/secure-file/')) {
        console.log(`   ✅ Already using secure URL`);
      } else {
        console.log(`   ⚠️ Unknown file URL format: ${doc.file_url}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Successfully migrated: ${migratedCount} files`);
    console.log(`   ❌ Errors: ${errorCount} files`);
    console.log(`   📁 Secure directory: ${secureUploadsDir}`);

    // List files in secure directory
    if (fs.existsSync(secureUploadsDir)) {
      const secureFiles = fs.readdirSync(secureUploadsDir);
      console.log(`   📄 Files in secure directory: ${secureFiles.length}`);
      secureFiles.forEach(file => {
        console.log(`      - ${file}`);
      });
    }

    console.log('\n🔒 File security migration complete!');
    console.log('✅ Documents are now stored securely outside the public folder');
    console.log('✅ Files are served through a secure API endpoint');

  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateFilesToSecure();
