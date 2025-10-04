"use client"

import { AdaptiveChatInterface } from "@/components/dashboard/adaptive-chat-interface"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  MessageCircle, 
  Volume2, 
  Bot, 
  Settings,
  Mic,
  Speaker
} from "lucide-react"

export default function ResponseModelsDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Response Models Demo
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Choose between Voice Response or Chat Response models
          </p>
          
          <div className="flex justify-center gap-4 mb-8">
            <Badge variant="outline" className="px-4 py-2">
              <Volume2 className="h-4 w-4 mr-2" />
              Voice Response Model
            </Badge>
            <Badge variant="outline" className="px-4 py-2">
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat Response Model
            </Badge>
          </div>
        </div>

        {/* Model Comparison */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <Volume2 className="h-5 w-5" />
                Voice Response Model
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Voice Input Support</span>
                </div>
                <div className="flex items-center gap-2">
                  <Speaker className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Text-to-Speech Output</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Natural Voice Conversation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Audio Controls</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Best for:</strong> Hands-free interaction, accessibility, 
                  natural conversation flow, and mobile users.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <MessageCircle className="h-5 w-5" />
                Chat Response Model
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Text Input/Output</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Quick Text Responses</span>
                </div>
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Traditional Chat Interface</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Rich Text Formatting</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">
                  <strong>Best for:</strong> Quick responses, detailed information, 
                  quiet environments, and users who prefer reading.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interactive Demo */}
        <Card className="h-[600px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-600" />
              Interactive Chat Interface
            </CardTitle>
            <p className="text-sm text-gray-600">
              Use the model selector above to switch between Voice Response and Chat Response modes.
              The interface will adapt based on your selection.
            </p>
          </CardHeader>
          <CardContent className="h-full p-0">
            <AdaptiveChatInterface 
              botId={1} 
              onConversationUpdate={(conversationId) => {
                console.log('New conversation started:', conversationId)
              }}
            />
          </CardContent>
        </Card>

        {/* Usage Instructions */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800">Voice Response Model</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-blue-700">
                <li>Select "Voice Response" mode</li>
                <li>Click the microphone button to start recording</li>
                <li>Speak your message clearly</li>
                <li>Click the microphone again to stop recording</li>
                <li>Wait for the AI to respond with voice</li>
                <li>Use speaker buttons to replay responses</li>
              </ol>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-800">Chat Response Model</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-green-700">
                <li>Select "Chat Response" mode</li>
                <li>Type your message in the text area</li>
                <li>Press Enter or click Send</li>
                <li>Read the AI's text response</li>
                <li>Continue the conversation with text</li>
                <li>Use traditional chat interface features</li>
              </ol>
            </CardContent>
          </Card>
        </div>

        {/* Technical Details */}
        <div className="mt-8 bg-gray-100 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Implementation</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Voice Response Model</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Uses OpenAI Whisper for Speech-to-Text</li>
                <li>• Uses OpenAI TTS for Text-to-Speech</li>
                <li>• Real-time audio processing</li>
                <li>• Voice activity detection</li>
                <li>• Audio compression and optimization</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Chat Response Model</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Traditional text-based communication</li>
                <li>• Rich text formatting support</li>
                <li>• Quick response times</li>
                <li>• Keyboard shortcuts (Enter to send)</li>
                <li>• Copy/paste functionality</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
