"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  MessageCircle, 
  Volume2, 
  Mic, 
  Bot, 
  CheckCircle,
  Settings
} from "lucide-react"
import { cn } from "@/lib/utils"

export type ResponseModel = 'voice' | 'chat'

interface ResponseModelSelectorProps {
  selectedModel: ResponseModel
  onModelChange: (model: ResponseModel) => void
  className?: string
}

export function ResponseModelSelector({ 
  selectedModel, 
  onModelChange, 
  className 
}: ResponseModelSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const models = [
    {
      id: 'voice' as ResponseModel,
      name: 'Voice Response',
      description: 'Bot responds with natural speech',
      icon: Volume2,
      features: ['Text-to-Speech', 'Voice Input', 'Audio Playback', 'Natural Conversation'],
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-200',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'chat' as ResponseModel,
      name: 'Chat Response', 
      description: 'Bot responds with text messages',
      icon: MessageCircle,
      features: ['Text Messages', 'Rich Formatting', 'Quick Reading', 'Traditional Chat'],
      color: 'bg-green-500',
      textColor: 'text-green-600', 
      borderColor: 'border-green-200',
      bgColor: 'bg-green-50'
    }
  ]

  const selectedModelData = models.find(m => m.id === selectedModel)

  return (
    <div className={cn("w-full", className)}>
      {/* Compact Selector */}
      <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Response Mode:</span>
          </div>
          <div className="flex items-center gap-2">
            {selectedModelData && (
              <>
                <selectedModelData.icon className={cn("h-4 w-4", selectedModelData.textColor)} />
                <span className={cn("text-sm font-medium", selectedModelData.textColor)}>
                  {selectedModelData.name}
                </span>
                <Badge variant="outline" className={cn("text-xs", selectedModelData.borderColor, selectedModelData.textColor)}>
                  Active
                </Badge>
              </>
            )}
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-8 px-3"
        >
          {isExpanded ? 'Hide Options' : 'Change Mode'}
        </Button>
      </div>

      {/* Expanded Model Selection */}
      {isExpanded && (
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          {models.map((model) => {
            const Icon = model.icon
            const isSelected = model.id === selectedModel
            
            return (
              <Card 
                key={model.id}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:shadow-md",
                  isSelected 
                    ? `${model.borderColor} border-2 shadow-md` 
                    : "border-gray-200 hover:border-gray-300"
                )}
                onClick={() => {
                  onModelChange(model.id)
                  setIsExpanded(false)
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        isSelected ? model.bgColor : "bg-gray-100"
                      )}>
                        <Icon className={cn(
                          "h-5 w-5",
                          isSelected ? model.textColor : "text-gray-600"
                        )} />
                      </div>
                      <div>
                        <CardTitle className={cn(
                          "text-base",
                          isSelected ? model.textColor : "text-gray-900"
                        )}>
                          {model.name}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          {model.description}
                        </p>
                      </div>
                    </div>
                    
                    {isSelected && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-700 mb-2">Features:</p>
                    <div className="flex flex-wrap gap-1">
                      {model.features.map((feature, index) => (
                        <Badge 
                          key={index}
                          variant="outline"
                          className={cn(
                            "text-xs px-2 py-1",
                            isSelected 
                              ? `${model.borderColor} ${model.textColor}` 
                              : "border-gray-200 text-gray-600"
                          )}
                        >
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Model Status Indicator */}
      <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
        <div className={cn(
          "w-2 h-2 rounded-full",
          selectedModel === 'voice' ? "bg-blue-500" : "bg-green-500"
        )} />
        <span>
          {selectedModel === 'voice' 
            ? "Voice responses enabled - Bot will speak responses" 
            : "Text responses enabled - Bot will send text messages"
          }
        </span>
      </div>
    </div>
  )
}
