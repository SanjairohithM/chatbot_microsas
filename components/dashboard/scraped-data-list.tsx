'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Globe, ExternalLink, RefreshCw, CheckCircle, Clock, FileText } from 'lucide-react';

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

interface ScrapedDataResponse {
  totalUrls: number;
  scrapedUrls: ScrapedUrl[];
  lastUpdated: string;
}

interface ScrapedDataListProps {
  botId: number;
  onRefresh?: () => void;
}

export function ScrapedDataList({ botId, onRefresh }: ScrapedDataListProps) {
  const [scrapedData, setScrapedData] = useState<ScrapedDataResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchScrapedData = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await fetch(`/api/scraped-data?botId=${botId}`);
      const data = await response.json();
      
      if (data.success) {
        setScrapedData(data.data);
      } else {
        setError(data.error || 'Failed to fetch scraped data');
      }
    } catch (error) {
      setError('Failed to fetch scraped data: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchScrapedData();
  }, [botId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatContentLength = (length: number) => {
    if (length < 1000) return `${length} chars`;
    return `${(length / 1000).toFixed(1)}k chars`;
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Scraped URLs
          </CardTitle>
          <CardDescription>
            Loading scraped data...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading scraped URLs...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Scraped URLs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchScrapedData} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Scraped URLs
            </CardTitle>
            <CardDescription>
              {scrapedData?.totalUrls || 0} URLs scraped and stored in knowledge base
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {scrapedData?.lastUpdated ? formatDate(scrapedData.lastUpdated) : 'Never'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchScrapedData}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!scrapedData || scrapedData.scrapedUrls.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No URLs scraped yet</p>
            <p className="text-sm">Use the "Scrape URLs" button to add content to your bot's knowledge base</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {scrapedData.scrapedUrls.map((url, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0 mt-1">
                  {url.status === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Clock className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {url.title || 'Untitled'}
                      </h4>
                      <p className="text-sm text-gray-600 truncate">
                        {url.url}
                      </p>
                      {url.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {url.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="outline" className="text-xs">
                        <FileText className="h-3 w-3 mr-1" />
                        {formatContentLength(url.contentLength)}
                      </Badge>
                      {url.vectorId && (
                        <Badge variant="secondary" className="text-xs font-mono">
                          {url.vectorId}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(url.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>Scraped {formatDate(url.scrapedAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
