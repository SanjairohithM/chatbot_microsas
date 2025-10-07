'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle, RefreshCw, ExternalLink } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface WordPressSyncDialogProps {
  bot: {
    id: number
    name: string
  }
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface WordPressSyncStatus {
  sync_enabled: boolean
  wordpress_url?: string
  sync_frequency?: string
  last_sync?: string
  include_posts?: boolean
  include_pages?: boolean
  include_categories?: boolean
  include_tags?: boolean
  include_media?: boolean
}

export function WordPressSyncDialog({ bot, open, onOpenChange }: WordPressSyncDialogProps) {
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [status, setStatus] = useState<WordPressSyncStatus | null>(null)
  const [formData, setFormData] = useState({
    wordpress_url: '',
    sync_frequency: 'daily',
    include_posts: true,
    include_pages: true,
    include_categories: true,
    include_tags: true,
    include_media: false
  })

  useEffect(() => {
    if (open) {
      fetchSyncStatus()
    }
  }, [open, bot.id])

  const fetchSyncStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/bots/${bot.id}/auto-credentials`)
      const data = await response.json()
      
      if (data.success) {
        setStatus(data.data)
        if (data.data.sync_enabled) {
          setFormData({
            wordpress_url: data.data.wordpress_url || '',
            sync_frequency: data.data.sync_frequency || 'daily',
            include_posts: data.data.include_posts || false,
            include_pages: data.data.include_pages || false,
            include_categories: data.data.include_categories || false,
            include_tags: data.data.include_tags || false,
            include_media: data.data.include_media || false
          })
        }
      }
    } catch (error) {
      console.error('Error fetching sync status:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch WordPress sync status',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEnableSync = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/bots/${bot.id}/auto-credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      
      if (data.success) {
        toast({
          title: 'Success',
          description: 'WordPress sync enabled successfully!'
        })
        setStatus({
          sync_enabled: true,
          wordpress_url: formData.wordpress_url,
          sync_frequency: formData.sync_frequency,
          last_sync: new Date().toISOString(),
          include_posts: formData.include_posts,
          include_pages: formData.include_pages,
          include_categories: formData.include_categories,
          include_tags: formData.include_tags,
          include_media: formData.include_media
        })
      } else {
        throw new Error(data.message || 'Failed to enable sync')
      }
    } catch (error) {
      console.error('Error enabling sync:', error)
      toast({
        title: 'Error',
        description: 'Failed to enable WordPress sync',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDisableSync = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/bots/${bot.id}/auto-credentials`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      if (data.success) {
        toast({
          title: 'Success',
          description: 'WordPress sync disabled successfully!'
        })
        setStatus({ sync_enabled: false })
      } else {
        throw new Error(data.message || 'Failed to disable sync')
      }
    } catch (error) {
      console.error('Error disabling sync:', error)
      toast({
        title: 'Error',
        description: 'Failed to disable WordPress sync',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSyncNow = async () => {
    try {
      setSyncing(true)
      const response = await fetch('/api/sync/wordpress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bot_id: bot.id, force_sync: true })
      })

      const data = await response.json()
      
      if (data.success) {
        toast({
          title: 'Success',
          description: 'WordPress sync completed successfully!'
        })
        fetchSyncStatus() // Refresh status
      } else {
        throw new Error(data.message || 'Failed to sync')
      }
    } catch (error) {
      console.error('Error syncing:', error)
      toast({
        title: 'Error',
        description: 'Failed to sync WordPress data',
        variant: 'destructive'
      })
    } finally {
      setSyncing(false)
    }
  }

  const getStatusBadge = () => {
    if (!status) return <Badge variant="secondary">Loading...</Badge>
    if (status.sync_enabled) {
      return <Badge variant="default" className="bg-green-500">Enabled</Badge>
    }
    return <Badge variant="secondary">Disabled</Badge>
  }

  const getLastSyncText = () => {
    if (!status?.last_sync) return 'Never'
    const date = new Date(status.last_sync)
    return date.toLocaleString()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">WordPress Sync</h2>
              <p className="text-gray-600">Configure automatic WordPress data sync for {bot.name}</p>
            </div>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              <XCircle className="h-6 w-6" />
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Status Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Sync Status
                    {getStatusBadge()}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {status?.sync_enabled ? (
                    <div className="space-y-2">
                      <p><strong>WordPress URL:</strong> {status.wordpress_url}</p>
                      <p><strong>Sync Frequency:</strong> {status.sync_frequency}</p>
                      <p><strong>Last Sync:</strong> {getLastSyncText()}</p>
                      <div className="flex gap-2 mt-4">
                        <Button onClick={handleSyncNow} disabled={syncing}>
                          {syncing ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                          )}
                          Sync Now
                        </Button>
                        <Button variant="outline" onClick={handleDisableSync} disabled={loading}>
                          Disable Sync
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-600">WordPress sync is not enabled for this bot.</p>
                  )}
                </CardContent>
              </Card>

              {/* Configuration Form */}
              {!status?.sync_enabled && (
                <Card>
                  <CardHeader>
                    <CardTitle>Enable WordPress Sync</CardTitle>
                    <CardDescription>
                      Configure automatic data sync from your WordPress site
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="wordpress_url">WordPress URL</Label>
                      <Input
                        id="wordpress_url"
                        type="url"
                        placeholder="https://your-wordpress-site.com"
                        value={formData.wordpress_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, wordpress_url: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="sync_frequency">Sync Frequency</Label>
                      <Select
                        value={formData.sync_frequency}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, sync_frequency: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label>Content to Sync</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="include_posts"
                            checked={formData.include_posts}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, include_posts: checked }))}
                          />
                          <Label htmlFor="include_posts">Posts</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="include_pages"
                            checked={formData.include_pages}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, include_pages: checked }))}
                          />
                          <Label htmlFor="include_pages">Pages</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="include_categories"
                            checked={formData.include_categories}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, include_categories: checked }))}
                          />
                          <Label htmlFor="include_categories">Categories</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="include_tags"
                            checked={formData.include_tags}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, include_tags: checked }))}
                          />
                          <Label htmlFor="include_tags">Tags</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="include_media"
                            checked={formData.include_media}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, include_media: checked }))}
                          />
                          <Label htmlFor="include_media">Media</Label>
                        </div>
                      </div>
                    </div>

                    <Alert>
                      <AlertDescription>
                        This will automatically generate API keys and configure your WordPress site for data sync.
                        Make sure to install the OmniX Chatbot plugin on your WordPress site.
                      </AlertDescription>
                    </Alert>

                    <Button onClick={handleEnableSync} disabled={loading || !formData.wordpress_url}>
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Enable WordPress Sync
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Plugin Installation Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle>WordPress Plugin Installation</CardTitle>
                  <CardDescription>
                    Follow these steps to install the OmniX Chatbot plugin on your WordPress site
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p><strong>Step 1:</strong> Download the OmniX Chatbot plugin</p>
                    <p><strong>Step 2:</strong> Upload and activate the plugin in your WordPress admin</p>
                    <p><strong>Step 3:</strong> Go to OmniX Chatbot settings and configure the API credentials</p>
                    <p><strong>Step 4:</strong> The plugin will automatically start syncing data</p>
                  </div>
                  
                  <Button variant="outline" className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Download Plugin
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
