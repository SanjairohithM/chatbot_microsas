"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  MessageSquare, 
  Send, 
  X, 
  Minimize2, 
  Maximize2, 
  Copy, 
  ExternalLink,
  Code,
  Globe,
  Download,
  Settings,
  Mic,
  MicOff,
  Volume2
} from 'lucide-react'
import type { Bot, Message } from '@/lib/types'

interface EmbeddableWidgetProps {
  bot: Bot
  isOpen: boolean
  onToggle: () => void
  onSendMessage: (message: string) => Promise<void>
  messages: Message[]
  isLoading: boolean
}

export function EmbeddableWidget({ 
  bot, 
  isOpen, 
  onToggle, 
  onSendMessage, 
  messages, 
  isLoading 
}: EmbeddableWidgetProps) {
  const [inputValue, setInputValue] = useState('')
  const [isMinimized, setIsMinimized] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null)
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null)
  const [isVoiceSupported, setIsVoiceSupported] = useState(false)
  
  // Voice configuration (could be passed as props in the future)
  const voiceConfig = {
    enableVoice: true,
    voiceLanguage: 'en-US',
    autoSpeak: false,
    voiceRate: 1.0,
    voicePitch: 1.0
  }

  // Initialize voice functionality
  useEffect(() => {
    if (!voiceConfig.enableVoice) return;
    
    // Check for speech recognition support
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = voiceConfig.voiceLanguage;
      
      recognitionInstance.onstart = () => {
        setIsListening(true);
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript.trim()) {
          setInputValue(transcript);
          handleSendMessage(transcript);
        }
      };
      
      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
      setIsVoiceSupported(true);
    }
    
    // Check for speech synthesis support
    if ('speechSynthesis' in window) {
      setSpeechSynthesis(window.speechSynthesis);
    }
  }, [voiceConfig.enableVoice, voiceConfig.voiceLanguage])

  // Auto-speak new assistant messages
  useEffect(() => {
    if (!voiceConfig.autoSpeak || !speechSynthesis || messages.length === 0) return;
    
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === 'assistant') {
      speakText(lastMessage.content);
    }
  }, [messages, voiceConfig.autoSpeak, speechSynthesis])

  const toggleVoiceRecognition = () => {
    if (!recognition || !isVoiceSupported) return;
    
    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  }

  const speakText = (text: string) => {
    if (!speechSynthesis || !voiceConfig.enableVoice) return;
    
    // Stop any current speech
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voiceConfig.voiceLanguage;
    utterance.rate = voiceConfig.voiceRate;
    utterance.pitch = voiceConfig.voicePitch;
    
    speechSynthesis.speak(utterance);
  }

  const handleSendMessage = async (message?: string) => {
    const messageToSend = message || inputValue.trim()
    if (!messageToSend || isLoading) return
    
    setInputValue('')
    await onSendMessage(messageToSend)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <Button
          onClick={onToggle}
          className="rounded-full w-14 h-14 shadow-lg hover:scale-105 transition-transform"
          style={{ backgroundColor: '#3b82f6' }}
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      ) : (
        <Card 
          className={`w-80 shadow-xl border-0 transition-all duration-300 ${
            isMinimized ? 'h-16' : 'h-96'
          }`}
          style={{ 
            borderColor: '#3b82f6',
            borderWidth: '2px'
          }}
        >
          <CardHeader 
            className="p-3 pb-2"
            style={{ backgroundColor: '#3b82f6' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                  style={{ backgroundColor: '#1e40af' }}
                >
                  {bot.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <CardTitle className="text-white text-sm font-medium">
                    {bot.name}
                  </CardTitle>
                  <div className="text-xs text-white/80">Online</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="h-6 w-6 p-0 text-white hover:bg-white/20"
                >
                  {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggle}
                  className="h-6 w-6 p-0 text-white hover:bg-white/20"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {!isMinimized && (
            <CardContent className="p-0 flex flex-col h-full">
              {/* Messages */}
              <ScrollArea className="flex-1 p-3">
                <div className="space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center py-4">
                      <div className="text-sm text-muted-foreground">
                        Hi! I'm {bot.name}. How can I help you today?
                      </div>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex items-start gap-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div
                            className={`rounded-lg px-3 py-2 text-sm ${
                              message.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                            style={
                              message.role === 'user'
                                ? { backgroundColor: '#3b82f6' }
                                : {}
                            }
                          >
                            {message.content}
                          </div>
                          {message.role === 'assistant' && voiceConfig.enableVoice && speechSynthesis && (
                            <Button
                              onClick={() => speakText(message.content)}
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                              title="Play message"
                            >
                              <Volume2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.1s]"></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-3 border-t">
                <div className="flex gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  {voiceConfig.enableVoice && isVoiceSupported && (
                    <Button
                      onClick={toggleVoiceRecognition}
                      disabled={isLoading}
                      size="sm"
                      variant={isListening ? "destructive" : "outline"}
                      title={isListening ? "Stop listening" : "Start voice input"}
                    >
                      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                  )}
                  <Button
                    onClick={() => handleSendMessage()}
                    disabled={!inputValue.trim() || isLoading}
                    size="sm"
                    style={{ backgroundColor: '#3b82f6' }}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  )
}

// Enhanced Widget Export Component
export function WidgetExportDialog({ bot, open, onOpenChange }: { 
  bot: Bot
  open: boolean
  onOpenChange: (open: boolean) => void 
}) {
  const [activeTab, setActiveTab] = useState('widget')
  const [customization, setCustomization] = useState({
    primaryColor: '#3b82f6',
    secondaryColor: '#1e40af',
    position: 'bottom-right',
    size: 'medium',
    showAvatar: true,
    showTitle: true,
    autoOpen: false,
    enableVoice: true,
    voiceLanguage: 'en-US',
    autoSpeak: false,
    voiceRate: 1.0,
    voicePitch: 1.0
  })

  const generateWidgetScript = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'
    
    return `<!-- ${bot.name} Chatbot Widget -->
<script src="${baseUrl}/widgets/chatbot-widget.js" 
        data-bot-id="${bot.id}"
        data-primary-color="${customization.primaryColor}"
        data-secondary-color="${customization.secondaryColor}"
        data-position="${customization.position}"
        data-size="${customization.size}"
        data-show-avatar="${customization.showAvatar}"
        data-show-title="${customization.showTitle}"
        data-auto-open="${customization.autoOpen}"
        data-enable-voice="${customization.enableVoice}"
        data-voice-language="${customization.voiceLanguage}"
        data-auto-speak="${customization.autoSpeak}"
        data-voice-rate="${customization.voiceRate}"
        data-voice-pitch="${customization.voicePitch}"
        data-api-url="${baseUrl}/api/chat"
        data-bot-name="${bot.name}">
</script>`
  }

  const generateIframeEmbed = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'
    
    return `<iframe 
  src="${baseUrl}/embed/${bot.id}?theme=${encodeURIComponent(JSON.stringify(customization))}" 
  width="350" 
  height="500" 
  frameborder="0"
  style="border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);"
  title="${bot.name} Chatbot"
  allow="microphone; camera">
</iframe>`
  }

  const generateMobileIframeEmbed = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'
    
    return `<iframe 
  src="${baseUrl}/embed/${bot.id}/mobile?theme=${encodeURIComponent(JSON.stringify(customization))}" 
  width="80px" 
  height="80px" 
  frameborder="0"
  style="position: fixed; bottom: 20px; right: 20px; z-index: 9999; border: none;"
  title="${bot.name} Chat Button"
  allow="microphone; camera">
</iframe>`
  }

  const generateReactComponent = () => {
    return `import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, X, Minimize2, Maximize2, Mic, MicOff, Volume2 } from 'lucide-react';

const ${bot.name.replace(/\s+/g, '')}Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Voice configuration
  const voiceConfig = {
    enableVoice: ${customization.enableVoice},
    voiceLanguage: '${customization.voiceLanguage}',
    autoSpeak: ${customization.autoSpeak},
    voiceRate: ${customization.voiceRate},
    voicePitch: ${customization.voicePitch}
  };
  
  // Voice-related state
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [speechSynthesis, setSpeechSynthesis] = useState(null);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);

  // Initialize voice functionality
  useEffect(() => {
    if (!voiceConfig.enableVoice) return;
    
    // Check for speech recognition support
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = voiceConfig.voiceLanguage;
      
      recognitionInstance.onstart = () => setIsListening(true);
      recognitionInstance.onend = () => setIsListening(false);
      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript.trim()) {
          setInputValue(transcript);
          sendMessage(transcript);
        }
      };
      recognitionInstance.onerror = () => setIsListening(false);
      
      setRecognition(recognitionInstance);
      setIsVoiceSupported(true);
    }
    
    // Check for speech synthesis support
    if ('speechSynthesis' in window) {
      setSpeechSynthesis(window.speechSynthesis);
    }
  }, []);

  const toggleVoiceRecognition = () => {
    if (!recognition || !isVoiceSupported) return;
    if (isListening) recognition.stop();
    else recognition.start();
  };

  const speakText = (text) => {
    if (!speechSynthesis || !voiceConfig.enableVoice) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voiceConfig.voiceLanguage;
    utterance.rate = voiceConfig.voiceRate;
    utterance.pitch = voiceConfig.voicePitch;
    speechSynthesis.speak(utterance);
  };

  const sendMessage = async (message) => {
    const messageToSend = message || inputValue.trim();
    if (!messageToSend || isLoading) return;
    
    setInputValue('');
    setIsLoading(true);
    
    const userMessage = { role: 'user', content: messageToSend };
    setMessages(prev => [...prev, userMessage]);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botId: ${bot.id},
          message: messageToSend,
          conversationId: null
        })
      });
      
      const data = await response.json();
      const assistantMessage = { role: 'assistant', content: data.message };
      setMessages(prev => [...prev, assistantMessage]);
      
      // Auto-speak the response if enabled
      if (voiceConfig.autoSpeak && voiceConfig.enableVoice) {
        speakText(data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' };
      setMessages(prev => [...prev, errorMessage]);
      
      if (voiceConfig.autoSpeak && voiceConfig.enableVoice) {
        speakText(errorMessage.content);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-14 h-14 shadow-lg hover:scale-105 transition-transform"
          style={{ backgroundColor: '${customization.primaryColor}', color: 'white' }}
        >
          <MessageSquare size={24} />
        </button>
      ) : (
        <div 
          className="w-80 shadow-xl border-2 rounded-lg bg-white"
          style={{ borderColor: '${customization.primaryColor}', height: isMinimized ? '64px' : '400px' }}
        >
          {/* Header */}
          <div 
            className="p-3 flex items-center justify-between text-white"
            style={{ backgroundColor: '${customization.primaryColor}' }}
          >
            <div className="flex items-center gap-2">
              ${customization.showAvatar ? `
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                style={{ backgroundColor: '${customization.secondaryColor}' }}
              >
                ${bot.name.charAt(0).toUpperCase()}
              </div>
              ` : ''}
              ${customization.showTitle ? `
              <div>
                <div className="text-sm font-medium">${bot.name}</div>
                <div className="text-xs opacity-80">Online</div>
              </div>
              ` : ''}
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="w-6 h-6 flex items-center justify-center hover:bg-white/20 rounded"
              >
                {isMinimized ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-6 h-6 flex items-center justify-center hover:bg-white/20 rounded"
              >
                <X size={12} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="flex-1 p-3 overflow-y-auto" style={{ height: '280px' }}>
                {messages.length === 0 ? (
                  <div className="text-center py-4 text-sm text-gray-600">
                    Hi! I'm ${bot.name}. How can I help you today?
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div key={index} className={\`flex \${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-3\`}>
                      <div className="flex items-start gap-2 max-w-[80%]">
                        <div
                          className={\`rounded-lg px-3 py-2 text-sm \${
                            message.role === 'user'
                              ? 'text-white'
                              : 'bg-gray-100 text-gray-900'
                          }\`}
                          style={message.role === 'user' ? { backgroundColor: '${customization.primaryColor}' } : {}}
                        >
                          {message.content}
                        </div>
                        {message.role === 'assistant' && voiceConfig.enableVoice && speechSynthesis && (
                          <button
                            onClick={() => speakText(message.content)}
                            className="w-6 h-6 flex items-center justify-center opacity-60 hover:opacity-100"
                            title="Play message"
                          >
                            <Volume2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex justify-start mb-3">
                    <div className="bg-gray-100 rounded-lg px-3 py-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-3 border-t flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1 px-3 py-2 border rounded-full outline-none text-sm"
                />
                {voiceConfig.enableVoice && isVoiceSupported && (
                  <button
                    onClick={toggleVoiceRecognition}
                    disabled={isLoading}
                    className={\`w-9 h-9 rounded-full flex items-center justify-center \${
                      isListening ? 'bg-red-500 text-white' : 'border border-gray-300 hover:bg-gray-50'
                    }\`}
                    title={isListening ? "Stop listening" : "Start voice input"}
                  >
                    {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>
                )}
                <button
                  onClick={() => sendMessage()}
                  disabled={!inputValue.trim() || isLoading}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white disabled:opacity-50"
                  style={{ backgroundColor: '${customization.primaryColor}' }}
                >
                  <Send size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ${bot.name.replace(/\s+/g, '')}Chatbot;`
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could show a toast notification here
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const downloadScript = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/javascript' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${open ? 'block' : 'hidden'}`}>
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Export {bot.name} Widget
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="widget" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Widget
              </TabsTrigger>
              <TabsTrigger value="iframe" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Iframe
              </TabsTrigger>
              <TabsTrigger value="react" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                React
              </TabsTrigger>
              <TabsTrigger value="customize" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Customize
              </TabsTrigger>
            </TabsList>

            <TabsContent value="customize" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Primary Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={customization.primaryColor}
                      onChange={(e) => setCustomization(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-12 h-10 rounded border"
                    />
                    <Input
                      value={customization.primaryColor}
                      onChange={(e) => setCustomization(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Secondary Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={customization.secondaryColor}
                      onChange={(e) => setCustomization(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      className="w-12 h-10 rounded border"
                    />
                    <Input
                      value={customization.secondaryColor}
                      onChange={(e) => setCustomization(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Position</label>
                  <select
                    value={customization.position}
                    onChange={(e) => setCustomization(prev => ({ ...prev, position: e.target.value }))}
                    className="w-full p-2 border rounded"
                  >
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="top-left">Top Left</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Size</label>
                  <select
                    value={customization.size}
                    onChange={(e) => setCustomization(prev => ({ ...prev, size: e.target.value }))}
                    className="w-full p-2 border rounded"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showAvatar"
                    checked={customization.showAvatar}
                    onChange={(e) => setCustomization(prev => ({ ...prev, showAvatar: e.target.checked }))}
                    className="rounded"
                  />
                  <label htmlFor="showAvatar" className="text-sm">Show Avatar</label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showTitle"
                    checked={customization.showTitle}
                    onChange={(e) => setCustomization(prev => ({ ...prev, showTitle: e.target.checked }))}
                    className="rounded"
                  />
                  <label htmlFor="showTitle" className="text-sm">Show Title</label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoOpen"
                    checked={customization.autoOpen}
                    onChange={(e) => setCustomization(prev => ({ ...prev, autoOpen: e.target.checked }))}
                    className="rounded"
                  />
                  <label htmlFor="autoOpen" className="text-sm">Auto Open</label>
                </div>
              </div>

              {/* Voice Settings Section */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-3">Voice Settings</h4>
                
                <div className="flex items-center space-x-2 mb-4">
                  <input
                    type="checkbox"
                    id="enableVoice"
                    checked={customization.enableVoice}
                    onChange={(e) => setCustomization(prev => ({ ...prev, enableVoice: e.target.checked }))}
                    className="rounded"
                  />
                  <label htmlFor="enableVoice" className="text-sm">Enable Voice Features</label>
                </div>

                {customization.enableVoice && (
                  <div className="space-y-4 pl-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Voice Language</label>
                        <select
                          value={customization.voiceLanguage}
                          onChange={(e) => setCustomization(prev => ({ ...prev, voiceLanguage: e.target.value }))}
                          className="w-full p-2 border rounded text-sm"
                        >
                          <option value="en-US">English (US)</option>
                          <option value="en-GB">English (UK)</option>
                          <option value="es-ES">Spanish (Spain)</option>
                          <option value="es-MX">Spanish (Mexico)</option>
                          <option value="fr-FR">French</option>
                          <option value="de-DE">German</option>
                          <option value="it-IT">Italian</option>
                          <option value="pt-BR">Portuguese (Brazil)</option>
                          <option value="ja-JP">Japanese</option>
                          <option value="ko-KR">Korean</option>
                          <option value="zh-CN">Chinese (Simplified)</option>
                          <option value="zh-TW">Chinese (Traditional)</option>
                          <option value="hi-IN">Hindi</option>
                          <option value="ar-SA">Arabic</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="autoSpeak"
                            checked={customization.autoSpeak}
                            onChange={(e) => setCustomization(prev => ({ ...prev, autoSpeak: e.target.checked }))}
                            className="rounded"
                          />
                          <label htmlFor="autoSpeak" className="text-sm">Auto-speak responses</label>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Speech Rate</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="range"
                            min="0.5"
                            max="2"
                            step="0.1"
                            value={customization.voiceRate}
                            onChange={(e) => setCustomization(prev => ({ ...prev, voiceRate: parseFloat(e.target.value) }))}
                            className="flex-1"
                          />
                          <span className="text-xs text-muted-foreground w-8">{customization.voiceRate}x</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Speech Pitch</label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="range"
                            min="0.5"
                            max="2"
                            step="0.1"
                            value={customization.voicePitch}
                            onChange={(e) => setCustomization(prev => ({ ...prev, voicePitch: parseFloat(e.target.value) }))}
                            className="flex-1"
                          />
                          <span className="text-xs text-muted-foreground w-8">{customization.voicePitch}x</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="widget" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">JavaScript Widget Code</label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(generateWidgetScript())}
                      className="flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadScript(generateWidgetScript(), `${bot.name.toLowerCase().replace(/\s+/g, '-')}-widget.js`)}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>
                <ScrollArea className="h-48 w-full rounded border p-3">
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                    {generateWidgetScript()}
                  </pre>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="iframe" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Standard Iframe Embed</label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(generateIframeEmbed())}
                        className="flex items-center gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        Copy
                      </Button>
                    </div>
                  </div>
                  <ScrollArea className="h-32 w-full rounded border p-3">
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                      {generateIframeEmbed()}
                    </pre>
                  </ScrollArea>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Mobile Iframe Embed (Chat Icon)</label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(generateMobileIframeEmbed())}
                        className="flex items-center gap-2"
                      >
                        <Copy className="h-4 w-4" />
                        Copy
                      </Button>
                    </div>
                  </div>
                  <ScrollArea className="h-32 w-full rounded border p-3">
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                      {generateMobileIframeEmbed()}
                    </pre>
                  </ScrollArea>
                  <p className="text-xs text-muted-foreground">
                    This version shows a floating chat button that opens a chat window in the center of the screen when clicked. The button stays in the bottom-right corner, but the chat opens in the center. Perfect for embedding on external websites.
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="react" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">React Component</label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(generateReactComponent())}
                      className="flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadScript(generateReactComponent(), `${bot.name.replace(/\s+/g, '')}Chatbot.jsx`)}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>
                <ScrollArea className="h-64 w-full rounded border p-3">
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                    {generateReactComponent()}
                  </pre>
                </ScrollArea>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-medium text-sm mb-2">Integration Instructions:</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>• <strong>JavaScript Widget:</strong> Add the script tag to your HTML head section</div>
              <div>• <strong>Standard Iframe:</strong> Insert the iframe code where you want the chat to appear</div>
              <div>• <strong>Mobile Iframe:</strong> Shows a floating chat button that opens a chat window in the center of the screen (perfect for external websites)</div>
              <div>• <strong>React Component:</strong> Import and use the component in your React application</div>
              <div>• <strong>API Integration:</strong> Use the REST API endpoints for custom implementations</div>
            </div>
            
            {customization.enableVoice && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h5 className="font-medium text-sm mb-2 text-blue-800">🎤 Voice Features Enabled:</h5>
                <div className="space-y-1 text-xs text-blue-700">
                  <div>• <strong>Voice Input:</strong> Users can speak to the chatbot using the microphone button</div>
                  <div>• <strong>Text-to-Speech:</strong> Bot responses can be played aloud {customization.autoSpeak ? '(auto-enabled)' : '(click speaker icon)'}</div>
                  <div>• <strong>Language:</strong> {customization.voiceLanguage}</div>
                  <div>• <strong>Browser Support:</strong> Requires modern browsers with Web Speech API support</div>
                  <div>• <strong>Permissions:</strong> Users will be prompted to allow microphone access</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

