const fs = require('fs');
const path = require('path');

async function debugPineconeUpload() {
  console.log('🔍 Debugging Pinecone Upload Issue\n');

  try {
    // Test with the IARJSET PDF that was just uploaded
    const testFile = '1758948156319_IARJSET.2022.91108.pdf';
    const filePath = path.join(process.cwd(), 'secure-uploads', testFile);
    
    if (!fs.existsSync(filePath)) {
      console.log('❌ Test file not found:', filePath);
      return;
    }

    console.log(`📄 Testing with: ${testFile}`);
    
    // Read the file
    const fileBuffer = fs.readFileSync(filePath);
    const fileStats = fs.statSync(filePath);
    
    console.log(`📊 File size: ${(fileStats.size / 1024).toFixed(1)} KB`);
    
    // Test 1: Check if the upload-to-pinecone endpoint exists
    console.log('\n🔍 Testing /api/upload-to-pinecone endpoint...');
    
    try {
      const testResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/upload-to-pinecone`, {
        method: 'GET'
      });
      
      console.log(`Status: ${testResponse.status}`);
      console.log(`Status Text: ${testResponse.statusText}`);
      
      if (testResponse.status === 405) {
        console.log('✅ Endpoint exists (Method Not Allowed for GET is expected)');
      } else {
        console.log('❌ Unexpected response from endpoint');
      }
    } catch (endpointError) {
      console.error('❌ Endpoint test failed:', endpointError.message);
      return;
    }
    
    // Test 2: Try actual upload with detailed error logging
    console.log('\n📤 Testing actual upload...');
    
    try {
      // Create proper FormData
      const FormData = require('form-data');
      const formData = new FormData();
      
      formData.append('file', fileBuffer, {
        filename: testFile,
        contentType: 'application/pdf'
      });
      formData.append('botId', '25'); // Use bot 25 from your logs
      
      console.log('📋 FormData created with:');
      console.log(`   - File: ${testFile}`);
      console.log(`   - Bot ID: 25`);
      console.log(`   - Content Type: application/pdf`);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/upload-to-pinecone`, {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders()
      });
      
      console.log(`\n📊 Response Status: ${response.status}`);
      console.log(`📊 Response Status Text: ${response.statusText}`);
      
      const responseText = await response.text();
      console.log(`📊 Response Body: ${responseText}`);
      
      if (response.ok) {
        const result = JSON.parse(responseText);
        console.log('✅ Upload successful!');
        console.log('📄 Result:', JSON.stringify(result, null, 2));
      } else {
        console.log('❌ Upload failed');
        try {
          const errorResult = JSON.parse(responseText);
          console.log('❌ Error details:', JSON.stringify(errorResult, null, 2));
        } catch (parseError) {
          console.log('❌ Raw error response:', responseText);
        }
      }
      
    } catch (uploadError) {
      console.error('❌ Upload error:', uploadError.message);
      console.error('❌ Full error:', uploadError);
    }
    
    // Test 3: Check what's currently in Pinecone for bot 25
    console.log('\n🔍 Checking current Pinecone content for bot 25...');
    
    try {
      const searchResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/search-documents-pinecone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botId: 25,
          query: 'test',
          limit: 10
        })
      });
      
      const searchResult = await searchResponse.json();
      
      if (searchResult.success) {
        console.log(`✅ Found ${searchResult.data.totalResults} documents in Pinecone for bot 25`);
        searchResult.data.results.forEach((doc, index) => {
          console.log(`   ${index + 1}. ${doc.title || 'Untitled'} (ID: ${doc.documentId})`);
        });
      } else {
        console.log('❌ Search failed:', searchResult.error);
      }
    } catch (searchError) {
      console.error('❌ Search error:', searchError.message);
    }

  } catch (error) {
    console.error('❌ Debug error:', error.message);
  }
}

// Run the debug
debugPineconeUpload();
