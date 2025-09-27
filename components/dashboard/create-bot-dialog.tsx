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
import { Globe, Bot, Settings, Palette, FileText, Zap, CheckCircle, AlertCircle, X } from "lucide-react"
import type { Bot as BotType, KnowledgeDocument } from "@/lib/types"

interface CreateBotDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (bot: Partial<BotType>, documents?: KnowledgeDocument[]) => void
  editingBot?: BotType | null
}

export function CreateBotDialog({ open, onOpenChange, onSave, editingBot }: CreateBotDialogProps) {
  const [formData, setFormData] = useState({
    name: editingBot?.name || "",
    description: editingBot?.description || "",
    system_prompt: editingBot?.system_prompt || "",
    model: editingBot?.model || "gpt-4o-mini",
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
  
  // Document upload state
  const [uploadedDocuments, setUploadedDocuments] = useState<KnowledgeDocument[]>([])
  const [isCreatingBot, setIsCreatingBot] = useState(false)

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

  // Handle document upload
  const handleDocumentUploaded = (document: KnowledgeDocument) => {
    setUploadedDocuments(prev => [...prev, document])
  }

  // Handle document removal
  const handleDocumentRemoved = (documentId: number) => {
    setUploadedDocuments(prev => prev.filter(doc => doc.id !== documentId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreatingBot(true)
    
    try {
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
      
      // Pass both bot data and uploaded documents
      onSave(botData, uploadedDocuments)
      onOpenChange(false)
      
      // Reset form if creating new bot
      if (!editingBot) {
        setFormData({
          name: "",
          description: "",
          system_prompt: "",
          model: "gpt-4o-mini",
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
        setUploadedDocuments([])
      }
    } catch (error) {
      console.error('Error creating bot:', error)
    } finally {
      setIsCreatingBot(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-none h-[95vh] overflow-y-auto">
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

        <form onSubmit={handleSubmit} className="space-y-6 h-full flex flex-col">
          <Tabs defaultValue="basic" className="w-full flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-5 gap-2 p-1">
              <TabsTrigger value="basic" className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium">
                <Bot className="h-4 w-4" />
                Basic
              </TabsTrigger>
              <TabsTrigger value="website" className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium">
                <Globe className="h-4 w-4" />
                Website
              </TabsTrigger>
              <TabsTrigger value="knowledge" className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium">
                <FileText className="h-4 w-4" />
                Knowledge
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium">
                <Palette className="h-4 w-4" />
                Appearance
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium">
                <Settings className="h-4 w-4" />
                Advanced
              </TabsTrigger>
            </TabsList>

            {/* Basic Configuration */}
            <TabsContent value="basic" className="space-y-6 flex-1 overflow-y-auto">
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
                          <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                          <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                          <SelectItem value="o3-mini">o3-mini</SelectItem>
                          <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
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
            <TabsContent value="website" className="space-y-6 flex-1 overflow-y-auto">
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
            <TabsContent value="knowledge" className="space-y-6 flex-1 overflow-y-auto">
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
                      rows={4}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      This defines your bot's personality and behavior. Include website content here for context.
                    </p>
                  </div>

                  {/* Document Upload Section - Moved up for better visibility */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Upload Documents</Label>
                      <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                        <FileText className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">Add documents to enhance your bot's knowledge</p>
                        <Input
                          type="file"
                          accept=".txt,.pdf,.docx,.md"
                          className="max-w-xs mx-auto"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            console.log('File selected:', file.name)
                            
                            try {
                              console.log('🚀 Attempting direct Pinecone upload for bot creation...')
                              
                              // Try direct Pinecone upload first (for existing bots)
                              if (editingBot?.id) {
                                const formData = new FormData()
                                formData.append('file', file)
                                formData.append('botId', editingBot.id.toString())
                                
                                const pineconeResponse = await fetch('/api/upload-to-pinecone', {
                                  method: 'POST',
                                  body: formData
                                })
                                
                                if (pineconeResponse.ok) {
                                  const pineconeResult = await pineconeResponse.json()
                                  console.log('✅ Direct Pinecone upload successful for bot creation:', pineconeResult.data)
                                  
                                  // Create document object for bot creation
                                  const pineconeDocument: KnowledgeDocument = {
                                    id: pineconeResult.data.documentId,
                                    bot_id: editingBot.id,
                                    title: file.name,
                                    content: `Document stored in Pinecone (${pineconeResult.data.wordCount} words)`,
                                    file_type: file.type,
                                    file_size: file.size,
                                    status: 'indexed',
                                    created_at: pineconeResult.data.timestamp,
                                    updated_at: pineconeResult.data.timestamp
                                  }
                                  
                                  handleDocumentUploaded(pineconeDocument)
                                  return // Success, exit early
                                } else {
                                  console.log('⚠️ Direct Pinecone upload failed for bot creation, falling back to regular upload')
                                }
                              }
                              
                              // Fallback to regular upload for new bots or if Pinecone fails
                              console.log('📁 Using regular upload for bot creation...')
                              const formData = new FormData()
                              formData.append('file', file)
                              
                              const uploadResponse = await fetch('/api/upload', {
                                method: 'POST',
                                body: formData
                              })
                              
                              if (!uploadResponse.ok) {
                                throw new Error('Upload failed')
                              }
                              
                              const uploadData = await uploadResponse.json()
                              
                              // Create document with file URL
                              const tempDocument: KnowledgeDocument = {
                                id: Date.now(),
                                bot_id: 0,
                                title: file.name,
                                content: 'Processing...', // Will be updated after processing
                                file_url: uploadData.data.fileUrl,
                                file_type: uploadData.data.fileType,
                                file_size: uploadData.data.fileSize,
                                status: 'processing',
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString()
                              }
                              
                              handleDocumentUploaded(tempDocument)
                              
                            } catch (error) {
                              console.error('Upload error:', error)
                              alert('Failed to upload file. Please try again.')
                            }
                          }
                        }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Supported: TXT, PDF, DOCX, MD (Max 10MB)</p>
                    </div>

                    {/* Direct Content Input */}
                    <div className="space-y-2">
                      <Label htmlFor="document_content">Or paste content directly</Label>
                      <Textarea
                        id="document_content"
                        placeholder="Paste your document content here..."
                        rows={3}
                        onChange={(e) => {
                          let content = e.target.value
                          if (content.trim()) {
                            // Sanitize content to remove null bytes and invalid UTF-8 sequences
                            content = content
                              .replace(/\0/g, '') // Remove null bytes
                              .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
                              .trim()
                            
                            const tempDocument: KnowledgeDocument = {
                              id: Date.now(),
                              bot_id: 0,
                              title: 'Pasted Content',
                              content: content,
                              file_type: 'text',
                              file_size: content.length,
                              status: 'processing',
                              created_at: new Date().toISOString(),
                              updated_at: new Date().toISOString()
                            }
                            handleDocumentUploaded(tempDocument)
                          }
                        }}
                      />
                    </div>
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

                  {/* Document Preview */}
                  {uploadedDocuments.length > 0 && (
                    <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                      <p className="text-sm font-medium mb-2">
                        Documents to be saved with bot: {uploadedDocuments.length}
                      </p>
                      <div className="space-y-1">
                        {uploadedDocuments.map((doc) => (
                          <div key={doc.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <FileText className="h-3 w-3" />
                            <span>{doc.title}</span>
                            <Badge variant="outline" className="text-xs">
                              {doc.file_type}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDocumentRemoved(doc.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Appearance */}
            <TabsContent value="appearance" className="space-y-6 flex-1 overflow-y-auto">
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
            <TabsContent value="advanced" className="space-y-6 flex-1 overflow-y-auto">
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isCreatingBot}>
              Cancel
            </Button>
            <Button type="submit" className="min-w-[120px]" disabled={isCreatingBot}>
              {isCreatingBot ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {editingBot ? "Updating..." : "Creating..."}
                </>
              ) : (
                editingBot ? "Update Bot" : "Create Bot"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
