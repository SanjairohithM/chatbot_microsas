"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sidebar } from "@/components/dashboard/sidebar"
import { KnowledgeDocumentCard } from "@/components/dashboard/knowledge-document-card"
import { AddDocumentDialog } from "@/components/dashboard/add-document-dialog"
import { useAuth } from "@/hooks/use-auth"
import type { KnowledgeDocument, Bot } from "@/lib/types"
import { mockKnowledgeDocuments, mockBots } from "@/lib/mock-data"
import { Plus, Search } from "lucide-react"

export default function KnowledgeBasePage() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [bots, setBots] = useState<Bot[]>([])
  const [selectedBotId, setSelectedBotId] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingDocument, setEditingDocument] = useState<KnowledgeDocument | null>(null)
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth")
      return
    }

    // Load mock data
    const userBots = mockBots.filter((bot) => bot.user_id === user?.id)
    setBots(userBots)

    // Load documents for user's bots
    const botIds = userBots.map((bot) => bot.id)
    setDocuments(mockKnowledgeDocuments.filter((doc) => botIds.includes(doc.bot_id)))

    // Set initial bot selection from URL params
    const botId = searchParams.get("botId")
    if (botId && userBots.find((bot) => bot.id === Number.parseInt(botId))) {
      setSelectedBotId(botId)
    }
  }, [user, isLoading, router, searchParams])

  const filteredDocuments = documents.filter((doc) => {
    const matchesBot = selectedBotId === "all" || doc.bot_id === Number.parseInt(selectedBotId)
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter

    return matchesBot && matchesSearch && matchesStatus
  })

  const handleAddDocument = (documentData: Partial<KnowledgeDocument>) => {
    const newDocument: KnowledgeDocument = {
      id: Math.max(...documents.map((d) => d.id), 0) + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...documentData,
    } as KnowledgeDocument

    setDocuments([...documents, newDocument])

    // Simulate processing -> indexed after 2 seconds
    setTimeout(() => {
      setDocuments((prev) =>
        prev.map((doc) => (doc.id === newDocument.id ? { ...doc, status: "indexed" as const } : doc)),
      )
    }, 2000)
  }

  const handleEditDocument = (document: KnowledgeDocument) => {
    setEditingDocument(document)
    setIsAddDialogOpen(true)
  }

  const handleUpdateDocument = (documentData: Partial<KnowledgeDocument>) => {
    if (!editingDocument) return

    setDocuments(
      documents.map((doc) =>
        doc.id === editingDocument.id ? { ...doc, ...documentData, updated_at: new Date().toISOString() } : doc,
      ),
    )
    setEditingDocument(null)
  }

  const handleDeleteDocument = (documentId: number) => {
    setDocuments(documents.filter((doc) => doc.id !== documentId))
  }

  const getBotName = (botId: number) => {
    return bots.find((bot) => bot.id === botId)?.name || "Unknown Bot"
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <div className="lg:pl-64">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Knowledge Base</h1>
              <p className="text-muted-foreground mt-1">Manage documents and content for your bots</p>
            </div>

            <Button onClick={() => setIsAddDialogOpen(true)} disabled={bots.length === 0} className="sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Document
            </Button>
          </div>

          {bots.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 bg-muted/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No bots available</h3>
              <p className="text-muted-foreground mb-4">Create a bot first to start adding knowledge documents.</p>
              <Button onClick={() => router.push("/dashboard")}>Create Your First Bot</Button>
            </div>
          ) : (
            <>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={selectedBotId} onValueChange={setSelectedBotId}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Select bot" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Bots</SelectItem>
                    {bots.map((bot) => (
                      <SelectItem key={bot.id} value={bot.id.toString()}>
                        {bot.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="indexed">Indexed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Documents Grid */}
              {filteredDocuments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 bg-muted/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Plus className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No documents found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery || statusFilter !== "all" || selectedBotId !== "all"
                      ? "Try adjusting your filters."
                      : "Start building your knowledge base by adding documents."}
                  </p>
                  {!searchQuery && statusFilter === "all" && selectedBotId !== "all" && (
                    <Button onClick={() => setIsAddDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Document
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredDocuments.map((document) => (
                    <div key={document.id} className="space-y-2">
                      <div className="text-sm text-muted-foreground">{getBotName(document.bot_id)}</div>
                      <KnowledgeDocumentCard
                        document={document}
                        onEdit={handleEditDocument}
                        onDelete={handleDeleteDocument}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <AddDocumentDialog
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          setIsAddDialogOpen(open)
          if (!open) setEditingDocument(null)
        }}
        onSave={editingDocument ? handleUpdateDocument : handleAddDocument}
        editingDocument={editingDocument}
        botId={selectedBotId !== "all" ? Number.parseInt(selectedBotId) : bots[0]?.id || 1}
      />
    </div>
  )
}
