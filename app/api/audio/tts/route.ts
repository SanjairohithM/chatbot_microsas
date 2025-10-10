import { NextRequest, NextResponse } from 'next/server'
import { getOpenAIInstance } from '@/lib/openai-api'

export async function POST(request: NextRequest) {
	try {
		const { text, voice, model, format, userId, botId } = await request.json()
		if (!text || typeof text !== 'string') {
			return NextResponse.json({ error: 'text is required' }, { status: 400 })
		}
		if (!userId && !botId) {
			return NextResponse.json({ error: 'userId or botId is required' }, { status: 400 })
		}
		const openAI = await getOpenAIInstance(userId, botId)
		const audio = await openAI.synthesizeSpeech(text, { voice, model, format })
		return new NextResponse(Buffer.from(audio), {
			status: 200,
			headers: {
				'Content-Type': `audio/${format || 'mp3'}`,
				'Cache-Control': 'no-store'
			}
		})
	} catch (error: any) {
		return NextResponse.json({ error: error.message || 'TTS failed' }, { status: 500 })
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


