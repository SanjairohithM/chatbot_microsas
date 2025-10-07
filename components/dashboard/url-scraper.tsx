'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, Trash2, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

interface ScrapedResult {
  url: string;
  title?: string;
  success: boolean;
  error?: string;
}

interface ScrapedUrl {
  url: string;
  title: string;
  description: string;
  scrapedAt: string;
  contentLength: number;
  status: 'success' | 'error';
  vectorId?: string;
  documentId?: number;
  chunkIndex?: number;
  totalChunks?: number;
}

interface UrlScraperProps {
  botId: number;
  onScrapingComplete?: (results: ScrapedResult[]) => void;
}

export function UrlScraper({ botId, onScrapingComplete }: UrlScraperProps) {
  const [urls, setUrls] = useState<string[]>(['']);
  const [isScraping, setIsScraping] = useState(false);
  const [results, setResults] = useState<ScrapedResult[]>([]);
  const [error, setError] = useState<string>('');
  const [existingUrls, setExistingUrls] = useState<ScrapedUrl[]>([]);
  const [isLoadingExisting, setIsLoadingExisting] = useState(true);

  const addUrl = () => {
    setUrls([...urls, '']);
  };

  const removeUrl = (index: number) => {
    if (urls.length > 1) {
      setUrls(urls.filter((_, i) => i !== index));
    }
  };

  const updateUrl = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const fetchExistingUrls = async () => {
    try {
      setIsLoadingExisting(true);
      const response = await fetch(`/api/scraped-data?botId=${botId}`);
      const data = await response.json();
      
      if (data.success) {
        setExistingUrls(data.data.scrapedUrls || []);
      }
    } catch (error) {
      console.error('Error fetching existing URLs:', error);
    } finally {
      setIsLoadingExisting(false);
    }
  };

  const scrapeUrls = async () => {
    const validUrls = urls.filter(url => url.trim() && isValidUrl(url.trim()));
    
    if (validUrls.length === 0) {
      setError('Please enter at least one valid URL');
      return;
    }

    setIsScraping(true);
    setError('');
    setResults([]);

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          urls: validUrls,
          botId: botId
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResults(data.results);
        onScrapingComplete?.(data.results);
        // Refresh existing URLs after successful scraping
        fetchExistingUrls();
      } else {
        setError(data.error || 'Failed to scrape URLs');
      }
    } catch (error) {
      setError('Failed to scrape URLs: ' + (error as Error).message);
    } finally {
      setIsScraping(false);
    }
  };

  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;

  useEffect(() => {
    fetchExistingUrls();
  }, [botId]);

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>URL Scraper</CardTitle>
        <CardDescription>
          Enter URLs to scrape content and store in your bot's knowledge base
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">URLs to Scrape</label>
          {urls.map((url, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={url}
                onChange={(e) => updateUrl(index, e.target.value)}
                placeholder="https://example.com/page"
                className={url && !isValidUrl(url) ? 'border-red-500' : ''}
              />
              {urls.length > 1 && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => removeUrl(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button variant="outline" onClick={addUrl} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add URL
          </Button>
        </div>

        <Button 
          onClick={scrapeUrls} 
          disabled={isScraping || urls.every(url => !url.trim())}
          className="w-full"
        >
          {isScraping ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Scraping URLs...
            </>
          ) : (
            'Scrape URLs'
          )}
        </Button>

        {/* Existing Scraped URLs */}
        {!isLoadingExisting && existingUrls.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700">
              Already Scraped URLs ({existingUrls.length})
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3 bg-gray-50">
              {existingUrls.map((url, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-white rounded border"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium truncate">
                        {url.title}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{url.url}</p>
                    {url.vectorId && (
                      <p className="text-xs text-blue-600 font-mono">{url.vectorId}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(url.url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">
              New Scraping Results ({successCount}/{totalCount} successful)
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm font-medium truncate">
                        {result.title || result.url}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{result.url}</p>
                    {result.error && (
                      <p className="text-xs text-red-500">{result.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
