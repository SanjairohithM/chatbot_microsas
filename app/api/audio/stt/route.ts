import { NextRequest, NextResponse } from 'next/server'
import { openAIAPI } from '@/lib/openai-api'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
	try {
		const contentType = request.headers.get('content-type') || ''
		if (contentType.includes('multipart/form-data')) {
			const form = await request.formData()
			const file = form.get('file') as File | null
			if (!file) return NextResponse.json({ error: 'file is required' }, { status: 400 })
			const text = await openAIAPI.transcribeAudio(file)
			return NextResponse.json({ text })
		}
		const arrayBuffer = await request.arrayBuffer()
		const blob = new Blob([arrayBuffer])
		const text = await openAIAPI.transcribeAudio(blob)
		return NextResponse.json({ text })
	} catch (error: any) {
		return NextResponse.json({ error: error.message || 'STT failed' }, { status: 500 })
	}
}

export async function OPTIONS() {
	return new NextResponse(null, {
		status: 200,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization'
		}
	})
}


