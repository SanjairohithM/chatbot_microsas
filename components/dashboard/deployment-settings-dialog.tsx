"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Globe, Shield, Zap, Code } from "lucide-react"
import type { Bot } from "@/lib/types"

interface DeploymentSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bot: Bot | null
  onSave: (botId: number, settings: any) => void
}

export function DeploymentSettingsDialog({ open, onOpenChange, bot, onSave }: DeploymentSettingsDialogProps) {
  const [settings, setSettings] = useState({
    domain: bot?.deployment_url?.replace("https://", "").replace("http://", "") || "",
    customDomain: "",
    enableCors: true,
    enableRateLimit: true,
    rateLimitRequests: 100,
    rateLimitWindow: 60,
    enableAuth: false,
    authType: "api-key",
    apiKey: "",
    webhookUrl: "",
    enableWebhook: false,
    customCss: "",
    welcomeMessage: "Hello! How can I help you today?",
    placeholder: "Type your message...",
    theme: "light",
    primaryColor: "#8b5cf6",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (bot) {
      onSave(bot.id, settings)
      onOpenChange(false)
    }
  }

  if (!bot) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Deployment Settings - {bot.name}</DialogTitle>
          <DialogDescription>Configure how your bot is deployed and accessed by users.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="customization" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Customization
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Domain Settings</CardTitle>
                  <CardDescription>Configure where your bot will be accessible</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="domain">Current Domain</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">https://</span>
                      <Input
                        id="domain"
                        value={settings.domain}
                        onChange={(e) => setSettings({ ...settings, domain: e.target.value })}
                        placeholder="your-bot.example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customDomain">Custom Domain (Optional)</Label>
                    <Input
                      id="customDomain"
                      value={settings.customDomain}
                      onChange={(e) => setSettings({ ...settings, customDomain: e.target.value })}
                      placeholder="chat.yourdomain.com"
                    />
                    <p className="text-xs text-muted-foreground">Use your own domain. Requires DNS configuration.</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Webhook Integration</CardTitle>
                  <CardDescription>Send conversation data to external systems</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="enableWebhook">Enable Webhooks</Label>
                      <p className="text-sm text-muted-foreground">Send events to external URLs</p>
                    </div>
                    <Switch
                      id="enableWebhook"
                      checked={settings.enableWebhook}
                      onCheckedChange={(checked) => setSettings({ ...settings, enableWebhook: checked })}
                    />
                  </div>

                  {settings.enableWebhook && (
                    <div className="space-y-2">
                      <Label htmlFor="webhookUrl">Webhook URL</Label>
                      <Input
                        id="webhookUrl"
                        value={settings.webhookUrl}
                        onChange={(e) => setSettings({ ...settings, webhookUrl: e.target.value })}
                        placeholder="https://your-api.com/webhook"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Access Control</CardTitle>
                  <CardDescription>Control who can access your bot</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="enableAuth">Require Authentication</Label>
                      <p className="text-sm text-muted-foreground">Users must authenticate to use the bot</p>
                    </div>
                    <Switch
                      id="enableAuth"
                      checked={settings.enableAuth}
                      onCheckedChange={(checked) => setSettings({ ...settings, enableAuth: checked })}
                    />
                  </div>

                  {settings.enableAuth && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="authType">Authentication Type</Label>
                        <Select
                          value={settings.authType}
                          onValueChange={(value) => setSettings({ ...settings, authType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="api-key">API Key</SelectItem>
                            <SelectItem value="oauth">OAuth</SelectItem>
                            <SelectItem value="jwt">JWT Token</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="apiKey">API Key</Label>
                        <Input
                          id="apiKey"
                          type="password"
                          value={settings.apiKey}
                          onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                          placeholder="Enter API key"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">CORS Settings</CardTitle>
                  <CardDescription>Configure cross-origin resource sharing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="enableCors">Enable CORS</Label>
                      <p className="text-sm text-muted-foreground">Allow cross-origin requests</p>
                    </div>
                    <Switch
                      id="enableCors"
                      checked={settings.enableCors}
                      onCheckedChange={(checked) => setSettings({ ...settings, enableCors: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Rate Limiting</CardTitle>
                  <CardDescription>Prevent abuse and manage resource usage</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="enableRateLimit">Enable Rate Limiting</Label>
                      <p className="text-sm text-muted-foreground">Limit requests per user</p>
                    </div>
                    <Switch
                      id="enableRateLimit"
                      checked={settings.enableRateLimit}
                      onCheckedChange={(checked) => setSettings({ ...settings, enableRateLimit: checked })}
                    />
                  </div>

                  {settings.enableRateLimit && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="rateLimitRequests">Max Requests</Label>
                        <Input
                          id="rateLimitRequests"
                          type="number"
                          value={settings.rateLimitRequests}
                          onChange={(e) =>
                            setSettings({ ...settings, rateLimitRequests: Number.parseInt(e.target.value) })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rateLimitWindow">Time Window (seconds)</Label>
                        <Input
                          id="rateLimitWindow"
                          type="number"
                          value={settings.rateLimitWindow}
                          onChange={(e) =>
                            setSettings({ ...settings, rateLimitWindow: Number.parseInt(e.target.value) })
                          }
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance Metrics</CardTitle>
                  <CardDescription>Current deployment performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-green-600">99.9%</div>
                      <div className="text-sm text-muted-foreground">Uptime</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">245ms</div>
                      <div className="text-sm text-muted-foreground">Avg Response</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="customization" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Chat Interface</CardTitle>
                  <CardDescription>Customize the chat widget appearance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="theme">Theme</Label>
                      <Select
                        value={settings.theme}
                        onValueChange={(value) => setSettings({ ...settings, theme: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="auto">Auto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="primaryColor">Primary Color</Label>
                      <Input
                        id="primaryColor"
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="welcomeMessage">Welcome Message</Label>
                    <Input
                      id="welcomeMessage"
                      value={settings.welcomeMessage}
                      onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="placeholder">Input Placeholder</Label>
                    <Input
                      id="placeholder"
                      value={settings.placeholder}
                      onChange={(e) => setSettings({ ...settings, placeholder: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Custom CSS</CardTitle>
                  <CardDescription>Add custom styles to your chat widget</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="customCss">CSS Code</Label>
                    <Textarea
                      id="customCss"
                      value={settings.customCss}
                      onChange={(e) => setSettings({ ...settings, customCss: e.target.value })}
                      placeholder="/* Add your custom CSS here */"
                      rows={6}
                      className="font-mono text-sm"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Settings</Button>
            </DialogFooter>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
