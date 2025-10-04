"use client"

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'

export type ResponseModel = 'voice' | 'chat'

interface ResponseModelContextType {
  responseModel: ResponseModel
  setResponseModel: (model: ResponseModel) => void
  isVoiceMode: boolean
  isChatMode: boolean
}

const ResponseModelContext = createContext<ResponseModelContextType | undefined>(undefined)

interface ResponseModelProviderProps {
  children: ReactNode
  defaultModel?: ResponseModel
}

export function ResponseModelProvider({ 
  children, 
  defaultModel = 'chat' 
}: ResponseModelProviderProps) {
  const [responseModel, setResponseModel] = useState<ResponseModel>(defaultModel)

  // Persist model selection to localStorage
  useEffect(() => {
    const saved = localStorage.getItem('response-model')
    if (saved && (saved === 'voice' || saved === 'chat')) {
      setResponseModel(saved)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('response-model', responseModel)
  }, [responseModel])

  const value = {
    responseModel,
    setResponseModel,
    isVoiceMode: responseModel === 'voice',
    isChatMode: responseModel === 'chat'
  }

  return (
    <ResponseModelContext.Provider value={value}>
      {children}
    </ResponseModelContext.Provider>
  )
}

export function useResponseModel() {
  const context = useContext(ResponseModelContext)
  if (context === undefined) {
    throw new Error('useResponseModel must be used within a ResponseModelProvider')
  }
  return context
}

// Hook for components that need to know about response model
export function useResponseModelState() {
  const { responseModel, setResponseModel, isVoiceMode, isChatMode } = useResponseModel()
  
  return {
    responseModel,
    setResponseModel,
    isVoiceMode,
    isChatMode,
    // Helper functions
    switchToVoice: () => setResponseModel('voice'),
    switchToChat: () => setResponseModel('chat'),
    toggleModel: () => setResponseModel(prev => prev === 'voice' ? 'chat' : 'voice')
  }
}
