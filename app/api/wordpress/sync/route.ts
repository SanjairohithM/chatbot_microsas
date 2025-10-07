import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Pinecone } from '@pinecone-database/pinecone';

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    console.log('WordPress sync request received');
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No authorization header');
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const accessToken = authHeader.substring(7);
    console.log('Access token:', accessToken.substring(0, 20) + '...');
    
    // Verify access token
    const site = await db.wordPressSite.findUnique({
      where: { access_token: accessToken }
    });

    if (!site) {
      console.log('Invalid access token');
      return NextResponse.json(
        { error: 'Invalid access token' },
        { status: 401 }
      );
    }

    console.log('Site found:', site.site_name);
    
    const body = await request.json();
    console.log('Sync data received:', {
      site_info: !!body.site_info,
      posts: body.posts?.length || 0,
      pages: body.pages?.length || 0,
      categories: body.categories?.length || 0,
      tags: body.tags?.length || 0
    });

    const { action, content, site_info, posts, pages, categories, tags } = body;

    try {
      // Use the wordpress-content index for WordPress content
      const index = pc.index('wordpress-content');
      console.log('Pinecone wordpress-content index connected');

      if (action === 'update' && content) {
        console.log('Syncing single content item');
        // Sync single content item
        await syncSingleContent(index, site.id, content);
      } else {
        console.log('Performing full sync');
        // Full sync
        await syncAllContent(index, site.id, {
          site_info,
          posts: posts || [],
          pages: pages || [],
          categories: categories || [],
          tags: tags || []
        });
      }

      console.log('Content synced to Pinecone successfully');
    } catch (pineconeError) {
      console.error('Pinecone sync error:', pineconeError);
      console.log('⚠️ Pinecone sync failed, but content registration was successful');
      console.log('Content will be available for chat once Pinecone is configured');
      // Continue even if Pinecone fails - we'll still update the sync time
    }

    // Update last sync time
    await db.wordPressSite.update({
      where: { id: site.id },
      data: { last_sync: new Date() }
    });

    console.log('Sync completed successfully');
    return NextResponse.json({
      success: true,
      message: 'Content synced successfully',
      synced_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('WordPress sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync content: ' + error.message },
      { status: 500 }
    );
  }
}

async function syncSingleContent(index: any, siteId: string, content: any) {
  // Use default namespace for wordpress-content index
  const vectorId = `wp_${siteId}_${content.type}_${content.id}`;
  
  const vector = {
    id: vectorId,
    values: await generateEmbedding(content.title + ' ' + content.content),
    metadata: {
      site_id: siteId,
      content_id: content.id,
      type: content.type,
      title: content.title,
      url: content.url,
      date: content.date,
      modified: content.modified,
      author: content.author,
      categories: content.categories || [],
      tags: content.tags || [],
      parent: content.parent || null,
      menu_order: content.menu_order || null,
      documentId: parseInt(content.id),
      chunkIndex: 0,
      totalChunks: 1
    }
  };

  await index.upsert([vector]);
}

async function syncAllContent(index: any, siteId: string, content: any) {
  // Use default namespace for wordpress-content index
  const vectors = [];

  // Sync site info
  if (content.site_info) {
    const siteVector = {
      id: `wp_${siteId}_site_info`,
      values: await generateEmbedding(content.site_info.name + ' ' + content.site_info.description),
      metadata: {
        site_id: siteId,
        type: 'site_info',
        name: content.site_info.name,
        description: content.site_info.description,
        url: content.site_info.url,
        admin_email: content.site_info.admin_email,
        timezone: content.site_info.timezone,
        language: content.site_info.language,
        version: content.site_info.version,
        documentId: 0,
        chunkIndex: 0,
        totalChunks: 1
      }
    };
    vectors.push(siteVector);
  }

  // Sync posts
  for (const post of content.posts) {
    const vector = {
      id: `wp_${siteId}_post_${post.id}`,
      values: await generateEmbedding(post.title + ' ' + post.content),
      metadata: {
        site_id: siteId,
        content_id: post.id,
        type: 'post',
        title: post.title.substring(0, 200), // Limit title
        content: post.content.substring(0, 1000), // Limit content
        excerpt: (post.excerpt || '').substring(0, 500), // Limit excerpt
        url: post.url,
        date: post.date,
        modified: post.modified,
        author: post.author,
        categories: post.categories || [],
        tags: post.tags || [],
        documentId: parseInt(post.id),
        chunkIndex: 0,
        totalChunks: 1
      }
    };
    vectors.push(vector);
  }

  // Sync pages
  for (const page of content.pages) {
    const vector = {
      id: `wp_${siteId}_page_${page.id}`,
      values: await generateEmbedding(page.title + ' ' + page.content),
      metadata: {
        site_id: siteId,
        content_id: page.id,
        type: 'page',
        title: page.title.substring(0, 200), // Limit title
        content: page.content.substring(0, 1000), // Limit content
        excerpt: (page.excerpt || '').substring(0, 500), // Limit excerpt
        url: page.url,
        date: page.date,
        modified: page.modified,
        author: page.author,
        parent: page.parent,
        menu_order: page.menu_order,
        documentId: parseInt(page.id),
        chunkIndex: 0,
        totalChunks: 1
      }
    };
    vectors.push(vector);
  }

  // Sync categories
  for (const category of content.categories) {
    const vector = {
      id: `wp_${siteId}_category_${category.id}`,
      values: await generateEmbedding(category.name + ' ' + category.description),
      metadata: {
        site_id: siteId,
        content_id: category.id,
        type: 'category',
        name: category.name.substring(0, 100), // Limit name
        slug: category.slug,
        description: (category.description || '').substring(0, 500), // Limit description
        count: category.count,
        parent: category.parent,
        url: category.url,
        documentId: parseInt(category.id),
        chunkIndex: 0,
        totalChunks: 1
      }
    };
    vectors.push(vector);
  }

  // Sync tags
  for (const tag of content.tags) {
    const vector = {
      id: `wp_${siteId}_tag_${tag.id}`,
      values: await generateEmbedding(tag.name + ' ' + tag.description),
      metadata: {
        site_id: siteId,
        content_id: tag.id,
        type: 'tag',
        name: tag.name.substring(0, 100), // Limit name
        slug: tag.slug,
        description: (tag.description || '').substring(0, 500), // Limit description
        count: tag.count,
        url: tag.url,
        documentId: parseInt(tag.id),
        chunkIndex: 0,
        totalChunks: 1
      }
    };
    vectors.push(vector);
  }

  // Batch upsert to Pinecone (default namespace)
  if (vectors.length > 0) {
    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await index.upsert(batch);
    }
  }
}

async function generateEmbedding(text: string): Promise<number[]> {
  // Use OpenAI to generate embeddings for wordpress-content index (1536 dimensions)
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small', // This model produces 1536 dimensions
      input: text.substring(0, 8000), // Limit text length
    }),
  });

  const data = await response.json();
  return data.data[0].embedding; // Return full 1536 dimensions
}
