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
  Settings
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

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return
    
    const message = inputValue.trim()
    setInputValue('')
    await onSendMessage(message)
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
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
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
                  <Button
                    onClick={handleSendMessage}
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
    autoOpen: false
  })

  const generateWidgetScript = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'
    
    return `<!-- ${bot.name} Chatbot Widget -->
<script>
(function() {
  var config = {
    botId: ${bot.id},
    primaryColor: '${customization.primaryColor}',
    secondaryColor: '${customization.secondaryColor}',
    position: '${customization.position}',
    size: '${customization.size}',
    showAvatar: ${customization.showAvatar},
    showTitle: ${customization.showTitle},
    autoOpen: ${customization.autoOpen}
  };
  
  var script = document.createElement('script');
  script.src = '${baseUrl}/api/widget/${bot.id}/script.js';
  script.setAttribute('data-config', JSON.stringify(config));
  script.async = true;
  document.head.appendChild(script);
})();
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
  title="${bot.name} Chatbot">
</iframe>`
  }

  const generateReactComponent = () => {
    return `import React, { useState, useEffect } from 'react';

const ${bot.name.replace(/\s+/g, '')}Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (message) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botId: ${bot.id},
          message: message,
          conversationId: null
        })
      });
      
      const data = await response.json();
      setMessages(prev => [...prev, 
        { role: 'user', content: message },
        { role: 'assistant', content: data.message }
      ]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Your chatbot UI here */}
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
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Iframe Embed Code</label>
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
              <div>• <strong>Iframe Embed:</strong> Insert the iframe code where you want the chat to appear</div>
              <div>• <strong>React Component:</strong> Import and use the component in your React application</div>
              <div>• <strong>API Integration:</strong> Use the REST API endpoints for custom implementations</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

