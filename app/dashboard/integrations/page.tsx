"use client"

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  Globe, 
  MoreHorizontal, 
  ExternalLink, 
  Trash2, 
  Settings, 
  RefreshCw,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { WordPressSite } from '@/lib/types'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'

export default function IntegrationsPage() {
  const [sites, setSites] = useState<WordPressSite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth")
      return
    }
    
    if (user) {
      fetchSites()
    }
  }, [user, authLoading, router])

  const fetchSites = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/wordpress-sites')
      const data = await response.json()
      
      if (data.success) {
        setSites(data.data)
      } else {
        setError(data.message || 'Failed to fetch sites')
      }
    } catch (err) {
      setError('Failed to fetch sites')
      console.error('Error fetching sites:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSite = async (siteId: string) => {
    if (!confirm('Are you sure you want to delete this site integration?')) {
      return
    }

    try {
      const response = await fetch(`/api/wordpress-sites?id=${siteId}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      
      if (data.success) {
        setSites(sites.filter(site => site.id !== siteId))
      } else {
        alert(data.message || 'Failed to delete site')
      }
    } catch (err) {
      alert('Failed to delete site')
      console.error('Error deleting site:', err)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (site: WordPressSite) => {
    if (!site.is_active) {
      return <Badge variant="destructive">Inactive</Badge>
    }
    
    if (site.last_sync) {
      const lastSync = new Date(site.last_sync)
      const now = new Date()
      const diffHours = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60)
      
      if (diffHours < 24) {
        return <Badge variant="default" className="bg-green-100 text-green-800">Synced</Badge>
      } else if (diffHours < 168) { // 7 days
        return <Badge variant="secondary">Stale</Badge>
      } else {
        return <Badge variant="destructive">Outdated</Badge>
      }
    }
    
    return <Badge variant="secondary">Never Synced</Badge>
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading integrations...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchSites} className="mt-2">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sites</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sites.length}</div>
            <p className="text-xs text-muted-foreground">
              WordPress sites connected
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sites</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sites.filter(site => site.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently active integrations
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bots</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sites.reduce((total, site) => total + (site.bots?.length || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Bots across all sites
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sites Table */}
      <Card>
        <CardHeader>
          <CardTitle>WordPress Sites</CardTitle>
          <CardDescription>
            Manage your integrated WordPress sites and their associated bots
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sites.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No integrations yet</h3>
              <p className="text-gray-600 mb-4">
                Connect your WordPress sites to start managing them from here
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Integration
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Site Name</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>WordPress Version</TableHead>
                  <TableHead>Last Sync</TableHead>
                  {/* <TableHead>Bots</TableHead> */}
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sites.map((site) => (
                  <TableRow key={site.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4 text-gray-500" />
                        <span>{site.site_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <a 
                        href={site.site_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                      >
                        <span>{site.site_url}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(site)}
                    </TableCell>
                    <TableCell>
                      {site.wordpress_version || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {site.last_sync ? (
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3 text-gray-500" />
                          <span className="text-sm">
                            {formatDate(site.last_sync)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">Never</span>
                      )}
                    </TableCell>
                    {/* <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {site.bots?.map((bot) => (
                          <Badge 
                            key={bot.id} 
                            variant={bot.is_deployed ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {bot.name}
                          </Badge>
                        )) || <span className="text-gray-500 text-sm">No bots</span>}
                      </div>
                    </TableCell> */}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Settings className="h-4 w-4 mr-2" />
                            Configure
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Sync Now
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDeleteSite(site.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  )
}