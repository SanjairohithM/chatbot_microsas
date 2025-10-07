'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Settings, RefreshCw, ExternalLink } from 'lucide-react'
import { WordPressSyncDialog } from './wordpress-sync-dialog'

interface WordPressSyncCardProps {
  bot: {
    id: number
    name: string
  }
  syncStatus?: {
    sync_enabled: boolean
    last_sync?: string
    wordpress_url?: string
  }
}

export function WordPressSyncCard({ bot, syncStatus }: WordPressSyncCardProps) {
  const [showDialog, setShowDialog] = useState(false)

  const getStatusBadge = () => {
    if (!syncStatus) return <Badge variant="secondary">Unknown</Badge>
    if (syncStatus.sync_enabled) {
      return <Badge variant="default" className="bg-green-500">Enabled</Badge>
    }
    return <Badge variant="secondary">Disabled</Badge>
  }

  const getLastSyncText = () => {
    if (!syncStatus?.last_sync) return 'Never'
    const date = new Date(syncStatus.last_sync)
    return date.toLocaleString()
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            WordPress Sync
            {getStatusBadge()}
          </CardTitle>
          <CardDescription>
            Automatically sync content from your WordPress site
          </CardDescription>
        </CardHeader>
        <CardContent>
          {syncStatus?.sync_enabled ? (
            <div className="space-y-2">
              <p><strong>WordPress URL:</strong> {syncStatus.wordpress_url}</p>
              <p><strong>Last Sync:</strong> {getLastSyncText()}</p>
              <div className="flex gap-2 mt-4">
                <Button size="sm" onClick={() => setShowDialog(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Configure
                </Button>
                <Button size="sm" variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Now
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">WordPress sync is not enabled for this bot.</p>
              <Button onClick={() => setShowDialog(true)}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Enable WordPress Sync
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <WordPressSyncDialog
        bot={bot}
        open={showDialog}
        onOpenChange={setShowDialog}
      />
    </>
  )
}
