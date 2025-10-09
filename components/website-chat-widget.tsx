"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot, 
  User,
  Minimize2,
  Maximize2,
  ExternalLink,
  ArrowRight,
  Mic,
  MicOff,
  Volume2
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  navigationActions?: NavigationAction[]
}

interface NavigationAction {
  action: 'navigate' | 'scroll' | 'link'
  path?: string
  label: string
  section?: string
}

interface WebsiteChatWidgetProps {
  botId?: number
  className?: string
}

export function WebsiteChatWidget({ 
  botId = 1, // Default bot ID for website assistant
  className 
}: WebsiteChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isAutoNavigating, setIsAutoNavigating] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus()
    }
  }, [isOpen, isMinimized])

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setMessage(transcript)
        setIsListening(false)
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }
  }, [])

  // Text-to-speech functionality
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 0.8
      
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      
      speechSynthesis.speak(utterance)
    }
  }

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: "Hi! I'm your smart navigation assistant with voice control! You can type or speak to me. Just tell me where you want to go and I'll take you there automatically! Try saying 'show me pricing' or 'take me to dashboard'.",
        timestamp: new Date(),
        navigationActions: [
          { action: 'navigate', path: '/dashboard', label: 'Go to Dashboard' },
          { action: 'navigate', path: '/auth', label: 'Sign In' },
          { action: 'scroll', section: 'pricing', label: 'View Pricing' },
          { action: 'scroll', section: 'features', label: 'See Features' }
        ]
      }])
    }
  }, [])

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: message.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setMessage("")
    setIsLoading(true)
    setIsTyping(true)

    try {
      // Use navigation API for better navigation assistance
      const response = await fetch('/api/website-navigation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          currentPath: window.location.pathname
        })
      })

      if (!response.ok) {
        throw new Error(`Navigation API error: ${response.status}`)
      }

      const result = await response.json()

      const assistantMessage: Message = {
        id: `assistant_${result.messageId || Date.now()}`,
        role: 'assistant',
        content: result.message,
        timestamp: new Date(),
        navigationActions: result.navigationActions || []
      }

      setMessages(prev => [...prev, assistantMessage])

      // Speak the response
      speak(result.message)

      // Auto-navigate if specified
      if (result.autoNavigate) {
        console.log('Auto-navigating to:', result.autoNavigate)
        setIsAutoNavigating(true)
        
        // Add a message to inform user about auto-navigation
        const navigationMessage: Message = {
          id: `navigation_${Date.now()}`,
          role: 'assistant',
          content: `🚀 Auto-navigating you to ${result.autoNavigate.path || result.autoNavigate.section} in a moment...`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, navigationMessage])
        
        setTimeout(() => {
          handleNavigation(result.autoNavigate)
          setIsAutoNavigating(false)
        }, 2000) // Slightly longer delay to allow speech to complete
      }

      // Also check for navigation actions and auto-navigate to the first one
      if (result.navigationActions && result.navigationActions.length > 0 && !result.autoNavigate) {
        const firstAction = result.navigationActions[0]
        // Auto-navigate to the first navigation action after a short delay
        if (firstAction.action === 'navigate') {
          console.log('Auto-navigating to first action:', firstAction)
          setIsAutoNavigating(true)
          
          // Add a message to inform user about auto-navigation
          const navigationMessage: Message = {
            id: `navigation_${Date.now()}`,
            role: 'assistant',
            content: `🚀 Auto-navigating you to ${firstAction.path} in a moment...`,
            timestamp: new Date()
          }
          setMessages(prev => [...prev, navigationMessage])
          
          setTimeout(() => {
            handleNavigation(firstAction)
            setIsAutoNavigating(false)
          }, 3000) // 3 second delay to allow user to see the response
        }
      }

    } catch (error) {
      console.error('Navigation error:', error)
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: "Sorry, I'm having trouble with navigation right now. Please try again in a moment.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setIsTyping(false)
    }
  }

  const handleNavigation = (action: NavigationAction) => {
    console.log('Handling navigation:', action)
    
    if (action.action === 'navigate' && action.path) {
      // Handle hash navigation for sections
      if (action.path.startsWith('#')) {
        const element = document.getElementById(action.path.substring(1))
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      } else {
        // Internal page navigation - ensure clean URL
        const cleanPath = action.path.startsWith('/') ? action.path : `/${action.path}`
        console.log('Navigating to internal page:', cleanPath)
        
        // Use window.location.assign for better navigation
        window.location.assign(cleanPath)
      }
    } else if (action.action === 'scroll' && action.section) {
      const element = document.getElementById(action.section)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    } else if (action.action === 'link' && action.path) {
      window.open(action.path, '_blank')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true)
      recognitionRef.current.start()
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }

  const toggleVoiceInput = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const toggleChat = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setIsMinimized(false)
    }
  }

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  return (
    <div className={cn("fixed bottom-4 right-4 z-50 sm:bottom-4 sm:right-4", className)}>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <Button
          onClick={toggleChat}
          size="lg"
          className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <MessageCircle className="h-7 w-7 sm:h-8 sm:w-8" />
          <span className="sr-only">Open chat</span>
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className={cn(
          "w-[calc(100vw-2rem)] h-[calc(100vh-4rem)] sm:w-96 sm:h-[28rem] md:w-[32rem] md:h-[32rem] lg:w-[36rem] lg:h-[36rem] shadow-2xl border-0 bg-white",
          isMinimized && "h-14 w-96"
        )}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 sm:p-5 bg-blue-600 text-white rounded-t-lg">
            <div className="flex items-center space-x-3">
              <Bot className="h-6 w-6" />
              <CardTitle className="text-base font-medium">Website Assistant</CardTitle>
              {isTyping && (
                <Badge variant="secondary" className="text-xs">
                  Typing...
                </Badge>
              )}
              {isSpeaking && (
                <Badge variant="secondary" className="text-xs">
                  <Volume2 className="h-3 w-3 mr-1" />
                  Speaking...
                </Badge>
              )}
              {isAutoNavigating && (
                <Badge variant="secondary" className="text-xs">
                  <ArrowRight className="h-3 w-3 mr-1" />
                  Navigating...
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMinimize}
                className="h-8 w-8 p-0 text-white hover:bg-blue-700"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleChat}
                className="h-8 w-8 p-0 text-white hover:bg-blue-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          {!isMinimized && (
            <>
              <CardContent className="p-0 flex flex-col h-[calc(100%-4rem)]">
                {/* Messages Area */}
                <ScrollArea className="flex-1 p-3 sm:p-4 overflow-y-auto">
                  <div className="space-y-3 sm:space-y-4 min-h-full">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex items-start space-x-2",
                          msg.role === 'user' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        {msg.role === 'assistant' && (
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Bot className="h-4 w-4 text-blue-600" />
                          </div>
                        )}
                        <div
                          className={cn(
                            "max-w-[80%] rounded-lg px-4 py-3 text-sm sm:text-base break-words",
                            msg.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          )}
                        >
                          {msg.content}
                          
                          {/* Navigation Actions */}
                          {msg.navigationActions && msg.navigationActions.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {msg.navigationActions.map((action, index) => (
                                <Button
                                  key={index}
                                  onClick={() => handleNavigation(action)}
                                  size="sm"
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-sm h-10",
                                    msg.role === 'assistant' 
                                      ? 'bg-white border-blue-200 text-blue-700 hover:bg-blue-50' 
                                      : 'bg-blue-500 border-blue-300 text-white hover:bg-blue-600'
                                  )}
                                >
                                  {action.action === 'navigate' && <ArrowRight className="h-3 w-3 mr-2" />}
                                  {action.action === 'link' && <ExternalLink className="h-3 w-3 mr-2" />}
                                  {action.action === 'scroll' && <ArrowRight className="h-3 w-3 mr-2" />}
                                  {action.label}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                        {msg.role === 'user' && (
                          <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-600" />
                          </div>
                        )}
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Bot className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="bg-gray-100 rounded-lg px-4 py-3 text-sm">
                          <div className="flex space-x-2">
                            <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="border-t p-4 sm:p-5 flex-shrink-0">
                  <div className="flex space-x-3">
                    <Input
                      ref={inputRef}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={isListening ? "Listening..." : "Type or speak your message..."}
                      disabled={isLoading}
                      className="flex-1 min-w-0 text-sm sm:text-base h-11"
                    />
                    <Button
                      onClick={toggleVoiceInput}
                      disabled={isLoading}
                      size="sm"
                      variant={isListening ? "destructive" : "outline"}
                      className="px-3 sm:px-4 flex-shrink-0 h-11"
                    >
                      {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </Button>
                    <Button
                      onClick={handleSendMessage}
                      disabled={!message.trim() || isLoading}
                      size="sm"
                      className="px-3 sm:px-4 flex-shrink-0 h-11"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                  {isListening && (
                    <div className="mt-3 text-sm text-blue-600 flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-3"></div>
                      <span className="font-medium">Listening... Speak now</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </>
          )}
        </Card>
      )}
    </div>
  )
}
