"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Globe, Bot, Settings, Palette, FileText, Zap, CheckCircle, AlertCircle } from "lucide-react"
import type { Bot as BotType } from "@/lib/types"

interface CreateBotDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (bot: Partial<BotType>) => void
  editingBot?: BotType | null
}

export function CreateBotDialog({ open, onOpenChange, onSave, editingBot }: CreateBotDialogProps) {
  const [formData, setFormData] = useState({
    name: editingBot?.name || "",
    description: editingBot?.description || "",
    system_prompt: editingBot?.system_prompt || "",
    model: editingBot?.model || "deepseek-chat",
    temperature: editingBot?.temperature || 0.7,
    max_tokens: editingBot?.max_tokens || 1000,
    // Website integration
    website_url: "",
    website_content: "",
    auto_scrape: true,
    // Branding
    bot_avatar: "",
    primary_color: "#3b82f6",
    secondary_color: "#1e40af",
    // Advanced settings
    enable_memory: true,
    max_conversation_length: 50,
    response_style: "professional",
    language: "en",
  })

  const [isScraping, setIsScraping] = useState(false)
  const [scrapeStatus, setScrapeStatus] = useState<"idle" | "success" | "error">("idle")

  const handleScrapeWebsite = async () => {
    if (!formData.website_url) return
    
    setIsScraping(true)
    setScrapeStatus("idle")
    
    try {
      const response = await fetch('/api/scrape-website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: formData.website_url }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      const scrapedContent = data.data.content
      
      setFormData(prev => ({
        ...prev,
        website_content: scrapedContent,
        system_prompt: prev.system_prompt || `You are a helpful customer support assistant for ${formData.website_url}. Use the following information about the company to answer questions:

${scrapedContent}

Be polite, professional, and helpful. If you don't know something, politely say so and offer to connect them with a human representative.`
      }))
      
      setScrapeStatus("success")
    } catch (error) {
      console.error('Website scraping failed:', error)
      setScrapeStatus("error")
    } finally {
      setIsScraping(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Only send the fields that are stored in the database according to Prisma schema
    const botData = {
      name: formData.name,
      description: formData.description,
      system_prompt: formData.system_prompt,
      model: formData.model,
      temperature: formData.temperature,
      max_tokens: formData.max_tokens,
      status: "draft" as const,
      is_deployed: false,
    }
    
    onSave(botData)
    onOpenChange(false)
    // Reset form if creating new bot
    if (!editingBot) {
      setFormData({
        name: "",
        description: "",
        system_prompt: "",
        model: "deepseek-chat",
        temperature: 0.7,
        max_tokens: 1000,
        website_url: "",
        website_content: "",
        auto_scrape: true,
        bot_avatar: "",
        primary_color: "#3b82f6",
        secondary_color: "#1e40af",
        enable_memory: true,
        max_conversation_length: 50,
        response_style: "professional",
        language: "en",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            {editingBot ? "Edit Bot" : "Create AI Chatbot"}
          </DialogTitle>
          <DialogDescription>
            {editingBot
              ? "Update your bot configuration and settings."
              : "Build a powerful AI chatbot for your website with DeepSeek AI. Configure behavior, appearance, and knowledge base."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                Basic
              </TabsTrigger>
              <TabsTrigger value="website" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Website
              </TabsTrigger>
              <TabsTrigger value="knowledge" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Knowledge
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Appearance
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Advanced
              </TabsTrigger>
            </TabsList>

            {/* Basic Configuration */}
            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    Basic Configuration
                  </CardTitle>
                  <CardDescription>
                    Set up the fundamental settings for your chatbot
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Bot Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Customer Support Bot"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="model">AI Model</Label>
                      <Select value={formData.model} onValueChange={(value) => setFormData({ ...formData, model: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="deepseek-chat">DeepSeek Chat</SelectItem>
                          <SelectItem value="deepseek-coder">DeepSeek Coder</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of what this bot does"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label>Temperature: {formData.temperature}</Label>
                      <Slider
                        value={[formData.temperature]}
                        onValueChange={([value]) => setFormData({ ...formData, temperature: value })}
                        max={2}
                        min={0}
                        step={0.1}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Controls randomness. Lower = more focused, Higher = more creative
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label>Max Tokens: {formData.max_tokens}</Label>
                      <Slider
                        value={[formData.max_tokens]}
                        onValueChange={([value]) => setFormData({ ...formData, max_tokens: value })}
                        max={4000}
                        min={100}
                        step={100}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">Maximum length of bot responses</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Website Integration */}
            <TabsContent value="website" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Website Integration
                  </CardTitle>
                  <CardDescription>
                    Connect your chatbot to your website for automatic knowledge extraction
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="website_url">Website URL</Label>
                    <div className="flex gap-2">
                      <Input
                        id="website_url"
                        value={formData.website_url}
                        onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                        placeholder="https://your-website.com"
                        type="url"
                      />
                      <Button 
                        type="button" 
                        onClick={handleScrapeWebsite}
                        disabled={!formData.website_url || isScraping}
                        className="whitespace-nowrap"
                      >
                        {isScraping ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Scraping...
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4 mr-2" />
                            Scrape Content
                          </>
                        )}
                      </Button>
                    </div>
                    {scrapeStatus === "success" && (
                      <div className="flex items-center gap-2 text-green-600 text-sm">
                        <CheckCircle className="h-4 w-4" />
                        Website content successfully extracted!
                      </div>
                    )}
                    {scrapeStatus === "error" && (
                      <div className="flex items-center gap-2 text-red-600 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        Failed to extract website content. Please try again.
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auto_scrape"
                      checked={formData.auto_scrape}
                      onCheckedChange={(checked) => setFormData({ ...formData, auto_scrape: checked })}
                    />
                    <Label htmlFor="auto_scrape">Auto-update content when website changes</Label>
                  </div>

                  {formData.website_content && (
                    <div className="space-y-2">
                      <Label>Extracted Content Preview</Label>
                      <div className="p-3 bg-muted rounded-lg max-h-32 overflow-y-auto text-sm">
                        {formData.website_content.substring(0, 300)}...
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Knowledge Base */}
            <TabsContent value="knowledge" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Knowledge Base
                  </CardTitle>
                  <CardDescription>
                    Configure how your bot understands and responds to questions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="system_prompt">System Prompt</Label>
                    <Textarea
                      id="system_prompt"
                      value={formData.system_prompt}
                      onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                      placeholder="You are a helpful customer support assistant..."
                      rows={6}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      This defines your bot's personality and behavior. Include website content here for context.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="response_style">Response Style</Label>
                      <Select value={formData.response_style} onValueChange={(value) => setFormData({ ...formData, response_style: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="friendly">Friendly</SelectItem>
                          <SelectItem value="casual">Casual</SelectItem>
                          <SelectItem value="formal">Formal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select value={formData.language} onValueChange={(value) => setFormData({ ...formData, language: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                          <SelectItem value="de">German</SelectItem>
                          <SelectItem value="zh">Chinese</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Appearance */}
            <TabsContent value="appearance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Appearance & Branding
                  </CardTitle>
                  <CardDescription>
                    Customize how your chatbot looks and feels
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bot_avatar">Bot Avatar URL</Label>
                    <Input
                      id="bot_avatar"
                      value={formData.bot_avatar}
                      onChange={(e) => setFormData({ ...formData, bot_avatar: e.target.value })}
                      placeholder="https://example.com/bot-avatar.png"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primary_color">Primary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="primary_color"
                          value={formData.primary_color}
                          onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                          type="color"
                          className="w-16 h-10"
                        />
                        <Input
                          value={formData.primary_color}
                          onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                          placeholder="#3b82f6"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="secondary_color">Secondary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="secondary_color"
                          value={formData.secondary_color}
                          onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                          type="color"
                          className="w-16 h-10"
                        />
                        <Input
                          value={formData.secondary_color}
                          onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                          placeholder="#1e40af"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg bg-muted/30">
                    <h4 className="font-medium mb-2">Preview</h4>
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                        style={{ backgroundColor: formData.primary_color }}
                      >
                        {formData.name.charAt(0).toUpperCase() || 'B'}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{formData.name || 'Your Bot'}</div>
                        <div className="text-xs text-muted-foreground">Online</div>
                      </div>
                      <Badge 
                        variant="outline" 
                        style={{ 
                          borderColor: formData.primary_color, 
                          color: formData.primary_color 
                        }}
                      >
                        {formData.model}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Advanced Settings */}
            <TabsContent value="advanced" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Advanced Settings
                  </CardTitle>
                  <CardDescription>
                    Fine-tune advanced behavior and performance settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enable_memory"
                      checked={formData.enable_memory}
                      onCheckedChange={(checked) => setFormData({ ...formData, enable_memory: checked })}
                    />
                    <Label htmlFor="enable_memory">Enable conversation memory</Label>
                  </div>

                  <div className="space-y-2">
                    <Label>Max Conversation Length: {formData.max_conversation_length}</Label>
                    <Slider
                      value={[formData.max_conversation_length]}
                      onValueChange={([value]) => setFormData({ ...formData, max_conversation_length: value })}
                      max={100}
                      min={10}
                      step={5}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum number of messages to keep in conversation history
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Deployment Options</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 border rounded-lg">
                        <h4 className="font-medium text-sm">Website Widget</h4>
                        <p className="text-xs text-muted-foreground">Embed as chat widget</p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <h4 className="font-medium text-sm">API Integration</h4>
                        <p className="text-xs text-muted-foreground">Use via REST API</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="min-w-[120px]">
              {editingBot ? "Update Bot" : "Create Bot"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
