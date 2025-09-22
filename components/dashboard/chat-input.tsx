"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Square } from "lucide-react"

interface ChatInputProps {
  onSendMessage: (message: string) => void
  isLoading: boolean
  onStop?: () => void
  disabled?: boolean
}

export function ChatInput({ onSendMessage, isLoading, onStop, disabled }: ChatInputProps) {
  const [message, setMessage] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !isLoading && !disabled) {
      onSendMessage(message.trim())
      setMessage("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t border-border bg-background">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={disabled ? "Select a bot to start chatting..." : "Type your message..."}
        className="min-h-[44px] max-h-32 resize-none"
        disabled={disabled || isLoading}
        rows={1}
      />

      {isLoading ? (
        <Button type="button" onClick={onStop} variant="outline" size="sm" className="px-3 bg-transparent">
          <Square className="h-4 w-4" />
        </Button>
      ) : (
        <Button type="submit" disabled={!message.trim() || disabled} size="sm" className="px-3">
          <Send className="h-4 w-4" />
        </Button>
      )}
    </form>
  )
}
