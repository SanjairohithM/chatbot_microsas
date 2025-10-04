"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Square, Image, X, Mic, MicOff, Volume2, VolumeX, MessageCircle } from "lucide-react"
import { useVoiceChat } from "@/hooks/use-voice-chat"
import { cn } from "@/lib/utils"

interface VoiceChatInputProps {
  onSendMessage: (message: string, imageUrl?: string) => void
  isLoading: boolean
  onStop?: () => void
  disabled?: boolean
  botId?: number
  conversationId?: number
  enableVoiceMode?: boolean
  onVoiceModeToggle?: (enabled: boolean) => void
}

export function VoiceChatInput({ 
  onSendMessage, 
  isLoading, 
  onStop, 
  disabled,
  botId = 1,
  conversationId,
  enableVoiceMode = false,
  onVoiceModeToggle
}: VoiceChatInputProps) {
  const [message, setMessage] = useState("")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [voiceMode, setVoiceMode] = useState(enableVoiceMode)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    isRecording,
    isProcessing,
    isSpeaking,
    error: voiceError,
    lastTranscription,
    lastResponse,
    startRecording,
    stopRecording,
    speak,
    processVoiceMessage,
    stopSpeaking,
    clearError,
    reset
  } = useVoiceChat({
    onTranscription: (text) => {
      setMessage(text)
    },
    onResponse: (text) => {
      // Response is automatically spoken by the hook
    },
    onError: (error) => {
      console.error('Voice chat error:', error)
    },
    onStartRecording: () => {
      console.log('Started recording')
    },
    onStopRecording: () => {
      console.log('Stopped recording')
    },
    onStartSpeaking: () => {
      console.log('Started speaking')
    },
    onStopSpeaking: () => {
      console.log('Stopped speaking')
    },
    autoSend: voiceMode,
    voice: 'alloy',
    model: 'tts-1'
  })

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

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

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

  const toggleVoiceMode = () => {
    const newVoiceMode = !voiceMode
    setVoiceMode(newVoiceMode)
    onVoiceModeToggle?.(newVoiceMode)
    
    if (!newVoiceMode) {
      reset()
    }
  }

  const handleVoiceAction = () => {
    if (isRecording) {
      stopRecording()
    } else if (isSpeaking) {
      stopSpeaking()
    } else {
      startRecording()
    }
  }

  const handleSpeakLastResponse = () => {
    if (lastResponse) {
      speak(lastResponse)
    }
  }

  const isVoiceActive = isRecording || isProcessing || isSpeaking
  const canUseVoice = !disabled && !isLoading && !isUploading

  return (
    <div className="border-t border-gray-200 bg-white">
      {/* Voice Mode Toggle */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              {voiceMode ? 'Voice Mode' : 'Text Mode'}
            </span>
          </div>
          <Button
            type="button"
            onClick={toggleVoiceMode}
            variant={voiceMode ? "default" : "outline"}
            size="sm"
            className="h-8"
          >
            {voiceMode ? 'Switch to Text' : 'Switch to Voice'}
          </Button>
        </div>
      </div>

      {/* Recording Indicator */}
      {isRecording && (
        <div className="p-3 border-b border-gray-200 bg-red-50">
          <div className="flex items-center justify-center gap-2 text-red-600">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Recording... Click the microphone to stop</span>
          </div>
        </div>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="p-3 border-b border-gray-200 bg-blue-50">
          <div className="flex items-center justify-center gap-2 text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm font-medium">
              {voiceMode ? 'Processing your voice...' : 'Processing...'}
            </span>
          </div>
        </div>
      )}

      {/* Speaking Indicator */}
      {isSpeaking && (
        <div className="p-3 border-b border-gray-200 bg-green-50">
          <div className="flex items-center justify-center gap-2 text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Speaking response...</span>
            <Button
              type="button"
              onClick={stopSpeaking}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
            >
              <VolumeX className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Error Indicator */}
      {voiceError && (
        <div className="p-3 border-b border-gray-200 bg-red-50">
          <div className="flex items-center justify-between gap-2 text-red-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium">{voiceError}</span>
            </div>
            <Button
              type="button"
              onClick={clearError}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Voice Mode Status */}
      {voiceMode && lastTranscription && (
        <div className="p-3 border-b border-gray-200 bg-blue-50">
          <div className="text-sm text-blue-700">
            <strong>You said:</strong> {lastTranscription}
          </div>
        </div>
      )}

      {voiceMode && lastResponse && (
        <div className="p-3 border-b border-gray-200 bg-green-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-green-700">
              <strong>Bot responded:</strong> {lastResponse.substring(0, 100)}
              {lastResponse.length > 100 ? '...' : ''}
            </div>
            <Button
              type="button"
              onClick={handleSpeakLastResponse}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
              disabled={isSpeaking}
            >
              <Volume2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Image Preview */}
      {selectedImage && (
        <div className="p-4 border-b border-gray-200">
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

      {/* Main Input Area */}
      <form onSubmit={handleSubmit} className="flex gap-3 p-4">
        <div className="flex-1">
          <div className="relative">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                disabled 
                  ? "Select a bot to start chatting..." 
                  : voiceMode
                    ? "Voice mode active - click microphone to speak..."
                    : isProcessing 
                      ? "Processing..." 
                      : "Type your message..."
              }
              className={cn(
                "min-h-[44px] max-h-32 resize-none border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-20",
                voiceMode && "bg-blue-50 border-blue-200"
              )}
              disabled={disabled || isLoading || isUploading || isProcessing || voiceMode}
              rows={1}
            />
            
            {/* Action buttons inside input */}
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              {/* Voice Button */}
              <Button
                type="button"
                onClick={handleVoiceAction}
                variant={isVoiceActive ? "destructive" : "ghost"}
                size="sm"
                className={cn(
                  "h-8 w-8 p-0 transition-all duration-200",
                  isRecording && "animate-pulse",
                  voiceMode && !isVoiceActive && "bg-blue-100 hover:bg-blue-200"
                )}
                disabled={!canUseVoice}
                title={
                  isSpeaking 
                    ? "Click to stop speaking" 
                    : isProcessing 
                      ? "Processing..." 
                      : isRecording 
                        ? "Click to stop recording" 
                        : "Click to start voice recording"
                }
              >
                {isSpeaking ? (
                  <VolumeX className="h-4 w-4" />
                ) : isProcessing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                ) : isRecording ? (
                  <MicOff className="h-4 w-4" />
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
                disabled={disabled || isLoading || isUploading || voiceMode}
              />
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={disabled || isLoading || isUploading || voiceMode}
              >
                {isUploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                ) : (
                  <Image className="h-4 w-4" />
                )}
              </Button>

              {/* Send Button */}
              {isLoading ? (
                <Button type="button" onClick={onStop} variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Square className="h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={(!message.trim() && !selectedImage) || disabled || isUploading || voiceMode} 
                  size="sm" 
                  className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
