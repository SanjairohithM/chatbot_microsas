"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, Globe, Code, Settings, Copy, ExternalLink } from "lucide-react"
import type { Bot as BotType } from "@/lib/types"

interface StepFourProps {
  formData: Partial<BotType>
  onChange: (data: Partial<BotType>) => void
}

export function StepFour({ formData, onChange }: StepFourProps) {
  const [localData, setLocalData] = useState({
    status: (formData as any).status || 'inactive',
    enable_widget: (formData as any).enable_widget || true,
    enable_api: (formData as any).enable_api || true,
    widget_theme: (formData as any).widget_theme || 'light',
    widget_position: (formData as any).widget_position || 'bottom-right',
    api_rate_limit: (formData as any).api_rate_limit || 100,
  })

  const handleChange = (field: string, value: any) => {
    const newData = { ...localData, [field]: value }
    setLocalData(newData)
    onChange(newData)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }

  const generateEmbedCode = () => {
    const botId = 'YOUR_BOT_ID' // This would be replaced with actual bot ID after creation
    return `<!-- OmniX Chatbot Widget -->
<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${window.location.origin}/chatbot-widget.js';
    script.setAttribute('data-bot-id', '${botId}');
    script.setAttribute('data-theme', '${localData.widget_theme}');
    script.setAttribute('data-position', '${localData.widget_position}');
    document.head.appendChild(script);
  })();
</script>`
  }

  const generateApiExample = () => {
    return `// Example API usage
const response = await fetch('${window.location.origin}/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    bot_id: 'YOUR_BOT_ID',
    message: 'Hello, how can you help me?',
    user_id: 'user123'
  })
});

const data = await response.json();
console.log(data.response);`
  }

  return (
    <div className="space-y-6">
      {/* Deployment Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex gap-2 items-center">
            <CheckCircle className="w-5 h-5" />
            Deployment Status
          </CardTitle>
          <CardDescription>
            Choose when your chatbot should go live
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <Label>Deploy Immediately</Label>
              <p className="text-sm text-gray-500">Make your chatbot available right after creation</p>
            </div>
            <Switch
              checked={localData.status === 'active'}
              onCheckedChange={(checked) => handleChange('status', checked ? 'active' : 'inactive')}
            />
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              {localData.status === 'active' 
                ? '✅ Your chatbot will be live immediately after creation'
                : '⏸️ Your chatbot will be created but remain inactive until you enable it'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Widget Deployment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex gap-2 items-center">
            <Globe className="w-5 h-5" />
            Website Widget
          </CardTitle>
          <CardDescription>
            Embed your chatbot as a widget on your website
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <Label>Enable Website Widget</Label>
              <p className="text-sm text-gray-500">Allow embedding as a chat widget</p>
            </div>
            <Switch
              checked={localData.enable_widget}
              onCheckedChange={(checked) => handleChange('enable_widget', checked)}
            />
          </div>

          {localData.enable_widget && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Widget Theme</Label>
                  <select
                    value={localData.widget_theme}
                    onChange={(e) => handleChange('widget_theme', e.target.value)}
                    className="p-2 w-full rounded-lg border"
                  >
                    <option value="light">Light Theme</option>
                    <option value="dark">Dark Theme</option>
                    <option value="auto">Auto (System)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Widget Position</Label>
                  <select
                    value={localData.widget_position}
                    onChange={(e) => handleChange('widget_position', e.target.value)}
                    className="p-2 w-full rounded-lg border"
                  >
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="top-left">Top Left</option>
                  </select>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Embed Code</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(generateEmbedCode())}
                  >
                    <Copy className="mr-2 w-4 h-4" />
                    Copy Code
                  </Button>
                </div>
                <div className="overflow-x-auto p-4 font-mono text-sm bg-gray-100 rounded-lg">
                  <pre>{generateEmbedCode()}</pre>
                </div>
                <p className="text-xs text-gray-500">
                  Add this code to your website's HTML before the closing &lt;/body&gt; tag
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex gap-2 items-center">
            <Code className="w-5 h-5" />
            API Integration
          </CardTitle>
          <CardDescription>
            Use your chatbot via REST API for custom integrations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <Label>Enable API Access</Label>
              <p className="text-sm text-gray-500">Allow programmatic access via REST API</p>
            </div>
            <Switch
              checked={localData.enable_api}
              onCheckedChange={(checked) => handleChange('enable_api', checked)}
            />
          </div>

          {localData.enable_api && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Rate Limit (requests per hour)</Label>
                <Input
                  type="number"
                  value={localData.api_rate_limit}
                  onChange={(e) => handleChange('api_rate_limit', parseInt(e.target.value))}
                  className="w-32"
                />
                <p className="text-xs text-gray-500">
                  Maximum number of API requests per hour per API key
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>API Example</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(generateApiExample())}
                  >
                    <Copy className="mr-2 w-4 h-4" />
                    Copy Code
                  </Button>
                </div>
                <div className="overflow-x-auto p-4 font-mono text-sm bg-gray-100 rounded-lg">
                  <pre>{generateApiExample()}</pre>
                </div>
                <p className="text-xs text-gray-500">
                  Use this example to integrate with your application
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex gap-2 items-center">
            <Settings className="w-5 h-5" />
            Deployment Summary
          </CardTitle>
          <CardDescription>
            Review your chatbot configuration before creation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900">Basic Info</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Name:</strong> {formData.name || 'Not set'}</p>
                  <p><strong>Category:</strong> {formData.category || 'General'}</p>
                  <p><strong>Status:</strong> 
                    <Badge variant={localData.status === 'active' ? 'default' : 'secondary'} className="ml-2">
                      {localData.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900">Features</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Personality:</strong> {(formData as any).personality || 'Professional'}</p>
                  <p><strong>Voice Chat:</strong> {(formData as any).enable_voice ? 'Enabled' : 'Disabled'}</p>
                  <p><strong>File Upload:</strong> {(formData as any).enable_file_upload ? 'Enabled' : 'Disabled'}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900">Deployment</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Website Widget:</strong> {localData.enable_widget ? 'Enabled' : 'Disabled'}</p>
                  <p><strong>API Access:</strong> {localData.enable_api ? 'Enabled' : 'Disabled'}</p>
                  {localData.enable_api && (
                    <p><strong>Rate Limit:</strong> {localData.api_rate_limit} req/hour</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900">Knowledge Base</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Documents:</strong> {(formData as any).documents?.length || 0} files</p>
                  <p><strong>Website Content:</strong> {((formData as any).website_content || '').length > 0 ? 'Added' : 'None'}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex gap-2 items-center mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900">Ready to Create</span>
              </div>
              <p className="text-sm text-green-800">
                Your chatbot is configured and ready to be created. Click "Create Bot" to finalize the setup.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
