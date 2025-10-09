import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Pinecone } from '@pinecone-database/pinecone';
import { UserApiKeyService } from '@/lib/services/user-api-key.service';

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    console.log('URL scraping request received');
    
    const { urls, botId } = await request.json();
    
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: 'URLs array is required' },
        { status: 400 }
      );
    }

    if (!botId) {
      return NextResponse.json(
        { error: 'Bot ID is required' },
        { status: 400 }
      );
    }

    console.log(`Scraping ${urls.length} URLs for bot ${botId}`);

    // Get user's API key for this bot
    const userApiKey = await UserApiKeyService.getApiKeyByBotWithFallback(botId)
    if (!userApiKey) {
      return NextResponse.json(
        { error: 'No OpenAI API key found. Please configure your API key in settings.' },
        { status: 400 }
      )
    }

    // Use chatbot index with bot namespace
    const index = pc.index('chatbot');
    const namespace = `bot_${botId}`;
    
    const scrapedData = [];
    
    // Process each URL sequentially to avoid race conditions
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      try {
        console.log(`\n📄 [${i + 1}/${urls.length}] Scraping: ${url}`);
        
        // Scrape the URL
        const content = await scrapeUrl(url);
        
        if (content) {
          try {
            // Store in Pinecone
            await storeScrapedContent(index, namespace, url, content, botId, userApiKey);
            scrapedData.push({ url, title: content.title, success: true });
            console.log(`✅ [${i + 1}/${urls.length}] Successfully scraped and stored: ${url}`);
          } catch (storageError) {
            console.error(`❌ [${i + 1}/${urls.length}] Failed to store ${url}:`, storageError);
            scrapedData.push({ url, success: false, error: `Storage failed: ${storageError.message}` });
          }
        } else {
          console.log(`❌ [${i + 1}/${urls.length}] Failed to scrape: ${url}`);
          scrapedData.push({ url, success: false, error: 'No content found' });
        }
        
        // Add a small delay between URLs to avoid overwhelming Pinecone
        if (i < urls.length - 1) {
          console.log(`⏳ Waiting 1 second before next URL...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`❌ [${i + 1}/${urls.length}] Error scraping ${url}:`, error);
        scrapedData.push({ url, success: false, error: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Scraped ${scrapedData.filter(d => d.success).length} out of ${urls.length} URLs`,
      results: scrapedData
    });

  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json(
      { error: 'Failed to scrape URLs: ' + error.message },
      { status: 500 }
    );
  }
}

async function scrapeUrl(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled';
    
    // Extract meta description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const description = descMatch ? descMatch[1].trim() : '';
    
    // Extract main content (remove scripts, styles, etc.)
    let content = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Limit content length
    content = content.substring(0, 8000);

    return {
      title,
      description,
      content,
      url,
      scrapedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return null;
  }
}

async function storeScrapedContent(index: any, namespace: string, url: string, content: any, botId: number, userApiKey: string) {
  try {
    // Create unique document ID based on URL hash and timestamp
    const urlHash = Buffer.from(url).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 8);
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const documentId = parseInt(urlHash + timestamp, 36) % 100000; // Ensure it's a reasonable number
    
    // Chunk the content into smaller pieces
    const chunks = chunkContent(content.title, content.content, 1000, 200); // 1000 chars per chunk, 200 overlap
    
    console.log(`📄 Chunking ${url}: ${chunks.length} chunks created`);
    
    const vectors = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const vectorId = `doc_${documentId}_chunk_${i}`;
      
      // Generate embedding for this chunk
      const embedding = await generateEmbedding(chunk.text, userApiKey);
      
      const vector = {
        id: vectorId,
        values: embedding,
        metadata: {
          type: 'scraped_content',
          url: url,
          title: content.title,
          description: content.description,
          content: chunk.text,
          scrapedAt: content.scrapedAt,
          botId: botId,
          documentId: documentId,
          chunkIndex: i,
          totalChunks: chunks.length,
          chunkTitle: chunk.title || content.title
        }
      };
      
      vectors.push(vector);
    }

    // Store all chunks at once
    console.log(`📤 Storing ${vectors.length} chunks for ${url} in namespace ${namespace}...`);
    await index.namespace(namespace).upsert(vectors);
    console.log(`✅ Successfully stored ${vectors.length} chunks for ${url} in namespace ${namespace}`);
  } catch (error) {
    console.error(`❌ Error storing scraped content for ${url}:`, error);
    console.error(`❌ Error details:`, {
      message: error.message,
      stack: error.stack,
      url: url,
      namespace: namespace,
      botId: botId
    });
    throw error;
  }
}

function chunkContent(title: string, content: string, chunkSize: number, overlap: number): Array<{text: string, title?: string}> {
  const chunks = [];
  
  // Clean and prepare content
  const cleanContent = content
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
  
  if (cleanContent.length <= chunkSize) {
    // If content is small enough, return as single chunk
    return [{
      text: `${title}\n\n${cleanContent}`,
      title: title
    }];
  }
  
  // Split content into sentences for better chunking
  const sentences = cleanContent.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  let currentChunk = `${title}\n\n`;
  let chunkIndex = 0;
  
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim();
    if (!sentence) continue;
    
    // Check if adding this sentence would exceed chunk size
    if (currentChunk.length + sentence.length + 1 > chunkSize && currentChunk.length > 0) {
      // Save current chunk
      chunks.push({
        text: currentChunk.trim(),
        title: `${title} - Part ${chunkIndex + 1}`
      });
      
      // Start new chunk with overlap
      const overlapText = currentChunk.slice(-overlap);
      currentChunk = overlapText + ' ' + sentence + ' ';
      chunkIndex++;
    } else {
      currentChunk += sentence + '. ';
    }
  }
  
  // Add the last chunk if it has content
  if (currentChunk.trim().length > 50) {
    chunks.push({
      text: currentChunk.trim(),
      title: `${title} - Part ${chunkIndex + 1}`
    });
  }
  
  return chunks;
}

async function generateEmbedding(text: string, userApiKey: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-ada-002', // 1536 dimensions
      input: text.substring(0, 8000),
    }),
  });

  const data = await response.json();
  const embedding = data.data[0].embedding;
  
  // Truncate to 512 dimensions to match chatbot index
  return embedding.slice(0, 512);
}
