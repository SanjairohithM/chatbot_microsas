"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Bot, User, Volume2 } from "lucide-react"
import type { Message } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ChatMessageProps {
  message: Message
  isLast?: boolean
}

export function ChatMessage({ message, isLast }: ChatMessageProps) {
  const isUser = message.role === "user"
  const isSystem = message.role === "system"

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <Badge variant="outline" className="text-xs">
          {message.content}
        </Badge>
      </div>
    )
  }

  return (
    <div className={cn("flex gap-4 mb-6", isUser && "flex-row-reverse")}>
      <Avatar className="h-10 w-10">
        <AvatarFallback className={cn(
          isUser ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-200"
        )}>
          {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
        </AvatarFallback>
      </Avatar>

      <div className={cn("flex flex-col max-w-[80%]", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm shadow-sm",
            isUser 
              ? "bg-blue-600 text-white" 
              : "bg-white text-gray-900 border border-gray-200"
          )}
        >
          {message.image_url && (
            <div className="mb-3">
              <img 
                src={message.image_url} 
                alt="Uploaded image" 
                className="max-w-xs max-h-48 rounded-lg object-cover"
              />
            </div>
          )}
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          {message.image_analysis && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs">
              <strong>Image Analysis:</strong> {message.image_analysis}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
          <span>{new Date(message.created_at).toLocaleTimeString()}</span>
          {message.tokens_used && <span>• {message.tokens_used} tokens</span>}
          {message.response_time_ms && <span>• {message.response_time_ms}ms</span>}
          {!isUser && message.content && (
            <button
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors"
              onClick={async () => {
                try {
                  const res = await fetch('/api/audio/tts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: message.content })
                  })
                  if (!res.ok) return
                  const blob = await res.blob()
                  const url = URL.createObjectURL(blob)
                  const audio = new Audio(url)
                  audio.play()
                } catch (e) {
                  console.error('TTS playback failed:', e)
                }
              }}
              title="Play voice"
            >
              <Volume2 className="h-3 w-3" />
              <span>Listen</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
