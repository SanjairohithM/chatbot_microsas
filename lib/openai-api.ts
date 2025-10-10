import OpenAI from 'openai'
import { db } from '@/lib/db'

export type OpenAIChatRole = 'system' | 'user' | 'assistant'

export interface OpenAIMessage {
	role: OpenAIChatRole
	content: string | Array<
		| { type: 'text'; text: string }
		| { type: 'image_url'; image_url: { url: string; detail?: 'low' | 'high' } }
	>
}

export interface OpenAIChatOptions {
	model?: string
	temperature?: number
	max_tokens?: number
}

export interface OpenAIChatResult {
	model: string
	message: string
	usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
	finish_reason?: string
}

export class OpenAIAPI {
	private client: OpenAI

	constructor(apiKey?: string) {
		this.client = new OpenAI({ 
			apiKey: apiKey || process.env.OPENAI_API_KEY
		})
	}

	/**
	 * Create a new OpenAIAPI instance with user's API key
	 */
	static async createForUser(userId: string): Promise<OpenAIAPI> {
		const user = await db.user.findUnique({
			where: { id: userId },
			select: { openai_api_key: true }
		})
		
		return new OpenAIAPI(user?.openai_api_key || undefined)
	}

	/**
	 * Create a new OpenAIAPI instance with bot's user API key
	 */
	static async createForBot(botId: number): Promise<OpenAIAPI> {
		const bot = await db.bot.findUnique({
			where: { id: botId },
			select: { 
				user_id: true,
				user: {
					select: { openai_api_key: true }
				}
			}
		})
		
		return new OpenAIAPI(bot?.user?.openai_api_key || undefined)
	}

	async generateChat(
		messages: OpenAIMessage[],
		options: OpenAIChatOptions = {}
	): Promise<OpenAIChatResult> {
		const resp = await this.client.chat.completions.create({
			model: options.model || 'gpt-4o-mini',
			messages: messages as any,
			temperature: options.temperature ?? 0.7,
			max_tokens: options.max_tokens ?? 1000
		})

		const choice = resp.choices?.[0]
		return {
			model: resp.model || (options.model || 'gpt-4o-mini'),
			message: choice?.message?.content || '',
			usage: {
				prompt_tokens: (resp as any).usage?.prompt_tokens,
				completion_tokens: (resp as any).usage?.completion_tokens,
				total_tokens: (resp as any).usage?.total_tokens
			},
			finish_reason: choice?.finish_reason
		}
	}

	async generateChatStream(
		messages: OpenAIMessage[],
		options: OpenAIChatOptions = {}
	): Promise<AsyncIterable<any> & { usage?: any; model?: string; finish_reason?: string }> {
		const stream = await this.client.chat.completions.create({
			model: options.model || 'gpt-4o-mini',
			messages: messages as any,
			temperature: options.temperature ?? 0.7,
			max_tokens: options.max_tokens ?? 1000,
			stream: true
		})

		return stream as any
	}

	async createEmbedding(text: string, model: string = 'text-embedding-3-small'): Promise<number[]> {
		const res = await this.client.embeddings.create({
			model,
			input: text
		})
		return res.data?.[0]?.embedding || []
	}

	// Text-to-Speech: returns audio bytes (mp3)
	async synthesizeSpeech(
		text: string,
		options?: { model?: string; voice?: string; format?: 'mp3' | 'wav' | 'opus' }
	): Promise<Uint8Array> {
		const resp = await this.client.audio.speech.create({
			model: options?.model || 'tts-1',
			voice: options?.voice || 'alloy',
			input: text,
			response_format: options?.format || 'mp3'
		})
		const arrayBuffer = await resp.arrayBuffer()
		return new Uint8Array(arrayBuffer)
	}

	// Speech-to-Text: accepts File or Blob (Node: Buffer) and returns transcript string
	async transcribeAudio(
		file: File | Blob,
		options?: { model?: string }
	): Promise<string> {
		const resp = await this.client.audio.transcriptions.create({
			file,
			model: options?.model || 'whisper-1'
		})
		return (resp as any).text || (resp as any).results?.[0]?.text || ''
	}
}

// Helper function to get OpenAI instance with user-based API key
export async function getOpenAIInstance(userId?: string, botId?: number): Promise<OpenAIAPI> {
	if (userId) {
		return await OpenAIAPI.createForUser(userId)
	}
	if (botId) {
		return await OpenAIAPI.createForBot(botId)
	}
	// If no user or bot ID provided, throw an error to ensure API key is always provided
	throw new Error('User ID or Bot ID must be provided to create OpenAI instance')
}


