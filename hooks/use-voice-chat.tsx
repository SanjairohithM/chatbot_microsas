"use client"

import { useState, useRef, useCallback } from 'react'

export interface VoiceChatOptions {
  onTranscription?: (text: string) => void
  onResponse?: (text: string) => void
  onError?: (error: string) => void
  onStartRecording?: () => void
  onStopRecording?: () => void
  onStartSpeaking?: () => void
  onStopSpeaking?: () => void
  autoSend?: boolean
  voice?: string
  model?: string
}

export interface VoiceChatState {
  isRecording: boolean
  isProcessing: boolean
  isSpeaking: boolean
  error: string | null
  lastTranscription: string | null
  lastResponse: string | null
}

export function useVoiceChat(options: VoiceChatOptions = {}) {
  const [state, setState] = useState<VoiceChatState>({
    isRecording: false,
    isProcessing: false,
    isSpeaking: false,
    error: null,
    lastTranscription: null,
    lastResponse: null
  })

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  const startRecording = useCallback(async () => {
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
        setState(prev => ({ 
          ...prev, 
          error: 'Recording error occurred. Please try again.',
          isRecording: false 
        }))
        stopRecording()
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' })
        
        if (blob.size === 0) {
          setState(prev => ({ 
            ...prev, 
            error: 'No audio recorded. Please try again.',
            isRecording: false 
          }))
          return
        }
        
        setState(prev => ({ ...prev, isProcessing: true, isRecording: false }))
        options.onStopRecording?.()
        
        try {
          // Convert speech to text
          const formData = new FormData()
          const file = new File([blob], 'audio.webm', { type: 'audio/webm' })
          formData.append('file', file)
          
          const sttResponse = await fetch('/api/audio/stt', {
            method: 'POST',
            body: formData,
            signal: AbortSignal.timeout(30000)
          })
          
          if (!sttResponse.ok) {
            const errorData = await sttResponse.json().catch(() => ({}))
            throw new Error(errorData.error || `STT failed: ${sttResponse.status}`)
          }
          
          const sttResult = await sttResponse.json()
          const transcribedText = sttResult.text?.trim()
          
          console.log('🔍 STT Result:', sttResult)
          console.log('📝 Transcribed text:', transcribedText)
          
          if (!transcribedText) {
            console.log('⚠️ No speech detected in transcription')
            setState(prev => ({ 
              ...prev, 
              error: 'No speech detected. Please try speaking more clearly.',
              isProcessing: false 
            }))
            return
          }

          console.log('✅ Setting transcription and calling callback')
          setState(prev => ({ 
            ...prev, 
            lastTranscription: transcribedText,
            isProcessing: false 
          }))
          
          options.onTranscription?.(transcribedText)
          
          // Auto-send if enabled (only for standalone voice chat, not for PrefetchChatInput)
          if (options.autoSend) {
            await processVoiceMessage(transcribedText)
          }
          
        } catch (error: any) {
          console.error('Voice processing failed:', error)
          let errorMessage = 'Failed to process voice recording.'
          
          if (error.name === 'AbortError') {
            errorMessage = 'Request timed out. Please try again.'
          } else if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Network error. Please check your connection.'
          } else if (error.message) {
            errorMessage = error.message
          }
          
          setState(prev => ({ 
            ...prev, 
            error: errorMessage,
            isProcessing: false 
          }))
          options.onError?.(errorMessage)
        }
      }

      mediaRecorder.start()
      setState(prev => ({ ...prev, isRecording: true }))
      options.onStartRecording?.()
      
    } catch (error: any) {
      console.error('Microphone access error:', error)
      let errorMessage = 'Failed to access microphone.'
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Microphone access denied. Please allow microphone permissions.'
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please connect a microphone.'
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Voice recording is not supported in this browser.'
      }
      
      setState(prev => ({ 
        ...prev, 
        error: errorMessage,
        isRecording: false 
      }))
      options.onError?.(errorMessage)
    }
  }, [options, clearError])

  const stopRecording = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      try {
        mediaRecorder.stop()
      } catch (error) {
        console.error('Error stopping recording:', error)
        setState(prev => ({ 
          ...prev, 
          error: 'Error stopping recording. Please try again.',
          isRecording: false 
        }))
      }
    }
    
    // Clean up stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }, [])

  const speak = useCallback(async (text: string) => {
    try {
      console.log('🔊 speak function called with text:', text)
      clearError()
      setState(prev => ({ ...prev, isSpeaking: true }))
      options.onStartSpeaking?.()
      
      console.log('🔊 Making TTS request to /api/audio/tts')
      const response = await fetch('/api/audio/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text,
          voice: options.voice || 'alloy',
          model: options.model || 'tts-1',
          format: 'mp3'
        })
      })
      
      console.log('🔊 TTS response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `TTS failed: ${response.status}`)
      }
      
      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      
      console.log('🔊 Audio blob created, size:', audioBlob.size, 'URL:', audioUrl)
      
      // Stop any existing audio
      if (audioRef.current) {
        console.log('🔊 Stopping existing audio')
        audioRef.current.pause()
        audioRef.current = null
      }
      
      const audio = new Audio(audioUrl)
      audioRef.current = audio
      
      console.log('🔊 Audio element created, attempting to play')
      
      audio.onended = () => {
        console.log('🔊 Audio playback ended')
        setState(prev => ({ ...prev, isSpeaking: false }))
        options.onStopSpeaking?.()
        URL.revokeObjectURL(audioUrl)
        audioRef.current = null
      }
      
      audio.onerror = (error) => {
        console.error('❌ Audio playback error:', error)
        setState(prev => ({ 
          ...prev, 
          error: 'Failed to play audio response.',
          isSpeaking: false 
        }))
        options.onStopSpeaking?.()
        URL.revokeObjectURL(audioUrl)
        audioRef.current = null
      }
      
      await audio.play()
      console.log('✅ Audio playback started successfully')
      
    } catch (error: any) {
      console.error('❌ TTS failed:', error)
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Failed to generate speech.',
        isSpeaking: false 
      }))
      options.onError?.(error.message || 'Failed to generate speech.')
      options.onStopSpeaking?.()
    }
  }, [options, clearError])

  const processVoiceMessage = useCallback(async (text: string) => {
    try {
      setState(prev => ({ ...prev, isProcessing: true }))
      
      // Send message to chat API
      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          botId: 1, // You might want to make this configurable
          conversationId: null // You might want to track this
        })
      })
      
      if (!chatResponse.ok) {
        const errorData = await chatResponse.json().catch(() => ({}))
        throw new Error(errorData.error || `Chat failed: ${chatResponse.status}`)
      }
      
      const chatResult = await chatResponse.json()
      const responseText = chatResult.message
      
      if (responseText) {
        setState(prev => ({ 
          ...prev, 
          lastResponse: responseText,
          isProcessing: false 
        }))
        
        options.onResponse?.(responseText)
        
        // Automatically speak the response
        await speak(responseText)
      } else {
        setState(prev => ({ 
          ...prev, 
          error: 'No response received from chat.',
          isProcessing: false 
        }))
      }
      
    } catch (error: any) {
      console.error('Voice message processing failed:', error)
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Failed to process voice message.',
        isProcessing: false 
      }))
      options.onError?.(error.message || 'Failed to process voice message.')
    }
  }, [options, speak])

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setState(prev => ({ ...prev, isSpeaking: false }))
    options.onStopSpeaking?.()
  }, [options])

  const reset = useCallback(() => {
    stopRecording()
    stopSpeaking()
    setState({
      isRecording: false,
      isProcessing: false,
      isSpeaking: false,
      error: null,
      lastTranscription: null,
      lastResponse: null
    })
  }, [stopRecording, stopSpeaking])

  return {
    ...state,
    startRecording,
    stopRecording,
    speak,
    processVoiceMessage,
    stopSpeaking,
    clearError,
    reset
  }
}
