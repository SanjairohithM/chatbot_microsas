"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bot, MessageCircle, Globe } from "lucide-react"
import type { Bot as BotType } from "@/lib/types"

interface StepOneProps {
  formData: Partial<BotType>
  onChange: (data: Partial<BotType>) => void
}

export function StepOne({ formData, onChange }: StepOneProps) {
  const [localData, setLocalData] = useState({
    name: formData.name || '',
    description: formData.description || '',
    category: (formData as any).category || 'general',
  })

  const handleChange = (field: string, value: string) => {
    const newData = { ...localData, [field]: value }
    setLocalData(newData)
    onChange(newData)
  }

  const categories = [
    { value: 'general', label: 'General Purpose' },
    { value: 'customer-service', label: 'Customer Service' },
    { value: 'sales', label: 'Sales & Marketing' },
    { value: 'support', label: 'Technical Support' },
    { value: 'education', label: 'Education' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'finance', label: 'Finance' },
    { value: 'ecommerce', label: 'E-commerce' },
  ]

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex gap-2 items-center">
            <Bot className="w-5 h-5" />
            Basic Information
          </CardTitle>
          <CardDescription>
            Provide the essential details for your chatbot
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Bot Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Customer Support Bot"
              value={localData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Choose a clear, descriptive name for your chatbot
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe what your chatbot does and how it helps users..."
              value={localData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full min-h-[100px]"
            />
            <p className="text-xs text-gray-500">
              Provide a detailed description of your chatbot's purpose and capabilities
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={localData.category}
              onValueChange={(value) => handleChange('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Choose the category that best fits your chatbot's purpose
            </p>
          </div>
        </CardContent>
      </Card>


      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex gap-2 items-center">
            <MessageCircle className="w-5 h-5" />
            Preview
          </CardTitle>
          <CardDescription>
            This is how your chatbot will appear to users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-gray-50 rounded-lg border">
            <div className="flex gap-3 items-center mb-3">
              <div className="flex justify-center items-center w-8 h-8 bg-blue-600 rounded-full">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">
                  {localData.name || 'Your Bot Name'}
                </h3>
                <p className="text-sm text-gray-500">
                  {localData.category ? categories.find(c => c.value === localData.category)?.label : 'General Purpose'}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              {localData.description || 'Your bot description will appear here...'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
