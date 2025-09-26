"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sidebar } from "@/components/dashboard/sidebar"
import { DeploymentCard } from "@/components/dashboard/deployment-card"
import { DeploymentSettingsDialog } from "@/components/dashboard/deployment-settings-dialog"
import { WidgetEmbedCode } from "@/components/dashboard/chatbot-widget"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import type { Bot } from "@/lib/types"
import { mockBots } from "@/lib/mock-data"
import { Search, Rocket, Plus, Globe, Code, Settings, Eye } from "lucide-react"

export default function DeploymentPage() {
  const [bots, setBots] = useState<Bot[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const { user, isLoading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth")
      return
    }

    // Load mock data
    const userBots = mockBots.filter((bot) => bot.user_id === user?.id)
    setBots(userBots)
  }, [user, isLoading, router])

  const filteredBots = bots.filter((bot) => {
    const matchesSearch =
      bot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bot.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "deployed" && bot.is_deployed) ||
      (statusFilter === "not-deployed" && !bot.is_deployed) ||
      (statusFilter === "active" && bot.is_deployed && bot.status === "active") ||
      (statusFilter === "paused" && bot.is_deployed && bot.status === "inactive")

    return matchesSearch && matchesStatus
  })

  const handleDeploy = (botId: number) => {
    setBots(
      bots.map((bot) =>
        bot.id === botId
          ? {
              ...bot,
              is_deployed: true,
              status: "active" as const,
              deployment_url: `https://bot-${botId}.chatbot-platform.com`,
              updated_at: new Date().toISOString(),
            }
          : bot,
      ),
    )

    toast({
      title: "Bot Deployed",
      description: "Your bot is now live and accessible to users.",
    })
  }

  const handleUndeploy = (botId: number) => {
    setBots(
      bots.map((bot) =>
        bot.id === botId
          ? {
              ...bot,
              is_deployed: false,
              status: "inactive" as const,
              deployment_url: undefined,
              updated_at: new Date().toISOString(),
            }
          : bot,
      ),
    )

    toast({
      title: "Bot Undeployed",
      description: "Your bot has been taken offline.",
      variant: "destructive",
    })
  }

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    toast({
      title: "URL Copied",
      description: "Deployment URL has been copied to clipboard.",
    })
  }

  const handleViewSettings = (botId: number) => {
    const bot = bots.find((b) => b.id === botId)
    if (bot) {
      setSelectedBot(bot)
      setIsSettingsOpen(true)
    }
  }

  const handleSaveSettings = (botId: number, settings: any) => {
    // In a real app, this would save to the backend
    toast({
      title: "Settings Saved",
      description: "Deployment settings have been updated successfully.",
    })
  }

  const deployedCount = bots.filter((bot) => bot.is_deployed).length
  const activeCount = bots.filter((bot) => bot.is_deployed && bot.status === "active").length

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
              <h1 className="text-3xl font-bold text-foreground">Deployment</h1>
              <p className="text-muted-foreground mt-1">
                Deploy and manage your bots in production • {deployedCount} deployed • {activeCount} active
              </p>
            </div>

            <Button onClick={() => router.push("/dashboard")} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create Bot
            </Button>
          </div>

          {bots.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 bg-muted/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Rocket className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No bots available</h3>
              <p className="text-muted-foreground mb-4">Create your first bot to start deploying.</p>
              <Button onClick={() => router.push("/dashboard")}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Bot
              </Button>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="widget" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Website Widget
                </TabsTrigger>
                <TabsTrigger value="api" className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  API Integration
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search bots..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Bots</SelectItem>
                      <SelectItem value="deployed">Deployed</SelectItem>
                      <SelectItem value="not-deployed">Not Deployed</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Deployment Cards */}
                {filteredBots.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="p-4 bg-muted/30 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Search className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No bots found</h3>
                    <p className="text-muted-foreground">Try adjusting your search terms or filters.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredBots.map((bot) => (
                      <DeploymentCard
                        key={bot.id}
                        bot={bot}
                        onDeploy={handleDeploy}
                        onUndeploy={handleUndeploy}
                        onCopyUrl={handleCopyUrl}
                        onViewSettings={handleViewSettings}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Website Widget Tab */}
              <TabsContent value="widget" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Globe className="h-5 w-5" />
                          Deployed Bots
                        </CardTitle>
                        <CardDescription>
                          Select a deployed bot to generate embed code
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {bots.filter(bot => bot.is_deployed).map((bot) => (
                            <div
                              key={bot.id}
                              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                selectedBot?.id === bot.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                              }`}
                              onClick={() => setSelectedBot(bot)}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium">{bot.name}</div>
                                  <div className="text-sm text-muted-foreground">{bot.description}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">{bot.model}</Badge>
                                  <Badge variant={bot.status === 'active' ? 'default' : 'secondary'}>
                                    {bot.status}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {bots.filter(bot => bot.is_deployed).length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            No deployed bots available. Deploy a bot first to generate embed code.
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    {selectedBot ? (
                      <WidgetEmbedCode bot={selectedBot} />
                    ) : (
                      <Card>
                        <CardHeader>
                          <CardTitle>Widget Embed Code</CardTitle>
                          <CardDescription>
                            Select a deployed bot to generate embed code
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center py-8 text-muted-foreground">
                            Choose a deployed bot from the list to see embed options
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* API Integration Tab */}
              <TabsContent value="api" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      API Integration
                    </CardTitle>
                    <CardDescription>
                      Integrate your chatbots using our REST API
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-medium">API Endpoints</h4>
                        <div className="space-y-3">
                          <div className="p-3 border rounded-lg">
                            <div className="font-mono text-sm font-medium">POST /api/chat</div>
                            <div className="text-sm text-muted-foreground">Send messages to your bot</div>
                          </div>
                          <div className="p-3 border rounded-lg">
                            <div className="font-mono text-sm font-medium">GET /api/bots/{`{id}`}</div>
                            <div className="text-sm text-muted-foreground">Get bot configuration</div>
                          </div>
                          <div className="p-3 border rounded-lg">
                            <div className="font-mono text-sm font-medium">GET /api/analytics/{`{id}`}</div>
                            <div className="text-sm text-muted-foreground">Get bot analytics</div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium">Example Usage</h4>
                        <div className="p-3 bg-muted rounded-lg">
                          <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
{`curl -X POST ${window.location.origin}/api/chat \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [
      {"role": "user", "content": "Hello!"}
    ],
    "botConfig": {
      "model": "gpt-4o-mini",
      "temperature": 0.7
    }
  }'`}
                          </pre>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">API Documentation</h4>
                      <p className="text-sm text-blue-700 mb-3">
                        For complete API documentation, authentication, and examples, visit our developer portal.
                      </p>
                      <Button variant="outline" size="sm">
                        <Code className="h-4 w-4 mr-2" />
                        View API Docs
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Deployment Settings
                    </CardTitle>
                    <CardDescription>
                      Configure global deployment settings and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-medium">Default Settings</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Auto-deploy new bots</span>
                            <input type="checkbox" className="rounded" />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Enable analytics by default</span>
                            <input type="checkbox" className="rounded" defaultChecked />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Send deployment notifications</span>
                            <input type="checkbox" className="rounded" defaultChecked />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium">Security</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Require HTTPS for widgets</span>
                            <input type="checkbox" className="rounded" defaultChecked />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Enable rate limiting</span>
                            <input type="checkbox" className="rounded" defaultChecked />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Log all API requests</span>
                            <input type="checkbox" className="rounded" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <Button>
                        <Settings className="h-4 w-4 mr-2" />
                        Save Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      <DeploymentSettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        bot={selectedBot}
        onSave={handleSaveSettings}
      />
    </div>
  )
}
