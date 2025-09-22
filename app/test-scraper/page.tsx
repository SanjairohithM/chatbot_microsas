"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Globe, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface ScrapeResult {
  success: boolean
  url: string
  contentType: string
  extractedContent: {
    title: string
    description: string
    headingsCount: number
    paragraphsCount: number
    servicesCount: number
    contactInfoCount: number
    faqCount: number
    linksCount: number
  }
  sampleContent: {
    headings: string[]
    services: string[]
    contactInfo: string[]
    paragraphs: string[]
  }
  fullContent: string
  error?: string
}

export default function TestScraperPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<ScrapeResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const testScraping = async () => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/test-scrape')
      const data = await response.json()

      if (data.success) {
        setResult(data)
      } else {
        setError(data.error || 'Failed to scrape website')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Website Scraper Test</h1>
          <p className="text-muted-foreground">
            Test the website scraping functionality with your live website
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Test Website Scraping
            </CardTitle>
            <CardDescription>
              Click the button below to test scraping https://mysite.makeyoueasy.com/
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testScraping} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scraping Website...
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4 mr-2" />
                  Test Scraping
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                Scraping Failed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {result && (
          <div className="space-y-6">
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  Scraping Successful
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>URL:</strong> {result.url}</p>
                  <p><strong>Content Type:</strong> 
                    <Badge variant="outline" className="ml-2">{result.contentType}</Badge>
                  </p>
                  <p><strong>Title:</strong> {result.extractedContent.title || 'No title found'}</p>
                  <p><strong>Description:</strong> {result.extractedContent.description || 'No description found'}</p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Content Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Headings:</span>
                    <Badge variant="outline">{result.extractedContent.headingsCount}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Paragraphs:</span>
                    <Badge variant="outline">{result.extractedContent.paragraphsCount}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Services:</span>
                    <Badge variant="outline">{result.extractedContent.servicesCount}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Contact Info:</span>
                    <Badge variant="outline">{result.extractedContent.contactInfoCount}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>FAQ Items:</span>
                    <Badge variant="outline">{result.extractedContent.faqCount}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Links:</span>
                    <Badge variant="outline">{result.extractedContent.linksCount}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sample Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.sampleContent.headings.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Headings:</h4>
                      <ul className="text-sm space-y-1">
                        {result.sampleContent.headings.map((heading, index) => (
                          <li key={index} className="text-muted-foreground">• {heading}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.sampleContent.services.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Services:</h4>
                      <ul className="text-sm space-y-1">
                        {result.sampleContent.services.map((service, index) => (
                          <li key={index} className="text-muted-foreground">• {service}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.sampleContent.contactInfo.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Contact Info:</h4>
                      <ul className="text-sm space-y-1">
                        {result.sampleContent.contactInfo.map((contact, index) => (
                          <li key={index} className="text-muted-foreground">• {contact}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Full Extracted Content</CardTitle>
                <CardDescription>
                  This is the complete content that will be used for your chatbot's knowledge base
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96 w-full rounded border p-4">
                  <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {result.fullContent}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
