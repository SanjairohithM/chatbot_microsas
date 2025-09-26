"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Square, Image, X, Mic, MicOff } from "lucide-react"

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
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessingVoice, setIsProcessingVoice] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])

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

  const startRecording = async () => {
    setVoiceError(null) // Clear any previous errors
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      recordedChunksRef.current = []
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunksRef.current.push(event.data)
      }

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event)
        setVoiceError('Recording error occurred. Please try again.')
        setIsRecording(false)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' })
        
        // Check if we have any audio data
        if (blob.size === 0) {
          setVoiceError('No audio recorded. Please try again.')
          stream.getTracks().forEach(track => track.stop())
          return
        }
        
        setIsProcessingVoice(true)
        
        try {
          const form = new FormData()
          const file = new File([blob], 'audio.webm', { type: 'audio/webm' })
          form.append('file', file)
          
          const res = await fetch('/api/audio/stt', { 
            method: 'POST', 
            body: form,
            signal: AbortSignal.timeout(30000) // 30 second timeout
          })
          
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}))
            throw new Error(errorData.error || `Server error: ${res.status}`)
          }
          
          const json = await res.json()
          
          if (json.text) {
            const transcribedText = json.text.trim()
            if (transcribedText) {
              // Auto-send the transcribed message
              onSendMessage(transcribedText, selectedImage || undefined)
              setMessage("")
              setSelectedImage(null)
              setVoiceError(null) // Clear error on success
            } else {
              setVoiceError('No speech detected. Please try speaking more clearly.')
            }
          } else {
            setVoiceError('No transcription received. Please try again.')
          }
        } catch (err: any) {
          console.error('STT failed:', err)
          if (err.name === 'AbortError') {
            setVoiceError('Request timed out. Please try again.')
          } else if (err.message.includes('Failed to fetch')) {
            setVoiceError('Network error. Please check your connection.')
          } else {
            setVoiceError(err.message || 'Failed to process voice recording.')
          }
        } finally {
          setIsProcessingVoice(false)
        }
        
        // Clean up stream
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err: any) {
      console.error('Microphone access error:', err)
      if (err.name === 'NotAllowedError') {
        setVoiceError('Microphone access denied. Please allow microphone permissions.')
      } else if (err.name === 'NotFoundError') {
        setVoiceError('No microphone found. Please connect a microphone.')
      } else if (err.name === 'NotSupportedError') {
        setVoiceError('Voice recording is not supported in this browser.')
      } else {
        setVoiceError('Failed to access microphone. Please try again.')
      }
    }
  }

  const stopRecording = () => {
    const mr = mediaRecorderRef.current
    if (mr && mr.state !== 'inactive') {
      try {
        mr.stop()
        // Clean up the stream
        if (mr.stream) {
          mr.stream.getTracks().forEach((track) => track.stop())
        }
      } catch (err) {
        console.error('Error stopping recording:', err)
        setVoiceError('Error stopping recording. Please try again.')
      }
    }
    setIsRecording(false)
  }

  return (
    <div className="border-t border-border bg-background">
      {/* Recording Indicator */}
      {isRecording && (
        <div className="p-2 border-b border-border bg-red-50 dark:bg-red-950/20">
          <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Recording... Click the microphone to stop</span>
          </div>
        </div>
      )}

      {/* Processing Indicator */}
      {isProcessingVoice && (
        <div className="p-2 border-b border-border bg-blue-50 dark:bg-blue-950/20">
          <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm font-medium">Processing your voice...</span>
          </div>
        </div>
      )}

      {/* Error Indicator */}
      {voiceError && (
        <div className="p-2 border-b border-border bg-red-50 dark:bg-red-950/20">
          <div className="flex items-center justify-between gap-2 text-red-600 dark:text-red-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium">{voiceError}</span>
            </div>
            <Button
              type="button"
              onClick={() => setVoiceError(null)}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

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
            placeholder={
              disabled 
                ? "Select a bot to start chatting..." 
                : isProcessingVoice 
                  ? "Processing voice..." 
                  : "Type your message..."
            }
            className="min-h-[44px] max-h-32 resize-none"
            disabled={disabled || isLoading || isUploading || isProcessingVoice}
            rows={1}
          />
        </div>

        <div className="flex flex-col gap-2">
          {/* Voice (STT) Button */}
          <Button
            type="button"
            onClick={() => (isRecording ? stopRecording() : startRecording())}
            variant={isRecording ? "destructive" : "outline"}
            size="sm"
            className={`px-3 transition-all duration-200 ${
              isRecording ? 'animate-pulse shadow-lg' : ''
            }`}
            disabled={disabled || isLoading || isUploading || isProcessingVoice}
            title={
              isProcessingVoice 
                ? "Processing voice..." 
                : isRecording 
                  ? "Click to stop recording" 
                  : "Click to start voice recording"
            }
          >
            {isProcessingVoice ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            ) : isRecording ? (
              <MicOff className="h-4 w-4 text-white" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>

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
