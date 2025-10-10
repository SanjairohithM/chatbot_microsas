"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { Key, Eye, EyeOff, Settings, Save } from "lucide-react"
import { toast } from "@/hooks/use-toast"


export default function ApiKeysPage() {
  const [openaiApiKey, setOpenaiApiKey] = useState("")
  const [showOpenaiKey, setShowOpenaiKey] = useState(false)
  const [isSavingOpenaiKey, setIsSavingOpenaiKey] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth")
      return
    }

    if (user) {
      loadOpenaiApiKey()
    }
  }, [user, authLoading, router])


  const loadOpenaiApiKey = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/user/openai-key')
      if (response.ok) {
        const result = await response.json()
        setOpenaiApiKey(result.data?.openai_api_key || "")
      }
    } catch (error) {
      console.error('Error loading OpenAI API key:', error)
      toast({
        title: "Error",
        description: "Failed to load OpenAI API key",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveOpenaiKey = async () => {
    try {
      setIsSavingOpenaiKey(true)
      const response = await fetch('/api/user/openai-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ openai_api_key: openaiApiKey }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save OpenAI API key')
      }

      toast({
        title: "Success",
        description: "OpenAI API key saved successfully",
      })
    } catch (error) {
      console.error('Error saving OpenAI API key:', error)
      toast({
        title: "Error",
        description: "Failed to save OpenAI API key",
        variant: "destructive"
      })
    } finally {
      setIsSavingOpenaiKey(false)
    }
  }


  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="flex justify-center items-center p-6 mx-auto mb-6 w-20 h-20 bg-blue-100 rounded-3xl">
            <div className="w-8 h-8 rounded-full border-2 border-blue-500 animate-spin border-t-transparent"></div>
          </div>
          <p className="text-lg text-gray-600">Loading API keys...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div>
        {/* Top Header Bar */}
        <div className="px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex gap-4 items-center">
            <div className="flex gap-3 items-center">
              <div className="flex justify-center items-center w-8 h-8 bg-blue-600 rounded-lg">
                <Key className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
            </div>
          </div>
        </div>

        <div className="overflow-hidden p-6 max-w-full">
          {/* Main Content Header */}
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold text-gray-900">OpenAI API Key</h1>
            <p className="text-lg text-gray-600">Configure your OpenAI API key to power your bots</p>
          </div>

          {/* OpenAI API Key Section */}
          <div className="max-w-2xl">
            <Card className="border-blue-200 bg-blue-50/30">
              <CardHeader className="pb-4">
                <div className="flex gap-3 items-center">
                  <div className="flex justify-center items-center w-10 h-10 bg-blue-100 rounded-lg">
                    <Settings className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      OpenAI API Key
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      Your OpenAI API key for powering the AI model in your bots
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">OpenAI API Key</label>
                  <div className="flex gap-2 items-center">
                    <div className="relative flex-1">
                      <Input
                        type={showOpenaiKey ? "text" : "password"}
                        placeholder="sk-..."
                        value={openaiApiKey}
                        onChange={(e) => setOpenaiApiKey(e.target.value)}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                        className="absolute right-2 top-1/2 p-0 w-6 h-6 transform -translate-y-1/2"
                      >
                        {showOpenaiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    <Button
                      onClick={handleSaveOpenaiKey}
                      disabled={isSavingOpenaiKey || !openaiApiKey.trim()}
                      className="text-white bg-blue-600 hover:bg-blue-700"
                    >
                      {isSavingOpenaiKey ? (
                        <>
                          <div className="mr-2 w-4 h-4 rounded-full border-2 border-white animate-spin border-t-transparent"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 w-4 h-4" />
                          Save
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600">
                    This key will be used to power the AI model for all your bots. Keep it secure.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
  )
}
