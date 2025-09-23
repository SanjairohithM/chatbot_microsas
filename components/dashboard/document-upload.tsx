"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { FileText, Upload, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import type { KnowledgeDocument } from "@/lib/types"

interface DocumentUploadProps {
  botId?: number
  onDocumentUploaded?: (document: KnowledgeDocument) => void
  onDocumentRemoved?: (documentId: number) => void
  maxFileSize?: number // in MB
  acceptedFormats?: string[]
}

interface UploadedDocument {
  id: string
  name: string
  content: string
  fileType: string
  fileSize: number
  status: 'uploading' | 'processing' | 'indexed' | 'error'
  progress?: number
}

export function DocumentUpload({ 
  botId, 
  onDocumentUploaded, 
  onDocumentRemoved,
  maxFileSize = 10,
  acceptedFormats = ['.txt', '.pdf', '.docx', '.md']
}: DocumentUploadProps) {
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (file: File) => {
    if (!file) return

    // Validate file size
    if (file.size > maxFileSize * 1024 * 1024) {
      alert(`File size must be less than ${maxFileSize}MB`)
      return
    }

    // Validate file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!acceptedFormats.includes(fileExtension)) {
      alert(`File type not supported. Accepted formats: ${acceptedFormats.join(', ')}`)
      return
    }

    const documentId = Date.now().toString()
    const newDocument: UploadedDocument = {
      id: documentId,
      name: file.name,
      content: '',
      fileType: fileExtension,
      fileSize: file.size,
      status: 'uploading',
      progress: 0
    }

    setUploadedDocuments(prev => [...prev, newDocument])
    setIsUploading(true)

    try {
      // Read file content
      const content = await readFileContent(file)
      
      // Update document with content
      setUploadedDocuments(prev => 
        prev.map(doc => 
          doc.id === documentId 
            ? { ...doc, content, status: 'processing', progress: 50 }
            : doc
        )
      )

      // If botId is provided, save to database
      if (botId) {
        const response = await fetch('/api/knowledge-documents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bot_id: botId,
            title: file.name,
            content: content,
            file_type: fileExtension.substring(1), // Remove the dot
            file_size: file.size,
            status: 'processing'
          })
        })

        if (response.ok) {
          const result = await response.json()
          const savedDocument = result.data

          // Update document status
          setUploadedDocuments(prev => 
            prev.map(doc => 
              doc.id === documentId 
                ? { ...doc, status: 'indexed', progress: 100 }
                : doc
            )
          )

          onDocumentUploaded?.(savedDocument)
        } else {
          throw new Error('Failed to save document')
        }
      } else {
        // For bot creation, create a temporary document object
        const tempDocument: KnowledgeDocument = {
          id: parseInt(documentId), // Use timestamp as temporary ID
          bot_id: 0, // Will be set when bot is created
          title: file.name,
          content: content,
          file_type: fileExtension.substring(1),
          file_size: file.size,
          status: 'processing',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        // Update document status
        setUploadedDocuments(prev => 
          prev.map(doc => 
            doc.id === documentId 
              ? { ...doc, status: 'indexed', progress: 100 }
              : doc
          )
        )

        onDocumentUploaded?.(tempDocument)
      }
    } catch (error) {
      console.error('Error uploading document:', error)
      setUploadedDocuments(prev => 
        prev.map(doc => 
          doc.id === documentId 
            ? { ...doc, status: 'error', progress: 0 }
            : doc
        )
      )
    } finally {
      setIsUploading(false)
    }
  }

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        resolve(content)
      }
      reader.onerror = reject
      
      if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        reader.readAsText(file)
      } else {
        // For other file types, we'll need more sophisticated parsing
        // For now, just read as text
        reader.readAsText(file)
      }
    })
  }

  const handleDirectContentUpload = async (title: string, content: string) => {
    if (!content.trim()) return

    const documentId = Date.now().toString()
    const newDocument: UploadedDocument = {
      id: documentId,
      name: title || 'Untitled Document',
      content: content,
      fileType: '.txt',
      fileSize: content.length,
      status: 'processing',
      progress: 50
    }

    setUploadedDocuments(prev => [...prev, newDocument])
    setIsUploading(true)

    try {
      if (botId) {
        const response = await fetch('/api/knowledge-documents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bot_id: botId,
            title: title || 'Untitled Document',
            content: content,
            file_type: 'text',
            file_size: content.length,
            status: 'processing'
          })
        })

        if (response.ok) {
          const result = await response.json()
          const savedDocument = result.data

          setUploadedDocuments(prev => 
            prev.map(doc => 
              doc.id === documentId 
                ? { ...doc, status: 'indexed', progress: 100 }
                : doc
            )
          )

          onDocumentUploaded?.(savedDocument)
        } else {
          throw new Error('Failed to save document')
        }
      } else {
        // For bot creation, create a temporary document object
        const tempDocument: KnowledgeDocument = {
          id: parseInt(documentId), // Use timestamp as temporary ID
          bot_id: 0, // Will be set when bot is created
          title: title || 'Untitled Document',
          content: content,
          file_type: 'text',
          file_size: content.length,
          status: 'processing',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        setUploadedDocuments(prev => 
          prev.map(doc => 
            doc.id === documentId 
              ? { ...doc, status: 'indexed', progress: 100 }
              : doc
          )
        )

        onDocumentUploaded?.(tempDocument)
      }
    } catch (error) {
      console.error('Error uploading content:', error)
      setUploadedDocuments(prev => 
        prev.map(doc => 
          doc.id === documentId 
            ? { ...doc, status: 'error', progress: 0 }
            : doc
        )
      )
    } finally {
      setIsUploading(false)
    }
  }

  const removeDocument = (documentId: string) => {
    setUploadedDocuments(prev => prev.filter(doc => doc.id !== documentId))
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'indexed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'indexed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-4">
      {/* File Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground mb-2">
          Drag and drop a file here, or click to browse
        </p>
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </>
          )}
        </Button>
        <Input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(',')}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFileUpload(file)
          }}
          className="hidden"
        />
        <p className="text-xs text-muted-foreground mt-2">
          Supported formats: {acceptedFormats.join(', ')} (Max {maxFileSize}MB)
        </p>
      </div>

      {/* Direct Content Input */}
      <div className="space-y-2">
        <Label htmlFor="direct_content">Or paste content directly</Label>
        <Textarea
          id="direct_content"
          placeholder="Paste your document content here..."
          rows={4}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
              const content = e.currentTarget.value
              if (content.trim()) {
                handleDirectContentUpload('Pasted Content', content)
                e.currentTarget.value = ''
              }
            }
          }}
        />
        <p className="text-xs text-muted-foreground">
          Press Ctrl+Enter to upload the content
        </p>
      </div>

      {/* Uploaded Documents List */}
      {uploadedDocuments.length > 0 && (
        <div className="space-y-2">
          <Label>Uploaded Documents</Label>
          <div className="space-y-2">
            {uploadedDocuments.map((doc) => (
              <Card key={doc.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(doc.status)}
                    <div>
                      <p className="text-sm font-medium">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.fileType} • {(doc.fileSize / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(doc.status)}>
                      {doc.status}
                    </Badge>
                    {doc.progress !== undefined && doc.progress < 100 && (
                      <div className="w-16">
                        <Progress value={doc.progress} className="h-2" />
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDocument(doc.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
