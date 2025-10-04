"use client"

import { VoiceConversation } from "@/components/dashboard/voice-conversation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Mic, Volume2, Bot } from "lucide-react"

export default function VoiceDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Voice Conversation Demo
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Experience full Speech-to-Speech conversations with AI
          </p>
          
          <div className="flex justify-center gap-4 mb-8">
            <Badge variant="outline" className="px-4 py-2">
              <Mic className="h-4 w-4 mr-2" />
              Speech-to-Text
            </Badge>
            <Badge variant="outline" className="px-4 py-2">
              <Bot className="h-4 w-4 mr-2" />
              AI Processing
            </Badge>
            <Badge variant="outline" className="px-4 py-2">
              <Volume2 className="h-4 w-4 mr-2" />
              Text-to-Speech
            </Badge>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5 text-blue-600" />
                Voice Input
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Click the microphone to start recording your voice. The system will automatically 
                convert your speech to text using OpenAI's Whisper model.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-green-600" />
                AI Response
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Your transcribed text is processed by the AI chatbot with access to your 
                knowledge base and conversation history for contextual responses.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-purple-600" />
                Voice Output
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                The AI's response is automatically converted to natural-sounding speech 
                using OpenAI's TTS model and played back to you.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Voice Conversation Component */}
        <Card className="h-[600px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              Live Voice Conversation
            </CardTitle>
            <p className="text-sm text-gray-600">
              Start a natural voice conversation with the AI. Click the microphone button below to begin.
            </p>
          </CardHeader>
          <CardContent className="h-full p-0">
            <VoiceConversation 
              botId={1} 
              onConversationUpdate={(conversationId) => {
                console.log('New conversation started:', conversationId)
              }}
            />
          </CardContent>
        </Card>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">How to Use</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Click the microphone button to start recording</li>
            <li>Speak clearly into your microphone</li>
            <li>Click the microphone again to stop recording</li>
            <li>Wait for the AI to process and respond with voice</li>
            <li>Continue the conversation naturally</li>
          </ol>
          
          <div className="mt-4 p-4 bg-blue-100 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> Make sure to allow microphone permissions when prompted. 
              The conversation will be saved and you can reference previous messages in the chat history.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
