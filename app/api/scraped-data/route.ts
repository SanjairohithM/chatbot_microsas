import { NextRequest, NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const botId = searchParams.get('botId');
    
    if (!botId) {
      return NextResponse.json(
        { error: 'Bot ID is required' },
        { status: 400 }
      );
    }

    console.log(`📊 Fetching scraped data for bot ${botId}`);

    // Get chatbot index and bot namespace
    const index = pc.index('chatbot');
    const namespace = `bot_${botId}`;
    
    // Query all scraped content for this bot
    const response = await index.namespace(namespace).query({
      vector: new Array(512).fill(0), // Dummy vector to get all results
      filter: {
        type: { $eq: 'scraped_content' }
      },
      topK: 100, // Get up to 100 scraped URLs
      includeMetadata: true
    });

    console.log(`📈 Found ${response.matches?.length || 0} scraped URLs`);

    // Process and format the data
    const scrapedData = response.matches?.map(match => ({
      id: match.id,
      vectorId: match.id, // Show the actual Pinecone vector ID
      url: match.metadata?.url,
      title: match.metadata?.title,
      description: match.metadata?.description,
      scrapedAt: match.metadata?.scrapedAt,
      score: match.score,
      contentLength: match.metadata?.content?.length || 0,
      documentId: match.metadata?.documentId,
      chunkIndex: match.metadata?.chunkIndex,
      totalChunks: match.metadata?.totalChunks,
      status: 'success'
    })) || [];

    // Group by URL to avoid duplicates, but keep the most recent data
    const uniqueUrls = new Map();
    scrapedData.forEach(item => {
      if (item.url) {
        // If we haven't seen this URL before, or if this is a newer scrape, use this data
        if (!uniqueUrls.has(item.url) || 
            new Date(item.scrapedAt) > new Date(uniqueUrls.get(item.url).scrapedAt)) {
          uniqueUrls.set(item.url, {
            url: item.url,
            title: item.title,
            description: item.description,
            scrapedAt: item.scrapedAt,
            contentLength: item.contentLength,
            status: 'success',
            vectorId: item.vectorId,
            documentId: item.documentId,
            chunkIndex: item.chunkIndex,
            totalChunks: item.totalChunks
          });
        }
      }
    });

    const uniqueScrapedData = Array.from(uniqueUrls.values());

    return NextResponse.json({
      success: true,
      data: {
        totalUrls: uniqueScrapedData.length,
        scrapedUrls: uniqueScrapedData,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching scraped data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scraped data: ' + error.message },
      { status: 500 }
    );
  }
}
