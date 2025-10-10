"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Palette, MessageCircle, Settings, Zap } from "lucide-react"
import type { Bot as BotType } from "@/lib/types"

interface StepThreeProps {
  formData: Partial<BotType>
  onChange: (data: Partial<BotType>) => void
}

export function StepThree({ formData, onChange }: StepThreeProps) {
  const [localData, setLocalData] = useState({
    personality: (formData as any).personality || 'professional',
    response_style: (formData as any).response_style || 'helpful',
    temperature: (formData as any).temperature || 0.7,
    max_tokens: (formData as any).max_tokens || 500,
    enable_voice: (formData as any).enable_voice || false,
    enable_file_upload: (formData as any).enable_file_upload || false,
    custom_instructions: (formData as any).custom_instructions || '',
    greeting_message: (formData as any).greeting_message || '',
    fallback_message: (formData as any).fallback_message || '',
  })

  const handleChange = (field: string, value: any) => {
    const newData = { ...localData, [field]: value }
    setLocalData(newData)
    onChange(newData)
  }

  const personalities = [
    { value: 'professional', label: 'Professional', description: 'Formal and business-like' },
    { value: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
    { value: 'casual', label: 'Casual', description: 'Relaxed and informal' },
    { value: 'expert', label: 'Expert', description: 'Authoritative and knowledgeable' },
    { value: 'creative', label: 'Creative', description: 'Imaginative and innovative' },
  ]

  const responseStyles = [
    { value: 'helpful', label: 'Helpful', description: 'Always tries to assist' },
    { value: 'concise', label: 'Concise', description: 'Brief and to the point' },
    { value: 'detailed', label: 'Detailed', description: 'Comprehensive explanations' },
    { value: 'conversational', label: 'Conversational', description: 'Natural dialogue flow' },
  ]

  return (
    <div className="space-y-6">
      {/* Personality Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex gap-2 items-center">
            <Palette className="w-5 h-5" />
            Personality & Tone
          </CardTitle>
          <CardDescription>
            Define how your chatbot should communicate with users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Personality Type</Label>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {personalities.map((personality) => (
                <div
                  key={personality.value}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    localData.personality === personality.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleChange('personality', personality.value)}
                >
                  <div className="text-sm font-medium">{personality.label}</div>
                  <div className="text-xs text-gray-500">{personality.description}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Response Style</Label>
            <Select
              value={localData.response_style}
              onValueChange={(value) => handleChange('response_style', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select response style" />
              </SelectTrigger>
              <SelectContent>
                {responseStyles.map((style) => (
                  <SelectItem key={style.value} value={style.value}>
                    <div>
                      <div className="font-medium">{style.label}</div>
                      <div className="text-xs text-gray-500">{style.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* AI Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex gap-2 items-center">
            <Settings className="w-5 h-5" />
            AI Configuration
          </CardTitle>
          <CardDescription>
            Adjust the AI model parameters for optimal responses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Creativity Level (Temperature)</Label>
              <div className="px-3">
                <Slider
                  value={[localData.temperature]}
                  onValueChange={([value]) => handleChange('temperature', value)}
                  max={1}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                  <span>Focused (0.0)</span>
                  <span>Balanced (0.5)</span>
                  <span>Creative (1.0)</span>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Current: {localData.temperature} - {localData.temperature < 0.3 ? 'More focused and consistent' : localData.temperature > 0.7 ? 'More creative and varied' : 'Balanced approach'}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Max Response Length</Label>
              <div className="px-3">
                <Slider
                  value={[localData.max_tokens]}
                  onValueChange={([value]) => handleChange('max_tokens', value)}
                  max={2000}
                  min={100}
                  step={50}
                  className="w-full"
                />
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                  <span>Short (100)</span>
                  <span>Medium (1000)</span>
                  <span>Long (2000)</span>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Current: {localData.max_tokens} tokens
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex gap-2 items-center">
            <MessageCircle className="w-5 h-5" />
            Custom Instructions
          </CardTitle>
          <CardDescription>
            Provide specific instructions for how your chatbot should behave
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="custom_instructions">Behavior Instructions</Label>
            <Textarea
              id="custom_instructions"
              placeholder="e.g., Always be polite, ask clarifying questions when needed, provide step-by-step instructions..."
              value={localData.custom_instructions}
              onChange={(e) => handleChange('custom_instructions', e.target.value)}
              className="w-full min-h-[120px]"
            />
            <p className="text-xs text-gray-500">
              Specific instructions that will guide your chatbot's behavior and responses
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="greeting_message">Greeting Message</Label>
            <Input
              id="greeting_message"
              placeholder="Hello! How can I help you today?"
              value={localData.greeting_message}
              onChange={(e) => handleChange('greeting_message', e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              The first message users will see when they start a conversation
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fallback_message">Fallback Message</Label>
            <Input
              id="fallback_message"
              placeholder="I'm sorry, I don't understand. Could you please rephrase your question?"
              value={localData.fallback_message}
              onChange={(e) => handleChange('fallback_message', e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Message shown when the chatbot doesn't know how to respond
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex gap-2 items-center">
            <Zap className="w-5 h-5" />
            Additional Features
          </CardTitle>
          <CardDescription>
            Enable additional capabilities for your chatbot
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <Label>Voice Chat</Label>
              <p className="text-sm text-gray-500">Allow users to speak with your chatbot</p>
            </div>
            <Switch
              checked={localData.enable_voice}
              onCheckedChange={(checked) => handleChange('enable_voice', checked)}
            />
          </div>

          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <Label>File Upload</Label>
              <p className="text-sm text-gray-500">Allow users to upload files for analysis</p>
            </div>
            <Switch
              checked={localData.enable_file_upload}
              onCheckedChange={(checked) => handleChange('enable_file_upload', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Personality Preview</CardTitle>
          <CardDescription>
            See how your chatbot will respond based on current settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-gray-50 rounded-lg border">
            <div className="space-y-3">
              <div className="flex gap-2 items-center">
                <Badge variant="outline">
                  {personalities.find(p => p.value === localData.personality)?.label}
                </Badge>
                <Badge variant="outline">
                  {responseStyles.find(s => s.value === localData.response_style)?.label}
                </Badge>
                <Badge variant="outline">
                  Temp: {localData.temperature}
                </Badge>
              </div>
              <div className="text-sm text-gray-600">
                <p><strong>Greeting:</strong> {localData.greeting_message || 'Hello! How can I help you today?'}</p>
                <p><strong>Fallback:</strong> {localData.fallback_message || 'I\'m sorry, I don\'t understand. Could you please rephrase your question?'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
