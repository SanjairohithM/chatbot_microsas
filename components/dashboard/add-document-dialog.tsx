"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileText, Link } from "lucide-react"
import type { KnowledgeDocument } from "@/lib/types"

interface AddDocumentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (document: Partial<KnowledgeDocument>) => void
  editingDocument?: KnowledgeDocument | null
  botId: number
}

export function AddDocumentDialog({ open, onOpenChange, onSave, editingDocument, botId }: AddDocumentDialogProps) {
  const [activeTab, setActiveTab] = useState("text")
  const [formData, setFormData] = useState({
    title: editingDocument?.title || "",
    content: editingDocument?.content || "",
    file_type: editingDocument?.file_type || "text",
    url: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const documentData: Partial<KnowledgeDocument> = {
      bot_id: botId,
      title: formData.title,
      content: formData.content,
      file_type: formData.file_type,
      file_size: formData.content.length,
      status: "processing",
    }

    onSave(documentData)
    onOpenChange(false)

    // Reset form if creating new document
    if (!editingDocument) {
      setFormData({
        title: "",
        content: "",
        file_type: "text",
        url: "",
      })
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData({
        ...formData,
        title: formData.title || file.name,
        file_type: file.type.includes("pdf") ? "pdf" : file.type.includes("word") ? "docx" : "text",
      })

      // In a real app, you would read the file content here
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setFormData((prev) => ({ ...prev, content: content.substring(0, 1000) + "..." }))
      }
      reader.readAsText(file)
    }
  }

  const handleUrlFetch = async () => {
    if (!formData.url) return

    // Simulate URL fetching
    setFormData({
      ...formData,
      title: formData.title || "Web Page Content",
      content: `Content fetched from: ${formData.url}\n\nThis is simulated content that would be extracted from the webpage. In a real implementation, this would contain the actual webpage content.`,
      file_type: "web",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingDocument ? "Edit Document" : "Add Knowledge Document"}</DialogTitle>
          <DialogDescription>
            {editingDocument
              ? "Update the document content and settings."
              : "Add content to your bot's knowledge base from text, files, or web pages."}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="text" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Text
            </TabsTrigger>
            <TabsTrigger value="file" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              File
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              URL
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <div className="space-y-2">
              <Label htmlFor="title">Document Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter document title"
                required
              />
            </div>

            <TabsContent value="text" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Enter or paste your content here..."
                  rows={8}
                  required
                />
              </div>
            </TabsContent>

            <TabsContent value="file" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file">Upload File</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">Drag and drop a file here, or click to browse</p>
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileUpload}
                    accept=".txt,.pdf,.docx,.md"
                    className="max-w-xs mx-auto"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Supported formats: TXT, PDF, DOCX, MD (Max 10MB)</p>
              </div>

              {formData.content && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={6}
                    placeholder="File content will appear here..."
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="url" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">Website URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="url"
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://example.com/page"
                  />
                  <Button type="button" onClick={handleUrlFetch} variant="outline">
                    Fetch
                  </Button>
                </div>
              </div>

              {formData.content && (
                <div className="space-y-2">
                  <Label>Extracted Content</Label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={6}
                    placeholder="Extracted content will appear here..."
                  />
                </div>
              )}
            </TabsContent>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingDocument ? "Update Document" : "Add Document"}</Button>
            </DialogFooter>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
