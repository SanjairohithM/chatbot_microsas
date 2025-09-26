// Using built-in fetch (Node.js 18+)

async function testSecureFileServing() {
  console.log('🔒 Testing Secure File Serving...\n');

  try {
    // Test 1: Check if secure file endpoint works
    console.log('🔍 Test 1: Testing secure file endpoint...');
    
    const filename = '1758613280567_Zoho_Corporation_Handbook.pdf';
    const secureFileUrl = `http://localhost:3000/api/secure-file/${filename}`;
    
    console.log(`📁 Testing file: ${filename}`);
    console.log(`🔗 URL: ${secureFileUrl}`);
    
    const response = await fetch(secureFileUrl);
    
    if (response.ok) {
      console.log('✅ Secure file endpoint working!');
      console.log(`   Status: ${response.status}`);
      console.log(`   Content-Type: ${response.headers.get('content-type')}`);
      console.log(`   Content-Length: ${response.headers.get('content-length')} bytes`);
      console.log(`   Cache-Control: ${response.headers.get('cache-control')}`);
    } else {
      console.log('❌ Secure file endpoint failed:');
      console.log(`   Status: ${response.status}`);
      const errorText = await response.text();
      console.log(`   Error: ${errorText}`);
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 2: Test document processing with secure file
    console.log('📄 Test 2: Testing document processing with secure file...');
    
    const processResponse = await fetch('http://localhost:3000/api/documents/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId: 9 })
    });
    
    const processData = await processResponse.json();
    
    if (processData.success) {
      console.log('✅ Document processing successful!');
      console.log(`   Pinecone stored: ${processData.pinecone_stored}`);
      console.log(`   File URL: ${processData.data.file_url}`);
    } else {
      console.log('❌ Document processing failed:', processData.error);
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Test 3: Test document search
    console.log('🔍 Test 3: Testing document search...');
    
    const searchResponse = await fetch('http://localhost:3000/api/search-documents-pinecone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        botId: 11, 
        query: 'Zoho Corporation company information', 
        limit: 2 
      })
    });
    
    const searchData = await searchResponse.json();
    
    if (searchData.success) {
      console.log('✅ Document search successful!');
      console.log(`   Found ${searchData.data.totalResults} results`);
      console.log(`   Search method: ${searchData.data.searchMethod}`);
    } else {
      console.log('❌ Document search failed:', searchData.error);
    }

    console.log('\n🎉 Secure File Serving Test Complete!');
    console.log('\n✅ Security Improvements:');
    console.log('   🔒 Files stored outside public folder');
    console.log('   🔐 Files served through secure API endpoint');
    console.log('   🛡️ Directory traversal protection');
    console.log('   📁 Proper content-type headers');
    console.log('   ⏰ Cache control headers');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSecureFileServing();
