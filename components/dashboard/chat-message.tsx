"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Bot, User, Volume2, VolumeX, MessageCircle, UserCircle } from "lucide-react"
import type { Message } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useState, useRef } from "react"

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
    <div className={cn("flex gap-2 mb-1", isUser && "flex-row-reverse")}>
      {/* Avatar - only show for AI messages */}
      {!isUser && (
        <div className="flex-shrink-0 self-end mb-1">
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
            <Bot className="h-4 w-4 text-gray-600" />
          </div>
        </div>
      )}

      <div className={cn("flex flex-col max-w-[85%]", isUser && "items-end")}>
        {/* Message bubble */}
        <div
          className={cn(
            "relative px-3 py-2 text-sm leading-relaxed shadow-sm",
            isUser 
              ? "bg-[#DCF8C6] text-black rounded-2xl rounded-br-sm" 
              : "bg-white text-black rounded-2xl rounded-bl-sm border border-gray-200"
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
          
          {message.image_analysis && (
            <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
              <strong>Image Analysis:</strong> {message.image_analysis}
            </div>
          )}

          {/* WhatsApp-style message tail */}
          <div className={cn(
            "absolute bottom-0 w-0 h-0",
            isUser 
              ? "right-[-8px] border-l-[8px] border-l-[#DCF8C6] border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent"
              : "left-[-8px] border-r-[8px] border-r-white border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent"
          )} />
        </div>

        {/* Message time and status - WhatsApp style */}
        <div className={cn(
          "flex items-center gap-1 mt-1 text-xs text-gray-500",
          isUser ? "justify-end" : "justify-start"
        )}>
          <span>{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {isUser && <span>✓✓</span>}
          {message.tokens_used && <span>• {message.tokens_used}</span>}
          {message.response_time_ms && <span>• {message.response_time_ms}ms</span>}
          {!isUser && message.content && (
            <VoicePlayButton text={message.content} />
          )}
        </div>
      </div>
    </div>
  )
}

interface VoicePlayButtonProps {
  text: string
}

function VoicePlayButton({ text }: VoicePlayButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const handlePlay = async () => {
    if (isPlaying) {
      // Stop playing
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      setIsPlaying(false)
      return
    }

    try {
      setIsLoading(true)
      
      const res = await fetch('/api/audio/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text,
          voice: 'alloy',
          model: 'tts-1',
          format: 'mp3'
        })
      })
      
      if (!res.ok) {
        throw new Error('TTS request failed')
      }
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio
      
      audio.onended = () => {
        setIsPlaying(false)
        URL.revokeObjectURL(url)
        audioRef.current = null
      }
      
      audio.onerror = () => {
        setIsPlaying(false)
        setIsLoading(false)
        URL.revokeObjectURL(url)
        audioRef.current = null
      }
      
      await audio.play()
      setIsPlaying(true)
      
    } catch (e) {
      console.error('TTS playback failed:', e)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      className="ml-1 text-gray-400 hover:text-gray-600 transition-colors"
      onClick={handlePlay}
      disabled={isLoading}
      title={isPlaying ? "Stop speaking" : "Play voice"}
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
      ) : isPlaying ? (
        <VolumeX className="h-3 w-3" />
      ) : (
        <Volume2 className="h-3 w-3" />
      )}
    </button>
  )
}
