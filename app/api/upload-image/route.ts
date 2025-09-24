import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json({ success: false, error: 'No image file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ success: false, error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ success: false, error: 'File size must be less than 10MB' }, { status: 400 })
    }

    logger.apiRequest('POST', '/api/upload-image', null)

    const startTime = Date.now()

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'images')
    await mkdir(uploadsDir, { recursive: true })

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const filename = `${timestamp}_${Math.random().toString(36).substring(2)}.${fileExtension}`
    const filepath = join(uploadsDir, filename)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    const responseTime = Date.now() - startTime
    const imageUrl = `/uploads/images/${filename}`

    logger.apiResponse('POST', '/api/upload-image', 200, responseTime)

    return NextResponse.json({
      success: true,
      imageUrl,
      filename,
      size: file.size,
      type: file.type
    })

  } catch (error) {
    logger.apiError('POST', '/api/upload-image', error as Error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Image upload failed'
    }, { status: 500 })
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
