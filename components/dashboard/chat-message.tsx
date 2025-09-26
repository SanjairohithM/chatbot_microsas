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
    <div className={cn("flex gap-3 mb-4", isUser && "flex-row-reverse")}>
      <Avatar className="h-8 w-8 mt-1">
        <AvatarFallback className={cn(isUser ? "bg-accent text-accent-foreground" : "bg-muted")}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      <div className={cn("flex flex-col max-w-[80%]", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-lg px-4 py-2 text-sm",
            isUser ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground border border-border",
          )}
        >
          {message.image_url && (
            <div className="mb-2">
              <img 
                src={message.image_url} 
                alt="Uploaded image" 
                className="max-w-xs max-h-48 rounded-lg object-cover"
              />
            </div>
          )}
          <p className="whitespace-pre-wrap">{message.content}</p>
          {!isUser && message.content && (
            <div className="mt-2 flex justify-end">
              <button
                className="inline-flex items-center gap-1 text-xs opacity-70 hover:opacity-100"
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
            </div>
          )}
          {message.image_analysis && (
            <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
              <strong>Image Analysis:</strong> {message.image_analysis}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <span>{new Date(message.created_at).toLocaleTimeString()}</span>
          {message.tokens_used && <span>• {message.tokens_used} tokens</span>}
          {message.response_time_ms && <span>• {message.response_time_ms}ms</span>}
        </div>
      </div>
    </div>
  )
}
