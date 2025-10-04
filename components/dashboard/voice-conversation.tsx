"use client"

import React, { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  MessageCircle, 
  Bot, 
  User, 
  Square,
  Play,
  Pause
} from "lucide-react"
import { cn } from "@/lib/utils"

interface VoiceConversationProps {
  botId: number
  conversationId?: number
  userId?: number
  onConversationUpdate?: (conversationId: number) => void
}

interface ConversationMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  audioUrl?: string
}

export function VoiceConversation({ 
  botId, 
  conversationId, 
  userId,
  onConversationUpdate 
}: VoiceConversationProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [currentConversationId, setCurrentConversationId] = useState(conversationId)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const clearError = () => setError(null)

  const startRecording = async () => {
    try {
      clearError()
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })
      
      streamRef.current = stream
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      recordedChunksRef.current = []
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event)
        setError('Recording error occurred. Please try again.')
        setIsRecording(false)
        stopRecording()
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' })
        
        if (blob.size === 0) {
          setError('No audio recorded. Please try again.')
          return
        }
        
        setIsProcessing(true)
        
        try {
          // Send to voice conversation API
          const formData = new FormData()
          const file = new File([blob], 'audio.webm', { type: 'audio/webm' })
          formData.append('audio', file)
          formData.append('botId', botId.toString())
          if (currentConversationId) {
            formData.append('conversationId', currentConversationId.toString())
          }
          if (userId) {
            formData.append('userId', userId.toString())
          }
          formData.append('voice', 'alloy')
          
          const response = await fetch('/api/voice-conversation', {
            method: 'POST',
            body: formData,
            signal: AbortSignal.timeout(60000) // 60 second timeout
          })
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error || `Voice conversation failed: ${response.status}`)
          }
          
          const result = await response.json()
          
          // Update conversation ID if this is a new conversation
          if (result.conversationId && result.conversationId !== currentConversationId) {
            setCurrentConversationId(result.conversationId)
            onConversationUpdate?.(result.conversationId)
          }
          
          // Add messages to conversation
          const userMessage: ConversationMessage = {
            id: `user_${Date.now()}`,
            role: 'user',
            content: result.transcription,
            timestamp: new Date()
          }
          
          const assistantMessage: ConversationMessage = {
            id: `assistant_${result.messageId}`,
            role: 'assistant',
            content: result.text,
            timestamp: new Date(),
            audioUrl: `data:audio/mp3;base64,${result.audio}`
          }
          
          setMessages(prev => [...prev, userMessage, assistantMessage])
          
          // Play the response audio
          await playAudio(result.audio)
          
        } catch (err: any) {
          console.error('Voice conversation failed:', err)
          let errorMessage = 'Failed to process voice conversation.'
          
          if (err.name === 'AbortError') {
            errorMessage = 'Request timed out. Please try again.'
          } else if (err.message.includes('Failed to fetch')) {
            errorMessage = 'Network error. Please check your connection.'
          } else if (err.message) {
            errorMessage = err.message
          }
          
          setError(errorMessage)
        } finally {
          setIsProcessing(false)
        }
        
        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      
    } catch (err: any) {
      console.error('Microphone access error:', err)
      let errorMessage = 'Failed to access microphone.'
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Microphone access denied. Please allow microphone permissions.'
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please connect a microphone.'
      } else if (err.name === 'NotSupportedError') {
        errorMessage = 'Voice recording is not supported in this browser.'
      }
      
      setError(errorMessage)
    }
  }

  const stopRecording = () => {
    const mediaRecorder = mediaRecorderRef.current
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      try {
        mediaRecorder.stop()
      } catch (error) {
        console.error('Error stopping recording:', error)
        setError('Error stopping recording. Please try again.')
      }
    }
    setIsRecording(false)
  }

  const playAudio = async (base64Audio: string) => {
    try {
      setIsSpeaking(true)
      
      // Stop any existing audio
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      
      const audioBlob = new Blob([Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0))], { type: 'audio/mp3' })
      const audioUrl = URL.createObjectURL(audioBlob)
      
      const audio = new Audio(audioUrl)
      audioRef.current = audio
      
      audio.onended = () => {
        setIsSpeaking(false)
        URL.revokeObjectURL(audioUrl)
        audioRef.current = null
      }
      
      audio.onerror = () => {
        setIsSpeaking(false)
        URL.revokeObjectURL(audioUrl)
        audioRef.current = null
      }
      
      await audio.play()
      
    } catch (error) {
      console.error('Audio playback failed:', error)
      setError('Failed to play audio response.')
      setIsSpeaking(false)
    }
  }

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setIsSpeaking(false)
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

  const replayLastResponse = () => {
    const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop()
    if (lastAssistantMessage?.audioUrl) {
      const base64Audio = lastAssistantMessage.audioUrl.split(',')[1]
      playAudio(base64Audio)
    }
  }

  const isVoiceActive = isRecording || isProcessing || isSpeaking
  const canRecord = !isProcessing && !isSpeaking

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Voice Conversation</h3>
            {currentConversationId && (
              <Badge variant="outline" className="text-xs">
                ID: {currentConversationId}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <Button
                onClick={replayLastResponse}
                variant="outline"
                size="sm"
                disabled={isSpeaking}
                className="h-8"
              >
                {isSpeaking ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                <span className="ml-1">Replay</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">Start a voice conversation</p>
            <p className="text-sm">Click the microphone button to begin speaking</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === 'user' && "flex-row-reverse"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                message.role === 'user' 
                  ? "bg-blue-500 text-white" 
                  : "bg-gray-300 text-gray-600"
              )}>
                {message.role === 'user' ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              
              <div className={cn(
                "flex-1 max-w-[80%]",
                message.role === 'user' && "text-right"
              )}>
                <div className={cn(
                  "px-4 py-2 rounded-lg",
                  message.role === 'user'
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-900"
                )}>
                  <p className="text-sm">{message.content}</p>
                </div>
                <div className={cn(
                  "text-xs text-gray-500 mt-1",
                  message.role === 'user' && "text-right"
                )}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Status Indicators */}
      {isRecording && (
        <div className="p-3 border-t border-gray-200 bg-red-50">
          <div className="flex items-center justify-center gap-2 text-red-600">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Recording... Click to stop</span>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="p-3 border-t border-gray-200 bg-blue-50">
          <div className="flex items-center justify-center gap-2 text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm font-medium">Processing your voice...</span>
          </div>
        </div>
      )}

      {isSpeaking && (
        <div className="p-3 border-t border-gray-200 bg-green-50">
          <div className="flex items-center justify-center gap-2 text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Speaking response...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 border-t border-gray-200 bg-red-50">
          <div className="flex items-center justify-between gap-2 text-red-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium">{error}</span>
            </div>
            <Button
              onClick={clearError}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
            >
              ×
            </Button>
          </div>
        </div>
      )}

      {/* Voice Control */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex justify-center">
          <Button
            onClick={handleVoiceAction}
            disabled={!canRecord}
            className={cn(
              "h-16 w-16 rounded-full transition-all duration-200",
              isRecording 
                ? "bg-red-500 hover:bg-red-600 animate-pulse" 
                : isSpeaking
                  ? "bg-orange-500 hover:bg-orange-600"
                  : "bg-blue-500 hover:bg-blue-600"
            )}
          >
            {isSpeaking ? (
              <VolumeX className="h-6 w-6" />
            ) : isProcessing ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            ) : isRecording ? (
              <MicOff className="h-6 w-6" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </Button>
        </div>
        
        <div className="text-center mt-2">
          <p className="text-sm text-gray-600">
            {isRecording 
              ? "Click to stop recording" 
              : isSpeaking 
                ? "Click to stop speaking"
                : isProcessing
                  ? "Processing..."
                  : "Click to start voice conversation"
            }
          </p>
        </div>
      </div>
    </div>
  )
}
