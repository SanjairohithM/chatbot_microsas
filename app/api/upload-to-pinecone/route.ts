import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { DocumentProcessorService } from '@/lib/services/document-processor.service'
import { PineconeDocumentService } from '@/lib/services/pinecone-document.service'

export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null
  
  try {
    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File
    const botId = data.get('botId') as string

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 })
    }

    if (!botId) {
      return NextResponse.json({ success: false, error: 'Bot ID is required' }, { status: 400 })
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'File too large (max 10MB)' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/markdown']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Invalid file type' }, { status: 400 })
    }

    console.log(`[Upload to Pinecone] 🚀 Processing document directly to Pinecone for bot ${botId}`)
    console.log(`[Upload to Pinecone] 📄 File: ${file.name} (${file.size} bytes)`)
    console.log(`[Upload to Pinecone] 📄 File type: ${file.type}`)

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename and document ID
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const filename = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    
    console.log(`[Upload to Pinecone] 📁 Generated filename: ${filename}`)
    console.log(`[Upload to Pinecone] 🆔 Document ID: ${timestamp}`)
    
    // Create temporary file for processing
    const tempDir = join(process.cwd(), 'temp-uploads')
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true })
      console.log(`[Upload to Pinecone] 📁 Created temp directory: ${tempDir}`)
    }
    
    tempFilePath = join(tempDir, filename)
    await writeFile(tempFilePath, buffer)
    console.log(`[Upload to Pinecone] 💾 Temporary file created: ${tempFilePath}`)
    
    // Process document content
    console.log(`[Upload to Pinecone] 🔄 Processing document content...`)
    const startTime = Date.now()
    const processed = await DocumentProcessorService.processDocument(
      tempFilePath,
      file.name,
      fileExtension || 'txt'
    )
    const processingTime = Date.now() - startTime
    
    console.log(`[Upload to Pinecone] ✅ Document processed in ${processingTime}ms`)
    console.log(`[Upload to Pinecone] 📝 Content length: ${processed.content.length} characters`)
    console.log(`[Upload to Pinecone] 📊 Word count: ${processed.metadata.wordCount} words`)
    console.log(`[Upload to Pinecone] 📊 Character count: ${processed.metadata.characterCount} characters`)
    
    // Store directly in Pinecone
    const documentId = timestamp // Use timestamp as unique ID
    console.log(`[Upload to Pinecone] 🌲 Storing in Pinecone vector database...`)
    const pineconeStartTime = Date.now()
    
    await PineconeDocumentService.storeDocument(
      parseInt(botId),
      documentId,
      file.name,
      processed.content
    )
    
    const pineconeTime = Date.now() - pineconeStartTime
    console.log(`[Upload to Pinecone] ✅ Document stored in Pinecone in ${pineconeTime}ms`)
    console.log(`[Upload to Pinecone] 🎯 Total processing time: ${Date.now() - startTime}ms`)
    
    // Clean up temp file
    console.log(`[Upload to Pinecone] 🧹 Cleaning up temporary file: ${tempFilePath}`)
    await unlink(tempFilePath)
    console.log(`[Upload to Pinecone] ✅ Temporary file deleted successfully`)
    tempFilePath = null
    
    return NextResponse.json({
      success: true,
      message: 'Document uploaded and stored in Pinecone successfully',
      data: {
        documentId,
        filename: file.name,
        fileSize: file.size,
        fileType: file.type,
        botId: parseInt(botId),
        contentLength: processed.content.length,
        wordCount: processed.metadata.wordCount,
        characterCount: processed.metadata.characterCount,
        pineconeStored: true,
        localFileStored: false,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('[Upload to Pinecone] Error:', error)
    
    // Clean up temp file on error
    if (tempFilePath && existsSync(tempFilePath)) {
      try {
        await unlink(tempFilePath)
      } catch (cleanupError) {
        console.error('[Upload to Pinecone] Failed to clean up temp file:', cleanupError)
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to upload document to Pinecone',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
