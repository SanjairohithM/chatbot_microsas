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

  const [selectedLanguage, setSelectedLanguage] = useState('curl')

  const generateCurlExamples = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'
    
    return `# cURL Examples for Smart Database Chatbot API

# ========================================
# 1. Smart Database Chat (Auto-Detection)
# ========================================

# Smart Database Chat - Automatically detects database queries
curl -X POST "${baseUrl}/api/chatbot/smart-database-chat" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "How many active users do we have?",
    "bot_id": ${bot.id},
    "database_config": {
      "type": "mysql",
      "host": "localhost",
      "port": 3306,
      "database": "myapp",
      "username": "user",
      "password": "pass"
    }
  }'

# Smart Chat with Query Type Detection
curl -X POST "${baseUrl}/api/chatbot/smart-database-chat" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "What are the top selling products this month?",
    "bot_id": ${bot.id},
    "database_config": {
      "type": "mysql",
      "host": "localhost",
      "port": 3306,
      "database": "myapp",
      "username": "user",
      "password": "pass"
    }
  }'

# Smart Chat without Database Config (Returns Suggestions)
curl -X POST "${baseUrl}/api/chatbot/smart-database-chat" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "Show me sales data",
    "bot_id": ${bot.id}
  }'

# ========================================
# 2. Token Management
# ========================================

# Create Access Token for Bot
curl -X POST "${baseUrl}/api/bots/${bot.id}/tokens" \\
  -H "Content-Type: application/json" \\
  -d '{
    "token_name": "Database Integration Token",
    "permissions": ["read", "write"],
    "expires_in_days": 365,
    "description": "Token for database integration"
  }'

# List All Tokens for Bot
curl -X GET "${baseUrl}/api/bots/${bot.id}/tokens?page=1&limit=10&status=active"

# Validate Token
curl -X POST "${baseUrl}/api/bots/${bot.id}/tokens/validate" \\
  -H "Content-Type: application/json" \\
  -d '{
    "access_token": "YOUR_ACCESS_TOKEN",
    "secret_key": "YOUR_SECRET_KEY"
  }'

# ========================================
# 3. Direct Database Operations
# ========================================

# Test Database Connection
curl -X GET "${baseUrl}/api/database/query?action=test&type=mysql&host=localhost&port=3306&database=myapp&username=user&password=pass" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN:YOUR_SECRET_KEY"

# Execute Direct SQL Query
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

# AI-Powered Database Chat (Traditional)
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
  }'`
  }

  const generateNodeJSExamples = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'
    
    return `// Node.js Examples for Smart Database Chatbot API
const axios = require('axios');

const baseUrl = '${baseUrl}';
const accessToken = 'YOUR_ACCESS_TOKEN';
const secretKey = 'YOUR_SECRET_KEY';
const authHeader = \`Bearer \${accessToken}:\${secretKey}\`;

// ========================================
// 1. Smart Database Chat (Auto-Detection)
// ========================================

// Smart Database Chat - Automatically detects database queries
async function smartDatabaseChat() {
  try {
    const response = await axios.post(\`\${baseUrl}/api/chatbot/smart-database-chat\`, {
      message: 'How many active users do we have?',
      bot_id: ${bot.id},
      database_config: {
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        database: 'myapp',
        username: 'user',
        password: 'pass'
      }
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('Smart Chat Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Smart chat failed:', error.response?.data || error.message);
  }
}

// Smart Chat with Different Query Types
async function testQueryTypes() {
  const queries = [
    'How many users do we have?', // Count query
    'What are the top selling products?', // Select query
    'What is the average order value?', // Aggregation query
    'Show me today\\'s orders', // Time-based query
    'Compare this month vs last month', // Comparison query
    'Group sales by category' // Grouping query
  ];

  for (const query of queries) {
    try {
      const response = await axios.post(\`\${baseUrl}/api/chatbot/smart-database-chat\`, {
        message: query,
        bot_id: ${bot.id},
        database_config: {
          type: 'mysql',
          host: 'localhost',
          port: 3306,
          database: 'myapp',
          username: 'user',
          password: 'pass'
        }
      });
      console.log(\`Query: \${query}\`);
      console.log(\`Type: \${response.data.query_type}\`);
      console.log(\`Response: \${response.data.message}\`);
      console.log('---');
    } catch (error) {
      console.error(\`Query failed for "\${query}":\`, error.response?.data || error.message);
    }
  }
}

// Smart Chat without Database Config (Gets Suggestions)
async function getQuerySuggestions() {
  try {
    const response = await axios.post(\`\${baseUrl}/api/chatbot/smart-database-chat\`, {
      message: 'Show me sales data',
      bot_id: ${bot.id}
    });
    console.log('Suggestions:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to get suggestions:', error.response?.data || error.message);
  }
}

// ========================================
// 2. Token Management
// ========================================

// Create Access Token for Bot
async function createToken() {
  try {
    const response = await axios.post(\`\${baseUrl}/api/bots/${bot.id}/tokens\`, {
      token_name: 'Database Integration Token',
      permissions: ['read', 'write'],
      expires_in_days: 365,
      description: 'Token for database integration'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('Token created:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to create token:', error.response?.data || error.message);
  }
}

// List All Tokens for Bot
async function listTokens() {
  try {
    const response = await axios.get(\`\${baseUrl}/api/bots/${bot.id}/tokens\`, {
      params: {
        page: 1,
        limit: 10,
        status: 'active'
      }
    });
    console.log('Tokens:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to list tokens:', error.response?.data || error.message);
  }
}

// ========================================
// 3. Traditional Database Operations
// ========================================

// AI-Powered Database Chat (Traditional)
async function traditionalDatabaseChat() {
  try {
    const response = await axios.post(\`\${baseUrl}/api/chatbot/database-chat\`, {
      message: 'How many active users do we have?',
      database_config: {
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        database: 'myapp',
        username: 'user',
        password: 'pass'
      }
    }, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });
    console.log('Traditional Chat Response:', response.data);
  } catch (error) {
    console.error('Traditional chat failed:', error.response?.data || error.message);
  }
}

// Execute Direct SQL Query
async function executeQuery() {
  try {
    const response = await axios.post(\`\${baseUrl}/api/database/query\`, {
      database_config: {
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        database: 'myapp',
        username: 'user',
        password: 'pass'
      },
      query: 'SELECT COUNT(*) as user_count FROM users WHERE active = ?',
      params: [true]
    }, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });
    console.log('Query result:', response.data);
  } catch (error) {
    console.error('Query failed:', error.response?.data || error.message);
  }
}

// Run examples
async function runExamples() {
  console.log('=== Smart Database Chat Examples ===');
  await smartDatabaseChat();
  await testQueryTypes();
  await getQuerySuggestions();
  
  console.log('\\n=== Token Management ===');
  await createToken();
  await listTokens();
  
  console.log('\\n=== Traditional Database Operations ===');
  await traditionalDatabaseChat();
  await executeQuery();
}

runExamples();`
  }

  const generatePHPExamples = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'
    
    return `<?php
// PHP Examples for Database Chatbot API
$baseUrl = '${baseUrl}';
$accessToken = 'YOUR_ACCESS_TOKEN';
$secretKey = 'YOUR_SECRET_KEY';
$authHeader = "Bearer $accessToken:$secretKey";

// Test Database Connection
function testDatabaseConnection() {
    global $baseUrl, $authHeader;
    
    $url = $baseUrl . '/api/database/query?' . http_build_query([
        'action' => 'test',
        'type' => 'mysql',
        'host' => 'localhost',
        'port' => 3306,
        'database' => 'myapp',
        'username' => 'user',
        'password' => 'pass'
    ]);
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: $authHeader"
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        echo "Connection test: " . $response . "\n";
    } else {
        echo "Connection test failed: " . $response . "\n";
    }
}

// Execute SQL Query
function executeQuery() {
    global $baseUrl, $authHeader;
    
    $data = [
        'database_config' => [
            'type' => 'mysql',
            'host' => 'localhost',
            'port' => 3306,
            'database' => 'myapp',
            'username' => 'user',
            'password' => 'pass'
        ],
        'query' => 'SELECT COUNT(*) as user_count FROM users WHERE active = ?',
        'params' => [true]
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $baseUrl . '/api/database/query');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: $authHeader",
        "Content-Type: application/json"
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        echo "Query result: " . $response . "\n";
    } else {
        echo "Query failed: " . $response . "\n";
    }
}

// AI-Powered Database Chat
function databaseChat() {
    global $baseUrl, $authHeader;
    
    $data = [
        'message' => 'How many active users do we have?',
        'database_config' => [
            'type' => 'mysql',
            'host' => 'localhost',
            'port' => 3306,
            'database' => 'myapp',
            'username' => 'user',
            'password' => 'pass'
        ]
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $baseUrl . '/api/chatbot/database-chat');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: $authHeader",
        "Content-Type: application/json"
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        echo "AI Response: " . $response . "\n";
    } else {
        echo "Chat failed: " . $response . "\n";
    }
}

// Create Database Credentials
function createCredentials() {
    global $baseUrl, $authHeader;
    
    $data = [
        'permissions' => ['read', 'write'],
        'expires_in_days' => 365
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $baseUrl . '/api/bots/${bot.id}/database-credentials');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: $authHeader",
        "Content-Type: application/json"
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        echo "Credentials created: " . $response . "\n";
    } else {
        echo "Failed to create credentials: " . $response . "\n";
    }
}

// Run examples
testDatabaseConnection();
executeQuery();
databaseChat();
createCredentials();
?>`
  }

  const generatePythonExamples = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'
    
    return `# Python Examples for Database Chatbot API
import requests
import json

base_url = '${baseUrl}'
access_token = 'YOUR_ACCESS_TOKEN'
secret_key = 'YOUR_SECRET_KEY'
auth_header = f'Bearer {access_token}:{secret_key}'

# Test Database Connection
def test_database_connection():
    url = f'{base_url}/api/database/query'
    params = {
        'action': 'test',
        'type': 'mysql',
        'host': 'localhost',
        'port': 3306,
        'database': 'myapp',
        'username': 'user',
        'password': 'pass'
    }
    
    headers = {'Authorization': auth_header}
    
    try:
        response = requests.get(url, params=params, headers=headers)
        response.raise_for_status()
        print(f"Connection test: {response.json()}")
    except requests.exceptions.RequestException as e:
        print(f"Connection test failed: {e}")

# Execute SQL Query
def execute_query():
    url = f'{base_url}/api/database/query'
    data = {
        'database_config': {
            'type': 'mysql',
            'host': 'localhost',
            'port': 3306,
            'database': 'myapp',
            'username': 'user',
            'password': 'pass'
        },
        'query': 'SELECT COUNT(*) as user_count FROM users WHERE active = ?',
        'params': [True]
    }
    
    headers = {
        'Authorization': auth_header,
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.post(url, json=data, headers=headers)
        response.raise_for_status()
        print(f"Query result: {response.json()}")
    except requests.exceptions.RequestException as e:
        print(f"Query failed: {e}")

# AI-Powered Database Chat
def database_chat():
    url = f'{base_url}/api/chatbot/database-chat'
    data = {
        'message': 'How many active users do we have?',
        'database_config': {
            'type': 'mysql',
            'host': 'localhost',
            'port': 3306,
            'database': 'myapp',
            'username': 'user',
            'password': 'pass'
        }
    }
    
    headers = {
        'Authorization': auth_header,
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.post(url, json=data, headers=headers)
        response.raise_for_status()
        print(f"AI Response: {response.json()}")
    except requests.exceptions.RequestException as e:
        print(f"Chat failed: {e}")

# Create Database Credentials
def create_credentials():
    url = f'{base_url}/api/bots/${bot.id}/database-credentials'
    data = {
        'permissions': ['read', 'write'],
        'expires_in_days': 365
    }
    
    headers = {
        'Authorization': auth_header,
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.post(url, json=data, headers=headers)
        response.raise_for_status()
        print(f"Credentials created: {response.json()}")
    except requests.exceptions.RequestException as e:
        print(f"Failed to create credentials: {e}")

# Run examples
if __name__ == "__main__":
    test_database_connection()
    execute_query()
    database_chat()
    create_credentials()`
  }

  const generateGolangExamples = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'
    
    return `// Golang Examples for Database Chatbot API
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "net/url"
)

const (
    baseURL     = "${baseUrl}"
    accessToken = "YOUR_ACCESS_TOKEN"
    secretKey   = "YOUR_SECRET_KEY"
)

var authHeader = fmt.Sprintf("Bearer %s:%s", accessToken, secretKey)

// Test Database Connection
func testDatabaseConnection() {
    params := url.Values{}
    params.Add("action", "test")
    params.Add("type", "mysql")
    params.Add("host", "localhost")
    params.Add("port", "3306")
    params.Add("database", "myapp")
    params.Add("username", "user")
    params.Add("password", "pass")
    
    url := fmt.Sprintf("%s/api/database/query?%s", baseURL, params.Encode())
    
    req, err := http.NewRequest("GET", url, nil)
    if err != nil {
        fmt.Printf("Error creating request: %v\n", err)
        return
    }
    
    req.Header.Set("Authorization", authHeader)
    
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        fmt.Printf("Connection test failed: %v\n", err)
        return
    }
    defer resp.Body.Close()
    
    body, err := io.ReadAll(resp.Body)
    if err != nil {
        fmt.Printf("Error reading response: %v\n", err)
        return
    }
    
    if resp.StatusCode == 200 {
        fmt.Printf("Connection test: %s\n", string(body))
    } else {
        fmt.Printf("Connection test failed: %s\n", string(body))
    }
}

// Execute SQL Query
func executeQuery() {
    data := map[string]interface{}{
        "database_config": map[string]interface{}{
            "type":     "mysql",
            "host":     "localhost",
            "port":     3306,
            "database": "myapp",
            "username": "user",
            "password": "pass",
        },
        "query":  "SELECT COUNT(*) as user_count FROM users WHERE active = ?",
        "params": []interface{}{true},
    }
    
    jsonData, err := json.Marshal(data)
    if err != nil {
        fmt.Printf("Error marshaling data: %v\n", err)
        return
    }
    
    url := fmt.Sprintf("%s/api/database/query", baseURL)
    req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
    if err != nil {
        fmt.Printf("Error creating request: %v\n", err)
        return
    }
    
    req.Header.Set("Authorization", authHeader)
    req.Header.Set("Content-Type", "application/json")
    
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        fmt.Printf("Query failed: %v\n", err)
        return
    }
    defer resp.Body.Close()
    
    body, err := io.ReadAll(resp.Body)
    if err != nil {
        fmt.Printf("Error reading response: %v\n", err)
        return
    }
    
    if resp.StatusCode == 200 {
        fmt.Printf("Query result: %s\n", string(body))
    } else {
        fmt.Printf("Query failed: %s\n", string(body))
    }
}

// AI-Powered Database Chat
func databaseChat() {
    data := map[string]interface{}{
        "message": "How many active users do we have?",
        "database_config": map[string]interface{}{
            "type":     "mysql",
            "host":     "localhost",
            "port":     3306,
            "database": "myapp",
            "username": "user",
            "password": "pass",
        },
    }
    
    jsonData, err := json.Marshal(data)
    if err != nil {
        fmt.Printf("Error marshaling data: %v\n", err)
        return
    }
    
    url := fmt.Sprintf("%s/api/chatbot/database-chat", baseURL)
    req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
    if err != nil {
        fmt.Printf("Error creating request: %v\n", err)
        return
    }
    
    req.Header.Set("Authorization", authHeader)
    req.Header.Set("Content-Type", "application/json")
    
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        fmt.Printf("Chat failed: %v\n", err)
        return
    }
    defer resp.Body.Close()
    
    body, err := io.ReadAll(resp.Body)
    if err != nil {
        fmt.Printf("Error reading response: %v\n", err)
        return
    }
    
    if resp.StatusCode == 200 {
        fmt.Printf("AI Response: %s\n", string(body))
    } else {
        fmt.Printf("Chat failed: %s\n", string(body))
    }
}

// Create Database Credentials
func createCredentials() {
    data := map[string]interface{}{
        "permissions":      []string{"read", "write"},
        "expires_in_days": 365,
    }
    
    jsonData, err := json.Marshal(data)
    if err != nil {
        fmt.Printf("Error marshaling data: %v\n", err)
        return
    }
    
    url := fmt.Sprintf("%s/api/bots/${bot.id}/database-credentials", baseURL)
    req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
    if err != nil {
        fmt.Printf("Error creating request: %v\n", err)
        return
    }
    
    req.Header.Set("Authorization", authHeader)
    req.Header.Set("Content-Type", "application/json")
    
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        fmt.Printf("Failed to create credentials: %v\n", err)
        return
    }
    defer resp.Body.Close()
    
    body, err := io.ReadAll(resp.Body)
    if err != nil {
        fmt.Printf("Error reading response: %v\n", err)
        return
    }
    
    if resp.StatusCode == 200 {
        fmt.Printf("Credentials created: %s\n", string(body))
    } else {
        fmt.Printf("Failed to create credentials: %s\n", string(body))
    }
}

func main() {
    testDatabaseConnection()
    executeQuery()
    databaseChat()
    createCredentials()
}`
  }

  const getCurrentLanguageContent = () => {
    switch (selectedLanguage) {
      case 'curl':
        return generateCurlExamples()
      case 'nodejs':
        return generateNodeJSExamples()
      case 'php':
        return generatePHPExamples()
      case 'python':
        return generatePythonExamples()
      case 'golang':
        return generateGolangExamples()
      default:
        return generateCurlExamples()
    }
  }

  const generateTokenIntegrationGuide = () => {
    return `# Access Token & Secret Key Management Guide

## Overview
The Access Token and Secret Key Management system provides secure authentication for your chatbot APIs. Each bot can have multiple tokens with different permissions and expiration dates.

## Features
- **Secure Token Generation**: Cryptographically secure access tokens and secret keys
- **Permission System**: Granular access control (read, write, admin, all)
- **Expiration Control**: Configurable token lifetime (1-365 days)
- **Token Management**: Create, list, update, validate, and revoke tokens
- **Usage Tracking**: Monitor token usage and last access times

## Authentication Methods
1. **Authorization Header**: \`Bearer access_token:secret_key\`
2. **JSON Body**: \`{"access_token": "token", "secret_key": "key"}\`
3. **Query Parameters**: \`?access_token=token&secret_key=key\`

## API Endpoints

### Token Management
- \`POST /api/bots/{botId}/tokens\` - Create new token
- \`GET /api/bots/{botId}/tokens\` - List all tokens
- \`PUT /api/bots/{botId}/tokens\` - Update token
- \`DELETE /api/bots/{botId}/tokens\` - Revoke token
- \`POST /api/bots/{botId}/tokens/validate\` - Validate token

### Token Permissions
- **read**: Read-only access to bot data
- **write**: Read and write access to bot data
- **admin**: Full administrative access
- **all**: All permissions (equivalent to admin)

## Security Best Practices
1. **Store Securely**: Keep tokens in secure environment variables
2. **Rotate Regularly**: Update tokens periodically
3. **Minimal Permissions**: Use least privilege principle
4. **Monitor Usage**: Track token usage and revoke unused tokens
5. **Secure Transmission**: Always use HTTPS

## Rate Limits
- Token Creation: 10 tokens per bot per hour
- Token Validation: 100 requests per minute per token
- Token Management: 50 requests per minute per bot

## Error Handling
- 400 Bad Request: Invalid token data or missing fields
- 401 Unauthorized: Invalid or expired token
- 403 Forbidden: Insufficient permissions
- 404 Not Found: Token or bot not found
- 429 Too Many Requests: Rate limit exceeded

## Examples
See the language-specific examples in the embeddable widget for complete implementation details in cURL, Node.js, PHP, Python, and Golang.`

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

  const downloadSmartSyncPlugin = async () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://1d4dc51ea0d1.ngrok-free.app '
    
    try {
      // Import JSZip dynamically to avoid SSR issues
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()
      
      // Add the main plugin file
      const pluginContent = `<?php
/**
 * Plugin Name: OmniX Smart Sync
 * Description: Automatically syncs WordPress content to OmniX chatbot platform and embeds the chatbot widget. No manual setup required!
 * Version: 2.0.0
 * Author: OmniX Team
 * License: GPL v2 or later
 * Text Domain: omnix-smart-sync
 * Requires at least: 5.0
 * Tested up to: 6.4
 * Requires PHP: 7.4
 */

if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('OMNIX_SMART_SYNC_VERSION', '2.0.0');
define('OMNIX_SMART_SYNC_PLUGIN_URL', plugin_dir_url(__FILE__));
define('OMNIX_SMART_SYNC_PLUGIN_PATH', plugin_dir_path(__FILE__));

class OmniX_Smart_Sync {
    
    private $api_base_url;
    private $bot_id;
    private $access_token;
    private $sync_enabled;
    
    public function __construct() {
        $this->api_base_url = get_option('omnix_smart_sync_api_url', '${baseUrl}');
        $this->access_token = get_option('omnix_smart_sync_access_token', '');
        $this->sync_enabled = get_option('omnix_smart_sync_enabled', false);
        
        // Always get fresh bot_id from options (updated during registration)
        $this->bot_id = get_option('omnix_smart_sync_bot_id', '');
        
        add_action('init', array($this, 'init'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'admin_init'));
        add_action('wp_footer', array($this, 'inject_chatbot_script'));
        
        // Auto-sync hooks
        add_action('save_post', array($this, 'auto_sync_content'), 10, 3);
        add_action('wp_ajax_omnix_register_site', array($this, 'ajax_register_site'));
        add_action('wp_ajax_omnix_manual_sync', array($this, 'ajax_manual_sync'));
        add_action('wp_ajax_omnix_test_connection', array($this, 'ajax_test_connection'));
        
        // Activation/Deactivation hooks
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
    }
    
    public function init() {
        load_plugin_textdomain('omnix-smart-sync', false, dirname(plugin_basename(__FILE__)) . '/languages');
        
        // Auto-register site if not already registered
        if (!$this->access_token && $this->sync_enabled) {
            $this->register_site();
        }
    }
    
    public function activate() {
        // Set default options
        add_option('omnix_smart_sync_api_url', '${baseUrl}');
        add_option('omnix_smart_sync_bot_id', '');
        add_option('omnix_smart_sync_access_token', '');
        add_option('omnix_smart_sync_enabled', false);
        add_option('omnix_smart_sync_auto_sync', true);
        add_option('omnix_smart_sync_last_sync', '');
        
        // Try to register site automatically
        $this->register_site();
    }
    
    public function deactivate() {
        // Cleanup if needed
    }
    
    public function add_admin_menu() {
        add_menu_page(
            'OmniX Smart Sync',
            'OmniX Smart Sync',
            'manage_options',
            'omnix-smart-sync',
            array($this, 'admin_page'),
            'dashicons-update',
            30
        );
        
        add_submenu_page(
            'omnix-smart-sync',
            'Settings',
            'Settings',
            'manage_options',
            'omnix-smart-sync-settings',
            array($this, 'settings_page')
        );
    }
    
    public function admin_init() {
        register_setting('omnix_smart_sync_settings', 'omnix_smart_sync_api_url');
        register_setting('omnix_smart_sync_settings', 'omnix_smart_sync_bot_id');
        register_setting('omnix_smart_sync_settings', 'omnix_smart_sync_enabled');
        register_setting('omnix_smart_sync_settings', 'omnix_smart_sync_auto_sync');
    }
    
    public function admin_page() {
        $sync_status = get_option('omnix_smart_sync_last_sync', 'Never');
        $total_posts = wp_count_posts('post')->publish;
        $total_pages = wp_count_posts('page')->publish;
        $total_categories = wp_count_terms('category');
        $total_tags = wp_count_terms('post_tag');
        
        ?>
        <div class="wrap">
            <h1>OmniX Smart Sync Dashboard</h1>
            
            <div class="card" style="max-width: 1000px;">
                <h2>📊 Sync Status</h2>
                <table class="form-table">
                    <tr>
                        <th>Connection Status</th>
                        <td>
                            <?php if ($this->access_token): ?>
                                <span style="color: green;">✅ Connected</span>
                            <?php else: ?>
                                <span style="color: red;">❌ Not Connected</span>
                            <?php endif; ?>
                        </td>
                    </tr>
                    <tr>
                        <th>Last Sync</th>
                        <td><?php echo esc_html($sync_status); ?></td>
                    </tr>
                    <tr>
                        <th>Content Ready for Sync</th>
                        <td>
                            <strong><?php echo $total_posts; ?></strong> Posts • 
                            <strong><?php echo $total_pages; ?></strong> Pages • 
                            <strong><?php echo $total_categories; ?></strong> Categories • 
                            <strong><?php echo $total_tags; ?></strong> Tags
                        </td>
                    </tr>
                </table>
                
                <p class="submit">
                    <button id="manual-sync" class="button button-primary" <?php echo !$this->access_token ? 'disabled' : ''; ?>>
                        🔄 Sync Now
                    </button>
                    <button id="test-connection" class="button button-secondary">
                        🔍 Test Connection
                    </button>
                </p>
                
                <div id="sync-status" style="margin-top: 15px;"></div>
            </div>
            
            <div class="card" style="max-width: 1000px;">
                <h2>🚀 Quick Setup</h2>
                <?php if (!$this->access_token): ?>
                    <p>Click the button below to automatically connect your WordPress site to OmniX:</p>
                    <button id="register-site" class="button button-primary button-large">
                        Connect to OmniX Platform
                    </button>
                <?php else: ?>
                    <p style="color: green;">✅ Your site is connected to OmniX! The chatbot will appear on your website automatically.</p>
                    <p><strong>Access Token:</strong> <code><?php echo esc_html(substr($this->access_token, 0, 20) . '...'); ?></code></p>
                <?php endif; ?>
            </div>
            
            <div class="card" style="max-width: 1000px;">
                <h2>📝 How It Works</h2>
                <ol>
                    <li><strong>Auto-Connect:</strong> The plugin automatically registers your site with OmniX</li>
                    <li><strong>Content Sync:</strong> Your pages, posts, and content are synced to Pinecone database</li>
                    <li><strong>Smart Chatbot:</strong> AI chatbot appears on your site with your content knowledge</li>
                    <li><strong>Auto-Updates:</strong> New content is automatically synced when you publish</li>
                </ol>
            </div>
        </div>
        
        <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Register site
            document.getElementById('register-site')?.addEventListener('click', function() {
                const button = this;
                button.disabled = true;
                button.textContent = 'Connecting...';
                
                fetch(ajaxurl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: 'action=omnix_register_site&nonce=<?php echo wp_create_nonce('omnix_register_site'); ?>'
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        location.reload();
                    } else {
                        alert('Connection failed: ' + (data.data || 'Unknown error'));
                        button.disabled = false;
                        button.textContent = 'Connect to OmniX Platform';
                    }
                })
                .catch(error => {
                    alert('Connection failed: ' + error.message);
                    button.disabled = false;
                    button.textContent = 'Connect to OmniX Platform';
                });
            });
            
            // Manual sync
            document.getElementById('manual-sync')?.addEventListener('click', function() {
                const button = this;
                const status = document.getElementById('sync-status');
                
                button.disabled = true;
                button.textContent = 'Syncing...';
                status.innerHTML = '<p>🔄 Syncing content to OmniX platform...</p>';
                
                fetch(ajaxurl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: 'action=omnix_manual_sync&nonce=<?php echo wp_create_nonce('omnix_manual_sync'); ?>'
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        status.innerHTML = '<p style="color: green;">✅ Sync completed successfully!</p>';
                        location.reload();
                    } else {
                        status.innerHTML = '<p style="color: red;">❌ Sync failed: ' + (data.data || 'Unknown error') + '</p>';
                    }
                })
                .catch(error => {
                    status.innerHTML = '<p style="color: red;">❌ Sync failed: ' + error.message + '</p>';
                })
                .finally(() => {
                    button.disabled = false;
                    button.textContent = '🔄 Sync Now';
                });
            });
            
            // Test connection
            document.getElementById('test-connection')?.addEventListener('click', function() {
                const button = this;
                const status = document.getElementById('sync-status');
                
                button.disabled = true;
                button.textContent = 'Testing...';
                status.innerHTML = '<p>🔍 Testing connection...</p>';
                
                fetch(ajaxurl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: 'action=omnix_test_connection&nonce=<?php echo wp_create_nonce('omnix_test_connection'); ?>'
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        status.innerHTML = '<p style="color: green;">✅ Connection successful!</p>';
                    } else {
                        status.innerHTML = '<p style="color: red;">❌ Connection failed: ' + (data.data || 'Unknown error') + '</p>';
                    }
                })
                .catch(error => {
                    status.innerHTML = '<p style="color: red;">❌ Connection failed: ' + error.message + '</p>';
                })
                .finally(() => {
                    button.disabled = false;
                    button.textContent = '🔍 Test Connection';
                });
            });
        });
        </script>
        <?php
    }
    
    public function settings_page() {
        if (isset($_POST['save_settings']) && check_admin_referer('omnix_smart_sync_save')) {
            update_option('omnix_smart_sync_api_url', sanitize_url($_POST['api_url']));
            update_option('omnix_smart_sync_bot_id', sanitize_text_field($_POST['bot_id']));
            update_option('omnix_smart_sync_enabled', isset($_POST['enabled']));
            update_option('omnix_smart_sync_auto_sync', isset($_POST['auto_sync']));
            echo '<div class="updated"><p>Settings saved successfully!</p></div>';
        }
        
        $api_url = get_option('omnix_smart_sync_api_url', '${baseUrl}');
        $bot_id = get_option('omnix_smart_sync_bot_id', '');
        $enabled = get_option('omnix_smart_sync_enabled', false);
        $auto_sync = get_option('omnix_smart_sync_auto_sync', true);
        
        ?>
        <div class="wrap">
            <h1>OmniX Smart Sync Settings</h1>
            
            <form method="post">
                <?php wp_nonce_field('omnix_smart_sync_save'); ?>
                <table class="form-table">
                    <tr>
                        <th scope="row">OmniX Platform URL</th>
                        <td>
                            <input type="url" name="api_url" value="<?php echo esc_attr($api_url); ?>" class="regular-text" required>
                            <p class="description">The URL of your OmniX chatbot platform</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Bot ID</th>
                        <td>
                            <input type="text" name="bot_id" value="<?php echo esc_attr($bot_id); ?>" class="regular-text" placeholder="e.g., 54">
                            <p class="description">The ID of your bot in the OmniX platform (optional - will be auto-generated)</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Enable Sync</th>
                        <td>
                            <label>
                                <input type="checkbox" name="enabled" <?php checked($enabled); ?>>
                                Enable content sync with OmniX platform
                            </label>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Auto Sync</th>
                        <td>
                            <label>
                                <input type="checkbox" name="auto_sync" <?php checked($auto_sync); ?>>
                                Automatically sync content when posts are published
                            </label>
                        </td>
                    </tr>
                </table>
                
                <p class="submit">
                    <input type="submit" name="save_settings" class="button button-primary" value="Save Settings">
                </p>
            </form>
        </div>
        <?php
    }
    
    public function ajax_register_site() {
        check_ajax_referer('omnix_register_site', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized');
        }
        
        $result = $this->register_site();
        
        if ($result) {
            wp_send_json_success('Site registered successfully!');
        } else {
            wp_send_json_error('Failed to register site. Please check your API URL.');
        }
    }
    
    public function ajax_manual_sync() {
        check_ajax_referer('omnix_manual_sync', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized');
        }
        
        $result = $this->sync_all_content();
        
        if ($result) {
            wp_send_json_success('Content synced successfully!');
        } else {
            wp_send_json_error('Failed to sync content. Please check your connection.');
        }
    }
    
    public function ajax_test_connection() {
        check_ajax_referer('omnix_test_connection', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized');
        }
        
        $api_url = $this->api_base_url . '/api/health';
        error_log('Testing connection to: ' . $api_url);
        
        $response = wp_remote_get($api_url, array(
            'timeout' => 15,
            'headers' => array(
                'ngrok-skip-browser-warning' => 'true'
            ),
            'sslverify' => false
        ));
        
        if (is_wp_error($response)) {
            $error_message = $response->get_error_message();
            error_log('WordPress connection error: ' . $error_message);
            wp_send_json_error('Connection failed: ' . $error_message);
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        
        error_log('Response status: ' . $status_code);
        error_log('Response body: ' . $body);
        
        if ($status_code === 200) {
            wp_send_json_success('Connection successful!');
        } else {
            wp_send_json_error('Connection failed with status: ' . $status_code . ' - Response: ' . $body);
        }
    }
    
    private function register_site() {
        $site_url = get_site_url();
        $site_name = get_bloginfo('name');
        
        $response = wp_remote_post($this->api_base_url . '/api/wordpress/register', array(
            'headers' => array(
                'Content-Type' => 'application/json',
                'ngrok-skip-browser-warning' => 'true'
            ),
            'body' => json_encode(array(
                'site_url' => $site_url,
                'site_name' => $site_name,
                'admin_email' => get_option('admin_email'),
                'wordpress_version' => get_bloginfo('version'),
                'bot_id' => '${bot.id}' // Use the bot ID from plugin generation
            )),
            'timeout' => 30
        ));
        
        if (is_wp_error($response)) {
            return false;
        }
        
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if ($data && isset($data['access_token'])) {
            update_option('omnix_smart_sync_access_token', $data['access_token']);
            update_option('omnix_smart_sync_bot_id', $data['bot_id'] ?? '');
            update_option('omnix_smart_sync_enabled', true);
            
            // Update the instance variable
            $this->bot_id = $data['bot_id'] ?? '';
            
            // Log the registration for debugging
            error_log('OmniX Smart Sync: Site registered with bot_id: ' . ($data['bot_id'] ?? 'not provided'));
            
            // Trigger initial sync
            $this->sync_all_content();
            
            return true;
        }
        
        return false;
    }
    
    private function sync_all_content() {
        if (!$this->access_token) {
            return false;
        }
        
        $content_data = array(
            'site_info' => array(
                'name' => get_bloginfo('name'),
                'description' => get_bloginfo('description'),
                'url' => get_site_url(),
                'admin_email' => get_option('admin_email'),
                'timezone' => get_option('timezone_string'),
                'language' => get_locale(),
                'version' => get_bloginfo('version')
            ),
            'posts' => $this->get_posts_data(),
            'pages' => $this->get_pages_data(),
            'categories' => $this->get_categories_data(),
            'tags' => $this->get_tags_data()
        );
        
        $response = wp_remote_post($this->api_base_url . '/api/wordpress/sync', array(
            'headers' => array(
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . $this->access_token,
                'ngrok-skip-browser-warning' => 'true'
            ),
            'body' => json_encode($content_data),
            'timeout' => 60
        ));
        
        if (is_wp_error($response)) {
            return false;
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        if ($status_code === 200) {
            update_option('omnix_smart_sync_last_sync', current_time('mysql'));
            return true;
        }
        
        return false;
    }
    
    private function get_posts_data() {
        $posts = get_posts(array(
            'post_type' => 'post',
            'post_status' => 'publish',
            'posts_per_page' => -1,
            'orderby' => 'date',
            'order' => 'DESC'
        ));
        
        $data = array();
        foreach ($posts as $post) {
            $data[] = array(
                'id' => $post->ID,
                'title' => $post->post_title,
                'content' => wp_strip_all_tags($post->post_content),
                'excerpt' => $post->post_excerpt,
                'url' => get_permalink($post->ID),
                'date' => $post->post_date,
                'modified' => $post->post_modified,
                'author' => get_the_author_meta('display_name', $post->post_author),
                'categories' => wp_get_post_categories($post->ID, array('fields' => 'names')),
                'tags' => wp_get_post_tags($post->ID, array('fields' => 'names'))
            );
        }
        
        return $data;
    }
    
    private function get_pages_data() {
        $pages = get_posts(array(
            'post_type' => 'page',
            'post_status' => 'publish',
            'posts_per_page' => -1,
            'orderby' => 'menu_order',
            'order' => 'ASC'
        ));
        
        $data = array();
        foreach ($pages as $page) {
            $data[] = array(
                'id' => $page->ID,
                'title' => $page->post_title,
                'content' => wp_strip_all_tags($page->post_content),
                'excerpt' => $page->post_excerpt,
                'url' => get_permalink($page->ID),
                'date' => $page->post_date,
                'modified' => $page->post_modified,
                'author' => get_the_author_meta('display_name', $page->post_author),
                'parent' => $page->post_parent,
                'menu_order' => $page->menu_order
            );
        }
        
        return $data;
    }
    
    private function get_categories_data() {
        $categories = get_categories(array('hide_empty' => false));
        $data = array();
        
        foreach ($categories as $category) {
            $data[] = array(
                'id' => $category->term_id,
                'name' => $category->name,
                'slug' => $category->slug,
                'description' => $category->description,
                'count' => $category->count,
                'parent' => $category->parent,
                'url' => get_category_link($category->term_id)
            );
        }
        
        return $data;
    }
    
    private function get_tags_data() {
        $tags = get_tags(array('hide_empty' => false));
        $data = array();
        
        foreach ($tags as $tag) {
            $data[] = array(
                'id' => $tag->term_id,
                'name' => $tag->name,
                'slug' => $tag->slug,
                'description' => $tag->description,
                'count' => $tag->count,
                'url' => get_tag_link($tag->term_id)
            );
        }
        
        return $data;
    }
    
    public function auto_sync_content($post_id, $post, $update) {
        if (!$this->sync_enabled || !get_option('omnix_smart_sync_auto_sync', true)) {
            return;
        }
        
        if ($post->post_status !== 'publish') {
            return;
        }
        
        // Skip if this is an autosave or revision
        if (wp_is_post_autosave($post_id) || wp_is_post_revision($post_id)) {
            return;
        }
        
        // Sync the specific post/page
        $this->sync_single_content($post);
    }
    
    private function sync_single_content($post) {
        if (!$this->access_token) {
            return;
        }
        
        $content_data = array(
            'action' => 'update',
            'content' => array(
                'id' => $post->ID,
                'title' => $post->post_title,
                'content' => wp_strip_all_tags($post->post_content),
                'excerpt' => $post->post_excerpt,
                'url' => get_permalink($post->ID),
                'date' => $post->post_date,
                'modified' => $post->post_modified,
                'author' => get_the_author_meta('display_name', $post->post_author),
                'type' => $post->post_type
            )
        );
        
        if ($post->post_type === 'post') {
            $content_data['content']['categories'] = wp_get_post_categories($post->ID, array('fields' => 'names'));
            $content_data['content']['tags'] = wp_get_post_tags($post->ID, array('fields' => 'names'));
        }
        
        wp_remote_post($this->api_base_url . '/api/wordpress/sync', array(
            'headers' => array(
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . $this->access_token,
                'ngrok-skip-browser-warning' => 'true'
            ),
            'body' => json_encode($content_data),
            'timeout' => 30
        ));
    }
    
    public function inject_chatbot_script() {
        // Get fresh values from database
        $access_token = get_option('omnix_smart_sync_access_token', '');
        $sync_enabled = get_option('omnix_smart_sync_enabled', false);
        $bot_id = get_option('omnix_smart_sync_bot_id', '');
        $api_url = get_option('omnix_smart_sync_api_url', '${baseUrl}');
        
        // Debug logging
        error_log('OmniX Smart Sync: Injecting script with bot_id: ' . $bot_id . ', access_token: ' . ($access_token ? 'present' : 'missing'));
        
        if (!$access_token || !$sync_enabled) {
            error_log('OmniX Smart Sync: Not injecting script - access_token: ' . ($access_token ? 'present' : 'missing') . ', sync_enabled: ' . ($sync_enabled ? 'true' : 'false'));
            return;
        }
        
        // Only use bot_id from database (set during registration)
        // Never use hardcoded fallback as it may be different from registered bot
        if (empty($bot_id)) {
            error_log('OmniX Smart Sync: No bot_id found in database. Site may not be registered yet.');
            return; // Don't inject script if no bot_id
        }
        
        // Ensure API URL doesn't have trailing slash
        $api_url = rtrim($api_url, '/');
        
        ?>
        <script>
        window.omnixChatbot = {
            apiUrl: "<?php echo esc_js($api_url); ?>",
            botId: "<?php echo esc_js($bot_id); ?>",
            accessToken: "<?php echo esc_js($access_token); ?>",
            autoOpen: false,
            position: "bottom-right",
            theme: "modern"
        };
        </script>
        <script src="<?php echo esc_js($api_url); ?>/chatbot-widget.js?v=<?php echo time(); ?>" defer></script>
        <?php
    }
}

// Initialize the plugin
new OmniX_Smart_Sync();`

      zip.file('omnix-smart-sync.php', pluginContent)
      
      // Add README
      const readmeContent = `# OmniX Smart Sync WordPress Plugin

A revolutionary WordPress plugin that automatically syncs your content to OmniX AI platform and embeds an intelligent chatbot widget. No manual setup required!

## 🚀 Features

- **One-Click Setup**: Automatically connects to OmniX platform
- **Auto Content Sync**: Syncs pages, posts, categories, and tags to Pinecone database
- **Smart Chatbot**: AI-powered chatbot with your content knowledge
- **Real-time Updates**: New content is automatically synced when published
- **Zero Configuration**: Works out of the box with minimal setup

## 📦 Installation

### Method 1: Direct Upload (Recommended)

1. Download this plugin file
2. Zip it as \`omnix-smart-sync.zip\`
3. Go to **WordPress Admin → Plugins → Add New → Upload Plugin**
4. Choose the zip file and click **Install Now**
5. Click **Activate Plugin**

### Method 2: Manual Upload

1. Upload the \`omnix-smart-sync\` folder to \`/wp-content/plugins/\`
2. Go to **WordPress Admin → Plugins**
3. Find "OmniX Smart Sync" and click **Activate**

## ⚡ Quick Start

1. **Activate the plugin**
2. Go to **OmniX Smart Sync** in your WordPress admin
3. Click **"Connect to OmniX Platform"**
4. That's it! Your chatbot will appear on your website automatically

## 🔧 Configuration

### Basic Settings

- **OmniX Platform URL**: Your OmniX platform URL (pre-configured)
- **Bot ID**: Auto-assigned during site registration
- **Enable Sync**: Toggle content sync on/off
- **Auto Sync**: Automatically sync new content when published

### Advanced Features

- **Manual Sync**: Trigger content sync manually from the dashboard
- **Connection Test**: Test your connection to OmniX platform
- **Sync Status**: View last sync time and content statistics

## 📊 What Gets Synced

- **Posts**: All published posts with title, content, categories, tags
- **Pages**: All published pages with title, content, hierarchy
- **Categories**: All categories with descriptions
- **Tags**: All tags with descriptions
- **Site Info**: Site name, description, admin email, WordPress version

## 🤖 Chatbot Features

- **Smart Responses**: AI understands your content and provides relevant answers
- **Modern UI**: Beautiful, responsive chat interface
- **Mobile Friendly**: Works perfectly on all devices
- **Customizable**: Position, theme, and behavior options
- **Real-time**: Instant responses powered by your content

## 🔒 Security

- **Secure Tokens**: Each site gets a unique access token
- **HTTPS Only**: All communication is encrypted
- **Rate Limiting**: Built-in protection against abuse
- **Data Privacy**: Only content you choose to sync is sent

## 🛠️ Troubleshooting

### Connection Issues

1. Check your internet connection
2. Verify the OmniX Platform URL is correct
3. Try the "Test Connection" button
4. Check if your server allows outbound HTTPS requests

### Sync Issues

1. Ensure "Enable Sync" is turned on
2. Check if "Auto Sync" is enabled for new content
3. Try manual sync from the dashboard
4. Check WordPress error logs for details

### Chatbot Not Appearing

1. Verify the plugin is activated
2. Check if "Enable Sync" is turned on
3. Ensure your site has an access token
4. Clear any caching plugins

## 📞 Support

- **Documentation**: Check the plugin dashboard for help
- **Issues**: Contact OmniX support team
- **Updates**: Plugin updates automatically

## 🔄 Updates

The plugin checks for updates automatically. You'll be notified in your WordPress admin when updates are available.

## 📝 Changelog

### Version 2.0.0
- Complete rewrite with auto-registration
- Improved sync performance
- Better error handling
- Modern admin interface
- Enhanced security

---

**Made with ❤️ by the OmniX Team**`

      zip.file('README.md', readmeContent)
      
      // Generate the ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      
      // Create download link and trigger download
      const url = URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `omnix-smart-sync-${bot.id}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Error creating Smart Sync ZIP file:', error)
      alert('Error creating ZIP file. Please try again or contact support.')
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
            <TabsList className="grid grid-cols-7 gap-1 p-1 w-full">
              <TabsTrigger value="widget" className="flex gap-2 items-center">
                <Code className="w-4 h-4" />
                Widget
              </TabsTrigger>
              <TabsTrigger value="iframe" className="flex gap-2 items-center">
                <Globe className="w-4 h-4" />
                Iframe
              </TabsTrigger>
              {/* <TabsTrigger value="react" className="flex gap-2 items-center">
                <Settings className="w-4 h-4" />
                React
              </TabsTrigger> */}
              <TabsTrigger value="wordpress" className="flex gap-2 items-center">
                <FileText className="w-4 h-4" />
                WordPress
              </TabsTrigger>
              {/* <TabsTrigger value="database" className="flex gap-2 items-center">
                <Database className="w-4 h-4" />
                Database
              </TabsTrigger> */}
              {/* <TabsTrigger value="tokens" className="flex gap-2 items-center">
                <Key className="w-4 h-4" />
                Tokens
              </TabsTrigger> */}
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

                {/* <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">WordPress Plugin Files (Legacy)</label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadWordPressPlugin()}
                        className="flex gap-2 items-center"
                      >
                        <Download className="w-4 h-4" />
                        Download Legacy Plugin
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Download the complete WordPress plugin with all necessary files for installation.
                  </p>
                </div> */}

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">🚀 OmniX Smart Sync Plugin (Recommended)</label>
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => downloadSmartSyncPlugin()}
                        className="flex gap-2 items-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        <Download className="w-4 h-4" />
                        Download Smart Sync
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <strong>New!</strong> One-click setup plugin that automatically syncs your content and embeds the chatbot. No manual configuration needed!
                  </p>
                  <div className="text-xs text-green-600 font-medium">
                    ✅ Auto-connects to OmniX • ✅ Auto-syncs content • ✅ Zero configuration
                  </div>
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

            <TabsContent value="tokens" className="space-y-4 w-full">
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <h4 className="flex gap-2 items-center mb-2 text-lg font-semibold text-green-800">
                    <Key className="w-5 h-5" />
                    Access Token & Secret Key Management
                  </h4>
                  <p className="text-sm text-green-700">
                    Create, manage, and validate access tokens and secret keys for your bot. These tokens provide secure authentication for API access and database operations.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium">Token Management Examples</label>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(getCurrentLanguageContent())}
                          className="flex gap-2 items-center"
                        >
                          <Copy className="w-4 h-4" />
                          Copy {selectedLanguage.toUpperCase()} Examples
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadScript(generateTokenIntegrationGuide(), 'token-management-guide.md')}
                          className="flex gap-2 items-center"
                        >
                          <Download className="w-4 h-4" />
                          Download Guide
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={() => setSelectedLanguage('curl')}
                        className={`px-3 py-1 text-xs rounded border transition-colors ${
                          selectedLanguage === 'curl' 
                            ? 'bg-green-100 border-green-300 text-green-800' 
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        cURL
                      </button>
                      <button
                        onClick={() => setSelectedLanguage('nodejs')}
                        className={`px-3 py-1 text-xs rounded border transition-colors ${
                          selectedLanguage === 'nodejs' 
                            ? 'bg-green-100 border-green-300 text-green-800' 
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Node.js
                      </button>
                      <button
                        onClick={() => setSelectedLanguage('php')}
                        className={`px-3 py-1 text-xs rounded border transition-colors ${
                          selectedLanguage === 'php' 
                            ? 'bg-green-100 border-green-300 text-green-800' 
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        PHP
                      </button>
                      <button
                        onClick={() => setSelectedLanguage('python')}
                        className={`px-3 py-1 text-xs rounded border transition-colors ${
                          selectedLanguage === 'python' 
                            ? 'bg-green-100 border-green-300 text-green-800' 
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Python
                      </button>
                      <button
                        onClick={() => setSelectedLanguage('golang')}
                        className={`px-3 py-1 text-xs rounded border transition-colors ${
                          selectedLanguage === 'golang' 
                            ? 'bg-green-100 border-green-300 text-green-800' 
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Golang
                      </button>
                    </div>
                    
                    <ScrollArea className="p-3 w-full h-80 rounded border">
                      <pre className="text-xs whitespace-pre-wrap text-muted-foreground">
                        {getCurrentLanguageContent()}
                      </pre>
                    </ScrollArea>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <h5 className="flex gap-2 items-center text-sm font-semibold">
                        <Shield className="w-4 h-4" />
                        Security Features
                      </h5>
                      <div className="space-y-2 text-xs text-muted-foreground">
                        <div>• <strong>Secure Generation:</strong> Cryptographically secure tokens</div>
                        <div>• <strong>Expiration Control:</strong> Configurable token lifetime</div>
                        <div>• <strong>Permission System:</strong> Granular access control</div>
                        <div>• <strong>Token Revocation:</strong> Instant token deactivation</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h5 className="flex gap-2 items-center text-sm font-semibold">
                        <Zap className="w-4 h-4" />
                        Token Operations
                      </h5>
                      <div className="space-y-2 text-xs text-muted-foreground">
                        <div>• <strong>Create:</strong> Generate new access tokens</div>
                        <div>• <strong>List:</strong> View all bot tokens</div>
                        <div>• <strong>Validate:</strong> Check token validity</div>
                        <div>• <strong>Update:</strong> Modify token permissions</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h5 className="text-sm font-semibold">API Endpoints</h5>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center p-2 rounded bg-muted">
                        <span><code>POST /api/bots/&#123;botId&#125;/tokens</code></span>
                        <span className="text-muted-foreground">Create new token</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded bg-muted">
                        <span><code>GET /api/bots/&#123;botId&#125;/tokens</code></span>
                        <span className="text-muted-foreground">List tokens</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded bg-muted">
                        <span><code>POST /api/bots/&#123;botId&#125;/tokens/validate</code></span>
                        <span className="text-muted-foreground">Validate token</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded bg-muted">
                        <span><code>PUT /api/bots/&#123;botId&#125;/tokens</code></span>
                        <span className="text-muted-foreground">Update token</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded bg-muted">
                        <span><code>DELETE /api/bots/&#123;botId&#125;/tokens</code></span>
                        <span className="text-muted-foreground">Revoke token</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <h5 className="mb-2 text-sm font-medium text-blue-800">🔑 Quick Start</h5>
                    <div className="space-y-1 text-xs text-blue-700">
                      <div>1. Create a new access token for your bot</div>
                      <div>2. Use the token for API authentication</div>
                      <div>3. Set appropriate permissions (read, write, admin)</div>
                      <div>4. Monitor token usage and expiration</div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* <TabsContent value="database" className="space-y-4 w-full">
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <h4 className="flex gap-2 items-center mb-2 text-lg font-semibold text-blue-800">
                    <Database className="w-5 h-5" />
                    Smart Database Chatbot API
                  </h4>
                  <p className="text-sm text-blue-700">
                    <strong>🤖 Auto-Detection:</strong> Automatically understands database-related prompts and routes them to appropriate database APIs. 
                    <strong>🔍 Query Classification:</strong> Detects query types (count, aggregation, time-based, comparison, grouping) and provides enhanced responses.
                    <strong>💡 Smart Suggestions:</strong> Offers relevant query examples when database config is not provided.
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
                          onClick={() => copyToClipboard(getCurrentLanguageContent())}
                          className="flex gap-2 items-center"
                        >
                          <Copy className="w-4 h-4" />
                          Copy {selectedLanguage.toUpperCase()} Examples
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
                    
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={() => setSelectedLanguage('curl')}
                        className={`px-3 py-1 text-xs rounded border transition-colors ${
                          selectedLanguage === 'curl' 
                            ? 'bg-blue-100 border-blue-300 text-blue-800' 
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        cURL
                      </button>
                      <button
                        onClick={() => setSelectedLanguage('nodejs')}
                        className={`px-3 py-1 text-xs rounded border transition-colors ${
                          selectedLanguage === 'nodejs' 
                            ? 'bg-blue-100 border-blue-300 text-blue-800' 
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Node.js
                      </button>
                      <button
                        onClick={() => setSelectedLanguage('php')}
                        className={`px-3 py-1 text-xs rounded border transition-colors ${
                          selectedLanguage === 'php' 
                            ? 'bg-blue-100 border-blue-300 text-blue-800' 
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        PHP
                      </button>
                      <button
                        onClick={() => setSelectedLanguage('python')}
                        className={`px-3 py-1 text-xs rounded border transition-colors ${
                          selectedLanguage === 'python' 
                            ? 'bg-blue-100 border-blue-300 text-blue-800' 
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Python
                      </button>
                      <button
                        onClick={() => setSelectedLanguage('golang')}
                        className={`px-3 py-1 text-xs rounded border transition-colors ${
                          selectedLanguage === 'golang' 
                            ? 'bg-blue-100 border-blue-300 text-blue-800' 
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Golang
                      </button>
                    </div>
                    
                    <ScrollArea className="p-3 w-full h-80 rounded border">
                      <pre className="text-xs whitespace-pre-wrap text-muted-foreground">
                        {getCurrentLanguageContent()}
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
            </TabsContent> */}
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

