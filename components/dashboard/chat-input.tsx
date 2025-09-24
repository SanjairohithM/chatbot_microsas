"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Square, Image, X } from "lucide-react"

interface ChatInputProps {
  onSendMessage: (message: string, imageUrl?: string) => void
  isLoading: boolean
  onStop?: () => void
  disabled?: boolean
}

export function ChatInput({ onSendMessage, isLoading, onStop, disabled }: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if ((message.trim() || selectedImage) && !isLoading && !disabled) {
      onSendMessage(message.trim(), selectedImage || undefined)
      setMessage("")
      setSelectedImage(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      alert('File size must be less than 10MB')
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        setSelectedImage(result.imageUrl)
      } else {
        alert(result.error || 'Failed to upload image')
      }
    } catch (error) {
      console.error('Image upload error:', error)
      alert('Failed to upload image')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
  }

  return (
    <div className="border-t border-border bg-background">
      {/* Image Preview */}
      {selectedImage && (
        <div className="p-4 border-b border-border">
          <div className="relative inline-block">
            <img 
              src={selectedImage} 
              alt="Selected" 
              className="max-w-xs max-h-32 rounded-lg object-cover"
            />
            <Button
              type="button"
              onClick={removeImage}
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 p-4">
        <div className="flex-1 flex flex-col gap-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? "Select a bot to start chatting..." : "Type your message..."}
            className="min-h-[44px] max-h-32 resize-none"
            disabled={disabled || isLoading || isUploading}
            rows={1}
          />
        </div>

        <div className="flex flex-col gap-2">
          {/* Image Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            disabled={disabled || isLoading || isUploading}
          />
          
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            size="sm"
            className="px-3"
            disabled={disabled || isLoading || isUploading}
          >
            {isUploading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            ) : (
              <Image className="h-4 w-4" />
            )}
          </Button>

          {/* Send Button */}
          {isLoading ? (
            <Button type="button" onClick={onStop} variant="outline" size="sm" className="px-3 bg-transparent">
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button 
              type="submit" 
              disabled={(!message.trim() && !selectedImage) || disabled || isUploading} 
              size="sm" 
              className="px-3"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
