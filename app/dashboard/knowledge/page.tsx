"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

  // Listen for custom event from layout to open create bot dialog
  useEffect(() => {
    const handleOpenCreateBotDialog = () => {
      // Navigate to dashboard page to create bot
      router.push("/dashboard")
    }

    window.addEventListener('openCreateBotDialog', handleOpenCreateBotDialog)
    
    return () => {
      window.removeEventListener('openCreateBotDialog', handleOpenCreateBotDialog)
    }
  }, [router])

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
    <div>
      <h1>Test Knowledge</h1>
    </div>
  )
}
