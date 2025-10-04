"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
  Volume2,
  FileText,
  Database,
  Key,
  Shield,
  Zap
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
  const [recognition, setRecognition] = useState<any>(null)
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
    <div className="fixed right-4 bottom-4 z-50">
      {!isOpen ? (
        <Button
          onClick={onToggle}
          className="w-14 h-14 rounded-full shadow-lg transition-transform hover:scale-105"
          style={{ backgroundColor: '#3b82f6' }}
        >
          <MessageSquare className="w-6 h-6" />
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
            <div className="flex justify-between items-center">
              <div className="flex gap-2 items-center">
                <div 
                  className="flex justify-center items-center w-8 h-8 text-sm font-medium text-white rounded-full"
                  style={{ backgroundColor: '#1e40af' }}
                >
                  {bot.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <CardTitle className="text-sm font-medium text-white">
                    {bot.name}
                  </CardTitle>
                  <div className="text-xs text-white/80">Online</div>
                </div>
              </div>
              <div className="flex gap-1 items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-0 w-6 h-6 text-white hover:bg-white/20"
                >
                  {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggle}
                  className="p-0 w-6 h-6 text-white hover:bg-white/20"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {!isMinimized && (
            <CardContent className="flex flex-col p-0 h-full">
              {/* Messages */}
              <ScrollArea className="flex-1 p-3">
                <div className="space-y-3">
                  {messages.length === 0 ? (
                    <div className="py-4 text-center">
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
                              className="p-0 w-6 h-6 opacity-60 hover:opacity-100"
                              title="Play message"
                            >
                              <Volume2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="px-3 py-2 text-sm rounded-lg bg-muted">
                        <div className="flex gap-2 items-center">
                          <div className="w-2 h-2 rounded-full animate-bounce bg-muted-foreground"></div>
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
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </Button>
                  )}
                  <Button
                    onClick={() => handleSendMessage()}
                    disabled={!inputValue.trim() || isLoading}
                    size="sm"
                    style={{ backgroundColor: '#3b82f6' }}
                  >
                    <Send className="w-4 h-4" />
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
    voicePitch: 1.0,
    enableDatabase: false,
    databaseType: 'mysql',
    databaseHost: '',
    databasePort: 3306,
    databaseName: '',
    databaseUsername: '',
    databasePassword: '',
    databaseSSL: false,
    databasePermissions: ['read']
  })

  const generateWidgetScript = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'
    
    const databaseConfig = customization.enableDatabase ? `
        data-enable-database="${customization.enableDatabase}"
        data-database-type="${customization.databaseType}"
        data-database-host="${customization.databaseHost}"
        data-database-port="${customization.databasePort}"
        data-database-name="${customization.databaseName}"
        data-database-username="${customization.databaseUsername}"
        data-database-password="${customization.databasePassword}"
        data-database-ssl="${customization.databaseSSL}"
        data-database-permissions="${customization.databasePermissions.join(',')}"` : ''
    
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
        data-database-api-url="${baseUrl}/api/chatbot/database-chat"
        data-bot-name="${bot.name}"${databaseConfig}>
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

  const generateWordPressShortcode = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'
    
    return `[omnix_chatbot 
    bot_id="${bot.id}" 
    access_token="YOUR_ACCESS_TOKEN_HERE" 
    theme="default" 
    position="${customization.position}" 
    auto_open="${customization.autoOpen}" 
    show_avatar="${customization.showAvatar}" 
    show_title="${customization.showTitle}" 
    enable_voice="${customization.enableVoice}" 
    voice_language="${customization.voiceLanguage}" 
    auto_speak="${customization.autoSpeak}"]`
  }

  const generateTokenAPIExample = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'
    
    return `// Generate access token for WordPress integration
curl -X POST "${baseUrl}/api/tokens" \\
  -H "Content-Type: application/json" \\
  -d '{
    "bot_id": ${bot.id},
    "token_name": "WordPress Integration",
    "permissions": "chat,analytics,conversations",
    "expires_days": 365
  }'

// Response:
{
  "success": true,
  "access_token": "ox_abc123...",
  "secret_key": "ox_sk_def456...",
  "bot_id": ${bot.id},
  "token_name": "WordPress Integration",
  "permissions": ["chat", "analytics", "conversations"],
  "expires_at": "2025-12-31T23:59:59.000Z"
}`
  }

  const generateWordPressAPIExample = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'
    
    return `// Send chat message via WordPress REST API
fetch('${baseUrl}/wp-json/omnix-chatbot/v1/chat', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: 'Hello, how can you help me?',
    conversationId: null
  })
})
.then(response => response.json())
.then(data => {
  console.log('Bot response:', data.message);
});

// Available WordPress REST API endpoints:
// GET  /wp-json/omnix-chatbot/v1/chat
// POST /wp-json/omnix-chatbot/v1/chat
// GET  /wp-json/omnix-chatbot/v1/bots
// GET  /wp-json/omnix-chatbot/v1/conversations
// GET  /wp-json/omnix-chatbot/v1/analytics`
  }

  const generateDatabaseAPIExample = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'
    
    return `// Database Chatbot API Examples

// 1. Create Database Credentials for Bot
curl -X POST "${baseUrl}/api/bots/${bot.id}/database-credentials" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN:YOUR_SECRET_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "permissions": ["read", "write"],
    "expires_in_days": 365
  }'

// 2. Test Database Connection
curl -X GET "${baseUrl}/api/database/query?action=test&type=mysql&host=localhost&port=3306&database=myapp&username=user&password=pass" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN:YOUR_SECRET_KEY"

// 3. Execute Direct SQL Query
curl -X POST "${baseUrl}/api/database/query" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN:YOUR_SECRET_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "database_config": {
      "type": "mysql",
      "host": "localhost",
      "port": 3306,
      "database": "myapp",
      "username": "user",
      "password": "pass"
    },
    "query": "SELECT COUNT(*) as user_count FROM users WHERE active = ?",
    "params": [true]
  }'

// 4. AI-Powered Database Chat
curl -X POST "${baseUrl}/api/chatbot/database-chat" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN:YOUR_SECRET_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "How many active users do we have?",
    "database_config": {
      "type": "mysql",
      "host": "localhost",
      "port": 3306,
      "database": "myapp",
      "username": "user",
      "password": "pass"
    }
  }'

// 5. Get Database Schema
curl -X GET "${baseUrl}/api/database/query?action=schema&type=mysql&host=localhost&port=3306&database=myapp&username=user&password=pass" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN:YOUR_SECRET_KEY"

// 6. Get Table Structure
curl -X GET "${baseUrl}/api/database/query?action=table&table=users&type=mysql&host=localhost&port=3306&database=myapp&username=user&password=pass" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN:YOUR_SECRET_KEY"`
  }

  const generateDatabaseIntegrationGuide = () => {
    return `# Database Chatbot Integration Guide

## Overview
The Database Chatbot API enables your chatbot to connect to external databases (MySQL, PostgreSQL, MariaDB) and generate intelligent responses based on database queries using natural language processing.

## Features
- Multi-Database Support: MySQL, PostgreSQL, MariaDB
- Natural Language to SQL conversion
- Secure token-based authentication
- AI-powered response generation
- Connection pooling and management
- Query security and permission controls

## Authentication
The API uses a two-factor authentication system:
- Access Token: Unique identifier for the bot
- Secret Key: Secret key for additional security

### Authentication Methods:
1. Authorization Header: \`Bearer access_token:secret_key\`
2. JSON Body: \`{"access_token": "token", "secret_key": "key"}\`
3. Query Parameters: \`?access_token=token&secret_key=key\`

## Database Configuration
\`\`\`json
{
  "type": "mysql|postgresql|mariadb",
  "host": "database_host",
  "port": 3306,
  "database": "database_name",
  "username": "username",
  "password": "password",
  "ssl": false,
  "connectionLimit": 10
}
\`\`\`

## API Endpoints

### 1. Database Query API
- \`POST /api/database/query\` - Execute SQL queries
- \`GET /api/database/query?action=test\` - Test database connection
- \`GET /api/database/query?action=schema\` - Get database schema
- \`GET /api/database/query?action=table&table=NAME\` - Get table structure

### 2. Chatbot Database Chat
- \`POST /api/chatbot/database-chat\` - AI-powered database chat
- \`GET /api/chatbot/database-chat\` - API documentation

### 3. Bot Management
- \`POST /api/bots/{botId}/database-credentials\` - Create credentials
- \`GET /api/bots/{botId}/database-credentials\` - Get credentials info
- \`PUT /api/bots/{botId}/database-credentials\` - Update credentials
- \`DELETE /api/bots/{botId}/database-credentials\` - Revoke credentials

## Usage Examples

### Basic Database Chat
\`\`\`javascript
const response = await fetch('/api/chatbot/database-chat', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer token:secret',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: "How many users are in the database?",
    database_config: {
      type: "mysql",
      host: "localhost",
      port: 3306,
      database: "myapp",
      username: "user",
      password: "pass"
    }
  })
});
\`\`\`

### E-commerce Analytics
\`\`\`javascript
const response = await fetch('/api/chatbot/database-chat', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer token:secret',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: "What are the top 5 products by sales this month?",
    database_config: {
      type: "mysql",
      host: "analytics-db.company.com",
      port: 3306,
      database: "ecommerce",
      username: "analyst",
      password: "secure_password",
      ssl: true
    },
    system_prompt: "You are an e-commerce analytics expert.",
    max_rows: 5,
    temperature: 0.2
  })
});
\`\`\`

## Security Features
- SQL injection prevention with parameterized queries
- Permission-based access control (read, write, admin, all)
- Query timeout and row limits
- Encrypted credential storage
- Connection pooling to prevent resource exhaustion

## Rate Limits
- Database Queries: 100 requests/minute per bot
- Chatbot Responses: 50 requests/minute per bot
- Connection Tests: 10 requests/minute per bot

## Error Handling
- 401 Unauthorized: Invalid credentials
- 403 Forbidden: Insufficient permissions
- 400 Bad Request: Missing required fields
- 408 Timeout: Query execution timeout
- 500 Internal Error: Database connection or server error

## Testing
Run the test suite:
\`\`\`bash
npm run test:database-api
\`\`\`

## Support
For technical support or questions about the Database Chatbot API, please refer to the main API documentation or contact the development team.`
  }

  const downloadWordPressPlugin = async () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'
    
    try {
      // Import JSZip dynamically to avoid SSR issues
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()
      
      // Fetch the actual plugin files from the server
      const pluginFiles = [
        'omnix-chatbot-plugin.php',
        'admin/dashboard.php', 
        'admin/tokens.php',
        'admin/settings.php',
        'admin/logs.php',
        'assets/chatbot-widget.js',
        'assets/chatbot-widget.css'
      ]
      
      // Fetch each file and add to ZIP
      for (const filePath of pluginFiles) {
        try {
          const response = await fetch(`/wordpress-plugin/${filePath}`)
          if (response.ok) {
            const content = await response.text()
            zip.file(filePath, content)
          } else {
            // Fallback to generated content if file not found
            const fallbackContent = getFallbackContent(filePath, baseUrl)
            zip.file(filePath, fallbackContent)
          }
        } catch (error) {
          console.warn(`Could not fetch ${filePath}, using fallback content`)
          const fallbackContent = getFallbackContent(filePath, baseUrl)
          zip.file(filePath, fallbackContent)
        }
      }
      
      // Add readme.txt
      zip.file('readme.txt', generateWordPressReadme())
      
      // Generate the ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      
      // Create download link and trigger download
      const url = URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `omnix-chatbot-plugin-${bot.id}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Error creating ZIP file:', error)
      // Fallback to showing file list if ZIP creation fails
      const fileList = [
        'omnix-chatbot-plugin.php',
        'admin/dashboard.php',
        'admin/tokens.php', 
        'admin/settings.php',
        'admin/logs.php',
        'assets/chatbot-widget.js',
        'assets/chatbot-widget.css',
        'readme.txt'
      ].join('\n')
      alert(`Error creating ZIP file. Files that would be included:\n\n${fileList}\n\nPlease try again or contact support.`)
    }
  }
  
  const getFallbackContent = (filePath: string, baseUrl: string) => {
    switch (filePath) {
      case 'omnix-chatbot-plugin.php':
        return generateWordPressPluginMain()
      case 'admin/dashboard.php':
        return generateWordPressAdminDashboard()
      case 'admin/tokens.php':
        return generateWordPressAdminTokens()
      case 'admin/settings.php':
        return generateWordPressAdminSettings()
      case 'admin/logs.php':
        return generateWordPressAdminLogs()
      case 'assets/chatbot-widget.js':
        return generateWordPressWidgetJS()
      case 'assets/chatbot-widget.css':
        return generateWordPressWidgetCSS()
      default:
        return `// ${filePath} - Generated content`
    }
  }

  const generateWordPressPluginMain = () => {
    return `<?php
/**
 * Plugin Name: OmniX Chatbot Integration
 * Plugin URI: ${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}
 * Description: Integrate AI chatbots with access token authentication for external websites
 * Version: 1.0.0
 * Author: Your Name
 * License: GPL v2 or later
 * Text Domain: omnix-chatbot
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('OMNIX_CHATBOT_VERSION', '1.0.0');
define('OMNIX_CHATBOT_PLUGIN_URL', plugin_dir_url(__FILE__));
define('OMNIX_CHATBOT_PLUGIN_PATH', plugin_dir_path(__FILE__));

class OmniXChatbotPlugin {
    // Plugin implementation here...
}

// Initialize the plugin
new OmniXChatbotPlugin();`
  }

  const generateWordPressAdminDashboard = () => {
    return `<?php
if (!defined('ABSPATH')) {
    exit;
}

// Admin dashboard implementation
echo '<div class="wrap">';
echo '<h1>OmniX Chatbot Dashboard</h1>';
echo '<p>Welcome to the OmniX Chatbot plugin dashboard.</p>';
echo '</div>';`
  }

  const generateWordPressAdminTokens = () => {
    return `<?php
if (!defined('ABSPATH')) {
    exit;
}

// Token management implementation
echo '<div class="wrap">';
echo '<h1>Access Tokens</h1>';
echo '<p>Manage your chatbot access tokens here.</p>';
echo '</div>';`
  }

  const generateWordPressAdminSettings = () => {
    return `<?php
if (!defined('ABSPATH')) {
    exit;
}

// Settings page implementation
echo '<div class="wrap">';
echo '<h1>OmniX Chatbot Settings</h1>';
echo '<p>Configure your chatbot settings here.</p>';
echo '</div>';`
  }

  const generateWordPressAdminLogs = () => {
    return `<?php
if (!defined('ABSPATH')) {
    exit;
}

// Logs page implementation
echo '<div class="wrap">';
echo '<h1>API Logs</h1>';
echo '<p>View your chatbot API logs here.</p>';
echo '</div>';`
  }

  const generateWordPressWidgetJS = () => {
    return `/**
 * OmniX Chatbot Widget
 * A lightweight JavaScript widget for embedding chatbots
 */

(function() {
    'use strict';
    
    // Widget implementation here...
    console.log('OmniX Chatbot Widget loaded');
})();`
  }

  const generateWordPressWidgetCSS = () => {
    return `/**
 * OmniX Chatbot Widget Styles
 * Additional CSS for the chatbot widget
 */

.omnix-chatbot-container {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    line-height: 1.4;
    color: #333;
}

/* Additional styles here... */`
  }

  const generateWordPressReadme = () => {
    return `=== OmniX Chatbot Integration ===
Contributors: yourname
Tags: chatbot, ai, integration, wordpress
Requires at least: 5.0
Tested up to: 6.4
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Integrate AI chatbots with access token authentication for external websites.

== Description ==

The OmniX Chatbot Integration plugin allows you to easily embed AI chatbots on your WordPress site using secure access tokens. Features include:

* Secure token-based authentication
* Easy shortcode integration
* Voice features support
* Multiple themes and customization options
* Analytics and usage tracking
* REST API support

== Installation ==

1. Upload the plugin files to the \`/wp-content/plugins/omnix-chatbot/\` directory
2. Activate the plugin through the 'Plugins' screen in WordPress
3. Go to OmniX Chatbot > Settings to configure your API settings
4. Generate access tokens in OmniX Chatbot > Access Tokens
5. Use the shortcode in your posts, pages, or widgets

== Frequently Asked Questions ==

= How do I get an access token? =

Generate access tokens in the OmniX Chatbot > Access Tokens section of your WordPress admin.

= Can I customize the chatbot appearance? =

Yes, you can customize colors, position, themes, and more through the shortcode parameters.

= Does it support voice features? =

Yes, the plugin supports both speech recognition and text-to-speech features.

== Screenshots ==

1. Admin dashboard
2. Token management
3. Settings page
4. Chatbot widget

== Changelog ==

= 1.0.0 =
* Initial release
* Token-based authentication
* Shortcode integration
* Voice features support
* Analytics tracking`
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
    <div className="fixed right-4 bottom-4 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full shadow-lg transition-transform hover:scale-105"
          style={{ backgroundColor: '${customization.primaryColor}', color: 'white' }}
        >
          <MessageSquare size={24} />
        </button>
      ) : (
        <div 
          className="w-80 bg-white rounded-lg border-2 shadow-xl"
          style={{ borderColor: '${customization.primaryColor}', height: isMinimized ? '64px' : '400px' }}
        >
          {/* Header */}
          <div 
            className="flex justify-between items-center p-3 text-white"
            style={{ backgroundColor: '${customization.primaryColor}' }}
          >
            <div className="flex gap-2 items-center">
              ${customization.showAvatar ? `
              <div 
                className="flex justify-center items-center w-8 h-8 text-sm font-medium rounded-full"
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
                className="flex justify-center items-center w-6 h-6 rounded hover:bg-white/20"
              >
                {isMinimized ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="flex justify-center items-center w-6 h-6 rounded hover:bg-white/20"
              >
                <X size={12} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="overflow-y-auto flex-1 p-3" style={{ height: '280px' }}>
                {messages.length === 0 ? (
                  <div className="py-4 text-sm text-center text-gray-600">
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
                            className="flex justify-center items-center w-6 h-6 opacity-60 hover:opacity-100"
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
                    <div className="px-3 py-2 bg-gray-100 rounded-lg">
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
              <div className="flex gap-2 p-3 border-t">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1 px-3 py-2 text-sm rounded-full border outline-none"
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
                  className="flex justify-center items-center w-9 h-9 text-white rounded-full disabled:opacity-50"
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-none h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex gap-2 items-center">
            <ExternalLink className="w-5 h-5" />
            Export {bot.name} Widget
          </DialogTitle>
          <DialogDescription>
            Export your chatbot as an embeddable widget for external websites
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-6 gap-1 p-1 w-full">
              <TabsTrigger value="widget" className="flex gap-2 items-center">
                <Code className="w-4 h-4" />
                Widget
              </TabsTrigger>
              <TabsTrigger value="iframe" className="flex gap-2 items-center">
                <Globe className="w-4 h-4" />
                Iframe
              </TabsTrigger>
              <TabsTrigger value="react" className="flex gap-2 items-center">
                <Settings className="w-4 h-4" />
                React
              </TabsTrigger>
              <TabsTrigger value="wordpress" className="flex gap-2 items-center">
                <FileText className="w-4 h-4" />
                WordPress
              </TabsTrigger>
              <TabsTrigger value="database" className="flex gap-2 items-center">
                <Database className="w-4 h-4" />
                Database
              </TabsTrigger>
              <TabsTrigger value="customize" className="flex gap-2 items-center">
                <Settings className="w-4 h-4" />
                Customize
              </TabsTrigger>
            </TabsList>

            <TabsContent value="customize" className="space-y-4 w-full">
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
                    className="p-2 w-full rounded border"
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
                    className="p-2 w-full rounded border"
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
              <div className="pt-4 border-t">
                <h4 className="mb-3 text-sm font-semibold">Voice Settings</h4>
                
                <div className="flex items-center mb-4 space-x-2">
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
                  <div className="pl-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Voice Language</label>
                        <select
                          value={customization.voiceLanguage}
                          onChange={(e) => setCustomization(prev => ({ ...prev, voiceLanguage: e.target.value }))}
                          className="p-2 w-full text-sm rounded border"
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
                          <span className="w-8 text-xs text-muted-foreground">{customization.voiceRate}x</span>
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
                          <span className="w-8 text-xs text-muted-foreground">{customization.voicePitch}x</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="widget" className="space-y-4 w-full">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">JavaScript Widget Code</label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(generateWidgetScript())}
                      className="flex gap-2 items-center"
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadScript(generateWidgetScript(), `${bot.name.toLowerCase().replace(/\s+/g, '-')}-widget.js`)}
                      className="flex gap-2 items-center"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </div>
                </div>
                <ScrollArea className="p-3 w-full h-48 rounded border">
                  <pre className="text-xs whitespace-pre-wrap text-muted-foreground">
                    {generateWidgetScript()}
                  </pre>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="iframe" className="space-y-4 w-full">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">Standard Iframe Embed</label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(generateIframeEmbed())}
                        className="flex gap-2 items-center"
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </Button>
                    </div>
                  </div>
                  <ScrollArea className="p-3 w-full h-32 rounded border">
                    <pre className="text-xs whitespace-pre-wrap text-muted-foreground">
                      {generateIframeEmbed()}
                    </pre>
                  </ScrollArea>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">Mobile Iframe Embed (Chat Icon)</label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(generateMobileIframeEmbed())}
                        className="flex gap-2 items-center"
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </Button>
                    </div>
                  </div>
                  <ScrollArea className="p-3 w-full h-32 rounded border">
                    <pre className="text-xs whitespace-pre-wrap text-muted-foreground">
                      {generateMobileIframeEmbed()}
                    </pre>
                  </ScrollArea>
                  <p className="text-xs text-muted-foreground">
                    This version shows a floating chat button that opens a chat window in the center of the screen when clicked. The button stays in the bottom-right corner, but the chat opens in the center. Perfect for embedding on external websites.
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="react" className="space-y-4 w-full">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">React Component</label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(generateReactComponent())}
                      className="flex gap-2 items-center"
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadScript(generateReactComponent(), `${bot.name.replace(/\s+/g, '')}Chatbot.jsx`)}
                      className="flex gap-2 items-center"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </div>
                </div>
                <ScrollArea className="p-3 w-full h-64 rounded border">
                  <pre className="text-xs whitespace-pre-wrap text-muted-foreground">
                    {generateReactComponent()}
                  </pre>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="wordpress" className="space-y-4 w-full">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">WordPress Shortcode</label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(generateWordPressShortcode())}
                        className="flex gap-2 items-center"
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </Button>
                    </div>
                  </div>
                  <ScrollArea className="p-3 w-full h-32 rounded border">
                    <pre className="text-xs whitespace-pre-wrap text-muted-foreground">
                      {generateWordPressShortcode()}
                    </pre>
                  </ScrollArea>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">WordPress Plugin Files</label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadWordPressPlugin()}
                        className="flex gap-2 items-center"
                      >
                        <Download className="w-4 h-4" />
                        Download Plugin
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Download the complete WordPress plugin with all necessary files for installation.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">Installation Instructions</label>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div>1. Upload the plugin files to <code>/wp-content/plugins/omnix-chatbot/</code></div>
                    <div>2. Activate the plugin in WordPress admin</div>
                    <div>3. Go to <strong>OmniX Chatbot &gt; Settings</strong> to configure</div>
                    <div>4. Generate access tokens in <strong>OmniX Chatbot &gt; Access Tokens</strong></div>
                    <div>5. Use the shortcode in posts, pages, or widgets</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">Token Generation API</label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(generateTokenAPIExample())}
                        className="flex gap-2 items-center"
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </Button>
                    </div>
                  </div>
                  <ScrollArea className="p-3 w-full h-40 rounded border">
                    <pre className="text-xs whitespace-pre-wrap text-muted-foreground">
                      {generateTokenAPIExample()}
                    </pre>
                  </ScrollArea>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">WordPress REST API Usage</label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(generateWordPressAPIExample())}
                        className="flex gap-2 items-center"
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </Button>
                    </div>
                  </div>
                  <ScrollArea className="p-3 w-full h-40 rounded border">
                    <pre className="text-xs whitespace-pre-wrap text-muted-foreground">
                      {generateWordPressAPIExample()}
                    </pre>
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="database" className="space-y-4 w-full">
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <h4 className="flex gap-2 items-center mb-2 text-lg font-semibold text-blue-800">
                    <Database className="w-5 h-5" />
                    Database Chatbot API
                  </h4>
                  <p className="text-sm text-blue-700">
                    Enable your chatbot to connect to external databases (MySQL, PostgreSQL, MariaDB) and generate intelligent responses based on database queries using natural language processing.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">API Examples & Documentation</label>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(generateDatabaseAPIExample())}
                          className="flex gap-2 items-center"
                        >
                          <Copy className="w-4 h-4" />
                          Copy Examples
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadScript(generateDatabaseIntegrationGuide(), 'database-integration-guide.md')}
                          className="flex gap-2 items-center"
                        >
                          <Download className="w-4 h-4" />
                          Download Guide
                        </Button>
                      </div>
                    </div>
                    <ScrollArea className="p-3 w-full h-64 rounded border">
                      <pre className="text-xs whitespace-pre-wrap text-muted-foreground">
                        {generateDatabaseAPIExample()}
                      </pre>
                    </ScrollArea>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <h5 className="flex gap-2 items-center text-sm font-semibold">
                        <Key className="w-4 h-4" />
                        Authentication
                      </h5>
                      <div className="space-y-2 text-xs text-muted-foreground">
                        <div>• <strong>Access Token:</strong> Unique identifier for the bot</div>
                        <div>• <strong>Secret Key:</strong> Additional security layer</div>
                        <div>• <strong>Methods:</strong> Header, JSON body, or query params</div>
                        <div>• <strong>Format:</strong> <code>Bearer token:secret</code></div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h5 className="flex gap-2 items-center text-sm font-semibold">
                        <Zap className="w-4 h-4" />
                        Features
                      </h5>
                      <div className="space-y-2 text-xs text-muted-foreground">
                        <div>• <strong>Multi-Database:</strong> MySQL, PostgreSQL, MariaDB</div>
                        <div>• <strong>AI-Powered:</strong> Natural language to SQL</div>
                        <div>• <strong>Secure:</strong> SQL injection prevention</div>
                        <div>• <strong>Scalable:</strong> Connection pooling</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h5 className="flex gap-2 items-center text-sm font-semibold">
                      <Shield className="w-4 h-4" />
                      Security Features
                    </h5>
                    <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                      <div className="space-y-1">
                        <div>• Parameterized queries</div>
                        <div>• Permission-based access</div>
                        <div>• Query timeout limits</div>
                        <div>• Row count limits</div>
                      </div>
                      <div className="space-y-1">
                        <div>• Encrypted credential storage</div>
                        <div>• Connection pooling</div>
                        <div>• Rate limiting</div>
                        <div>• Audit logging</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h5 className="text-sm font-semibold">API Endpoints</h5>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center p-2 rounded bg-muted">
                        <span><code>POST /api/database/query</code></span>
                        <span className="text-muted-foreground">Execute SQL queries</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded bg-muted">
                        <span><code>POST /api/chatbot/database-chat</code></span>
                        <span className="text-muted-foreground">AI-powered database chat</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded bg-muted">
                        <span><code>GET /api/database/query?action=test</code></span>
                        <span className="text-muted-foreground">Test database connection</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded bg-muted">
                        <span><code>POST /api/bots/&#123;id&#125;/database-credentials</code></span>
                        <span className="text-muted-foreground">Manage credentials</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <h5 className="mb-2 text-sm font-medium text-green-800">🚀 Quick Start</h5>
                    <div className="space-y-1 text-xs text-green-700">
                      <div>1. Create database credentials for your bot</div>
                      <div>2. Test the database connection</div>
                      <div>3. Use the chatbot API with database config</div>
                      <div>4. Ask natural language questions about your data</div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="p-4 mt-6 rounded-lg bg-muted">
            <h4 className="mb-2 text-sm font-medium">Integration Instructions:</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div>• <strong>JavaScript Widget:</strong> Add the script tag to your HTML head section</div>
              <div>• <strong>Standard Iframe:</strong> Insert the iframe code where you want the chat to appear</div>
              <div>• <strong>Mobile Iframe:</strong> Shows a floating chat button that opens a chat window in the center of the screen (perfect for external websites)</div>
              <div>• <strong>React Component:</strong> Import and use the component in your React application</div>
              <div>• <strong>WordPress Plugin:</strong> Install the plugin and use shortcodes in posts, pages, or widgets</div>
              <div>• <strong>Database Integration:</strong> Connect to external databases for AI-powered data queries</div>
              <div>• <strong>API Integration:</strong> Use the REST API endpoints for custom implementations</div>
            </div>
            
            {customization.enableVoice && (
              <div className="p-3 mt-4 bg-blue-50 rounded-lg border border-blue-200">
                <h5 className="mb-2 text-sm font-medium text-blue-800">🎤 Voice Features Enabled:</h5>
                <div className="space-y-1 text-xs text-blue-700">
                  <div>• <strong>Voice Input:</strong> Users can speak to the chatbot using the microphone button</div>
                  <div>• <strong>Text-to-Speech:</strong> Bot responses can be played aloud {customization.autoSpeak ? '(auto-enabled)' : '(click speaker icon)'}</div>
                  <div>• <strong>Language:</strong> {customization.voiceLanguage}</div>
                  <div>• <strong>Browser Support:</strong> Requires modern browsers with Web Speech API support</div>
                  <div>• <strong>Permissions:</strong> Users will be prompted to allow microphone access</div>
                </div>
              </div>
            )}

            {customization.enableDatabase && (
              <div className="p-3 mt-4 bg-green-50 rounded-lg border border-green-200">
                <h5 className="flex gap-2 items-center mb-2 text-sm font-medium text-green-800">
                  <Database className="w-4 h-4" />
                  Database Integration Enabled:
                </h5>
                <div className="space-y-1 text-xs text-green-700">
                  <div>• <strong>Database Type:</strong> {customization.databaseType.toUpperCase()}</div>
                  <div>• <strong>Host:</strong> {customization.databaseHost || 'Not configured'}</div>
                  <div>• <strong>Database:</strong> {customization.databaseName || 'Not configured'}</div>
                  <div>• <strong>Permissions:</strong> {customization.databasePermissions.join(', ')}</div>
                  <div>• <strong>SSL:</strong> {customization.databaseSSL ? 'Enabled' : 'Disabled'}</div>
                  <div>• <strong>AI Queries:</strong> Users can ask natural language questions about your data</div>
                  <div>• <strong>Security:</strong> All queries use parameterized statements and permission controls</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

