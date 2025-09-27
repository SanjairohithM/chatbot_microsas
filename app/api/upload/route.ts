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
    const processDirectly = data.get('processDirectly') === 'true'

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 })
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

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const filename = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    
    // If processDirectly is true and botId is provided, process directly to Pinecone
    if (processDirectly && botId) {
      console.log(`[Upload API] 🚀 Processing document directly to Pinecone for bot ${botId}`)
      
      try {
        // Create temporary file for processing
        const tempDir = join(process.cwd(), 'temp-uploads')
        if (!existsSync(tempDir)) {
          await mkdir(tempDir, { recursive: true })
        }
        
        tempFilePath = join(tempDir, filename)
        await writeFile(tempFilePath, buffer)
        
        // Process document content
        const processed = await DocumentProcessorService.processDocument(
          tempFilePath,
          file.name,
          fileExtension || 'txt'
        )
        
        console.log(`[Upload API] ✅ Document processed: ${processed.content.length} characters`)
        
        // Store directly in Pinecone (no database record needed for direct processing)
        const documentId = timestamp // Use timestamp as unique ID
        await PineconeDocumentService.storeDocument(
          parseInt(botId),
          documentId,
          file.name,
          processed.content
        )
        
        console.log(`[Upload API] ✅ Document stored in Pinecone successfully`)
        
        // Clean up temp file
        await unlink(tempFilePath)
        tempFilePath = null
        
        return NextResponse.json({
          success: true,
          data: {
            filename,
            fileSize: file.size,
            fileType: file.type,
            originalName: file.name,
            documentId,
            processedDirectly: true,
            pineconeStored: true,
            contentLength: processed.content.length,
            wordCount: processed.metadata.wordCount
          }
        })
        
      } catch (processingError) {
        console.error('[Upload API] Direct processing failed:', processingError)
        
        // Clean up temp file on error
        if (tempFilePath && existsSync(tempFilePath)) {
          try {
            await unlink(tempFilePath)
          } catch (cleanupError) {
            console.error('[Upload API] Failed to clean up temp file:', cleanupError)
          }
        }
        
        // Fall back to regular upload
        console.log('[Upload API] Falling back to regular upload flow')
      }
    }

    // Regular upload flow (for backward compatibility or when direct processing fails)
    const uploadsDir = join(process.cwd(), 'secure-uploads')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    const filepath = join(uploadsDir, filename)
    await writeFile(filepath, buffer)

    // Return secure file URL (not directly accessible)
    const fileUrl = `/api/secure-file/${filename}`

    return NextResponse.json({
      success: true,
      data: {
        filename,
        fileUrl,
        fileSize: file.size,
        fileType: file.type,
        originalName: file.name,
        processedDirectly: false,
        requiresProcessing: true
      }
    })

  } catch (error) {
    console.error('Upload error:', error)
    
    // Clean up temp file on error
    if (tempFilePath && existsSync(tempFilePath)) {
      try {
        await unlink(tempFilePath)
      } catch (cleanupError) {
        console.error('[Upload API] Failed to clean up temp file:', cleanupError)
      }
    }
    
    return NextResponse.json(
      { success: false, error: 'Upload failed' },
      { status: 500 }
    )
  }
}
