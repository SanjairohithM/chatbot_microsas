"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Upload, X, Globe, Link, Zap } from "lucide-react"
import type { Bot as BotType, KnowledgeDocument } from "@/lib/types"

interface StepTwoProps {
  documents: KnowledgeDocument[]
  onChange: (documents: KnowledgeDocument[]) => void
  formData: Partial<BotType>
  onFormDataChange: (data: Partial<BotType>) => void
}

export function StepTwo({ documents, onChange, formData, onFormDataChange }: StepTwoProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isScraping, setIsScraping] = useState(false)
  const [scrapeStatus, setScrapeStatus] = useState<"idle" | "success" | "error">("idle")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (files: FileList) => {
    setIsUploading(true)
    setUploadProgress(0)

    try {
      const newDocuments: KnowledgeDocument[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setUploadProgress(((i + 1) / files.length) * 100)

        // Read file content
        const content = await readFileContent(file)
        
        const document: KnowledgeDocument = {
          id: Date.now() + i, // Temporary ID
          bot_id: 0, // Will be set when bot is created
          title: file.name,
          content: content,
          file_url: '', // Will be set after upload
          file_type: file.type,
          file_size: file.size,
          status: 'processing',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        newDocuments.push(document)
      }

      onChange([...documents, ...newDocuments])
      setUploadProgress(100)
    } catch (error) {
      console.error('Error uploading files:', error)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        resolve(e.target?.result as string || '')
      }
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  const handleRemoveDocument = (index: number) => {
    const newDocuments = documents.filter((_, i) => i !== index)
    onChange(newDocuments)
  }

  const handleWebsiteContentChange = (content: string) => {
    onFormDataChange({
      ...formData,
      website_content: content,
    } as any)
  }

  const handleScrapeWebsite = async () => {
    const websiteUrl = (formData as any).website_url
    if (!websiteUrl) return
    
    setIsScraping(true)
    setScrapeStatus("idle")
    
    try {
      const response = await fetch('/api/scrape-website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: websiteUrl }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      const scrapedContent = data.data.content
      
      onFormDataChange({
        ...formData,
        website_content: scrapedContent,
        system_prompt: formData.system_prompt || `You are a helpful customer support assistant for ${websiteUrl}. Use the following information about the company to answer questions:

${scrapedContent}

Be polite, professional, and helpful. If you don't know something, politely say so and offer to connect them with a human representative.`
      } as any)
      
      setScrapeStatus("success")
    } catch (error) {
      console.error('Website scraping failed:', error)
      setScrapeStatus("error")
    } finally {
      setIsScraping(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex gap-2 items-center">
            <FileText className="w-5 h-5" />
            Upload Documents
          </CardTitle>
          <CardDescription>
            Add PDF, TXT, or other text files to your chatbot's knowledge base
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-6 text-center rounded-lg border-2 border-gray-300 border-dashed">
            <Upload className="mx-auto mb-4 w-12 h-12 text-gray-400" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900">Upload Knowledge Documents</p>
              <p className="text-sm text-gray-500">
                Drag and drop files here, or click to browse
              </p>
              <p className="text-xs text-gray-400">
                Supports PDF, TXT, DOC, DOCX files (max 10MB each)
              </p>
            </div>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="mt-4"
            >
              <Upload className="mr-2 w-4 h-4" />
              Choose Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.txt,.doc,.docx"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              className="hidden"
            />
          </div>

          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading files...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full">
                <div
                  className="h-2 bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Website Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex gap-2 items-center">
            <Globe className="w-5 h-5" />
            Website Content
          </CardTitle>
          <CardDescription>
            Add custom content from your website or scrape content automatically
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Website URL and Scrape Button */}
          <div className="space-y-2">
            <Label htmlFor="website_url">Website URL</Label>
            <div className="flex gap-2">
              <Input
                id="website_url"
                value={(formData as any).website_url || ''}
                onChange={(e) => onFormDataChange({
                  ...formData,
                  website_url: e.target.value
                } as any)}
                placeholder="https://your-website.com"
                type="url"
                className="flex-1"
              />
              <Button 
                type="button" 
                onClick={handleScrapeWebsite}
                disabled={!(formData as any).website_url || isScraping}
                className="whitespace-nowrap"
              >
                {isScraping ? (
                  <>
                    <div className="mr-2 w-4 h-4 rounded-full border-b-2 border-white animate-spin"></div>
                    Scraping...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 w-4 h-4" />
                    Scrape Content
                  </>
                )}
              </Button>
            </div>
            {scrapeStatus === "success" && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">
                  ✅ Website content scraped successfully! The content has been added below.
                </p>
              </div>
            )}
            {scrapeStatus === "error" && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-800">
                  ❌ Failed to scrape website. Please check the URL and try again, or manually paste the content below.
                </p>
              </div>
            )}
          </div>

          {/* Website Content Textarea */}
          <div className="space-y-2">
            <Label htmlFor="website_content">Website Content</Label>
            <Textarea
              id="website_content"
              placeholder="Paste content from your website, FAQs, or other sources here..."
              value={(formData as any).website_content || ''}
              onChange={(e) => handleWebsiteContentChange(e.target.value)}
              className="w-full min-h-[200px]"
            />
            <p className="text-xs text-gray-500">
              You can scrape content automatically using the button above, or manually paste content from your website, FAQs, product descriptions, or any other text that will help your chatbot answer questions
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Documents */}
      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Documents</CardTitle>
            <CardDescription>
              {documents.length} document{documents.length !== 1 ? 's' : ''} ready for processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documents.map((doc, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 rounded-lg border"
                >
                  <div className="flex gap-3 items-center">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">{doc.title}</p>
                      <p className="text-xs text-gray-500">
                        {doc.file_type} • {((doc.file_size || 0) / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Badge variant="secondary" className="text-xs">
                      {doc.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveDocument(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Knowledge Base Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Knowledge Base Preview</CardTitle>
          <CardDescription>
            Summary of your chatbot's knowledge sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex gap-2 items-center mb-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-900">Documents</span>
              </div>
              <p className="text-sm text-blue-700">
                {documents.length} file{documents.length !== 1 ? 's' : ''} uploaded
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex gap-2 items-center mb-2">
                <Globe className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-900">Website Content</span>
              </div>
              <p className="text-sm text-green-700">
                {((formData as any).website_content || '').length > 0 ? 'Content added' : 'No content'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
