# OmniX Chatbot API - Integration Guide

This guide helps developers integrate the OmniX Chatbot API with their applications.

## Quick Start

### 1. Install Plugin
```bash
# Upload to WordPress plugins directory
wp-content/plugins/omnix-chatbot-api/
```

### 2. Get API Credentials
1. Go to WordPress Admin → Settings → OmniX Chatbot API
2. Copy the generated Access Token
3. Note your WordPress site URL

### 3. Test Connection
```bash
curl -X GET "https://your-site.com/wp-json/omnix-chatbot/v1/info" \
  -H "Authorization: Bearer ox_your_access_token_here"
```

## API Reference

### Base URL
```
https://your-wordpress-site.com/wp-json/omnix-chatbot/v1/
```

### Authentication
All requests require a Bearer token:
```
Authorization: Bearer ox_your_access_token_here
```

### Rate Limits
- 100 requests per hour per token
- Rate limit resets every hour
- 429 status code when limit exceeded

## Endpoints

### 1. Site Information
```http
GET /info
```

**Response:**
```json
{
  "site": {
    "name": "My WordPress Site",
    "description": "Site description",
    "url": "https://example.com",
    "version": "6.4",
    "language": "en_US"
  },
  "content_stats": {
    "posts": 150,
    "pages": 25,
    "categories": 12,
    "tags": 45
  }
}
```

### 2. Search Content
```http
POST /search
Content-Type: application/json

{
  "query": "search term",
  "post_types": ["post", "page"],
  "limit": 10,
  "include_meta": false
}
```

**Response:**
```json
{
  "query": "search term",
  "count": 3,
  "total_found": 3,
  "results": [
    {
      "id": 123,
      "title": "Post Title",
      "content": "Post content...",
      "url": "https://example.com/post",
      "post_type": "post",
      "date": "2024-01-15 10:30:00",
      "author": "Admin",
      "categories": ["Category 1"],
      "tags": ["tag1", "tag2"]
    }
  ]
}
```

### 3. Export Posts
```http
GET /export/posts?limit=100&offset=0&post_type=post&status=publish
```

### 4. Export Pages
```http
GET /export/pages?limit=100&offset=0
```

### 5. Export Categories
```http
GET /export/categories
```

### 6. Export Tags
```http
GET /export/tags
```

### 7. Full Export
```http
POST /export/full
Content-Type: application/json

{
  "include_posts": true,
  "include_pages": true,
  "include_categories": true,
  "include_tags": true,
  "include_media": false,
  "limit": 100
}
```

## Code Examples

### JavaScript/Node.js
```javascript
class OmniXChatbotAPI {
  constructor(baseUrl, accessToken) {
    this.baseUrl = baseUrl;
    this.accessToken = accessToken;
  }

  async request(endpoint, method = 'GET', data = null) {
    const url = `${this.baseUrl}/wp-json/omnix-chatbot/v1/${endpoint}`;
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    return await response.json();
  }

  async search(query, options = {}) {
    return this.request('search', 'POST', {
      query,
      post_types: options.postTypes || ['post'],
      limit: options.limit || 10,
      include_meta: options.includeMeta || false
    });
  }

  async getInfo() {
    return this.request('info');
  }

  async exportPosts(options = {}) {
    const params = new URLSearchParams({
      limit: options.limit || 100,
      offset: options.offset || 0,
      post_type: options.postType || 'post',
      status: options.status || 'publish'
    });
    
    return this.request(`export/posts?${params}`);
  }

  async exportFull(options = {}) {
    return this.request('export/full', 'POST', {
      include_posts: options.includePosts !== false,
      include_pages: options.includePages !== false,
      include_categories: options.includeCategories !== false,
      include_tags: options.includeTags !== false,
      include_media: options.includeMedia || false,
      limit: options.limit || 100
    });
  }
}

// Usage
const api = new OmniXChatbotAPI('https://your-site.com', 'ox_your_token');

// Search for content
const results = await api.search('WordPress tutorials', {
  postTypes: ['post'],
  limit: 5
});

// Get site info
const info = await api.getInfo();

// Export all posts
const posts = await api.exportPosts({ limit: 50 });
```

### PHP
```php
<?php
class OmniXChatbotAPI {
    private $baseUrl;
    private $accessToken;

    public function __construct($baseUrl, $accessToken) {
        $this->baseUrl = rtrim($baseUrl, '/');
        $this->accessToken = $accessToken;
    }

    private function request($endpoint, $method = 'GET', $data = null) {
        $url = $this->baseUrl . '/wp-json/omnix-chatbot/v1/' . $endpoint;
        
        $headers = [
            'Authorization: Bearer ' . $this->accessToken,
            'Content-Type: application/json'
        ];

        $options = [
            'http' => [
                'method' => $method,
                'header' => implode("\r\n", $headers),
                'timeout' => 30
            ]
        ];

        if ($data && in_array($method, ['POST', 'PUT', 'PATCH'])) {
            $options['http']['content'] = json_encode($data);
        }

        $context = stream_context_create($options);
        $result = file_get_contents($url, false, $context);
        
        return json_decode($result, true);
    }

    public function search($query, $options = []) {
        return $this->request('search', 'POST', [
            'query' => $query,
            'post_types' => $options['post_types'] ?? ['post'],
            'limit' => $options['limit'] ?? 10,
            'include_meta' => $options['include_meta'] ?? false
        ]);
    }

    public function getInfo() {
        return $this->request('info');
    }

    public function exportPosts($options = []) {
        $params = http_build_query([
            'limit' => $options['limit'] ?? 100,
            'offset' => $options['offset'] ?? 0,
            'post_type' => $options['post_type'] ?? 'post',
            'status' => $options['status'] ?? 'publish'
        ]);
        
        return $this->request('export/posts?' . $params);
    }

    public function exportFull($options = []) {
        return $this->request('export/full', 'POST', [
            'include_posts' => $options['include_posts'] ?? true,
            'include_pages' => $options['include_pages'] ?? true,
            'include_categories' => $options['include_categories'] ?? true,
            'include_tags' => $options['include_tags'] ?? true,
            'include_media' => $options['include_media'] ?? false,
            'limit' => $options['limit'] ?? 100
        ]);
    }
}

// Usage
$api = new OmniXChatbotAPI('https://your-site.com', 'ox_your_token');

// Search for content
$results = $api->search('WordPress tutorials', [
    'post_types' => ['post'],
    'limit' => 5
]);

// Get site info
$info = $api->getInfo();

// Export all posts
$posts = $api->exportPosts(['limit' => 50]);
?>
```

### Python
```python
import requests
import json

class OmniXChatbotAPI:
    def __init__(self, base_url, access_token):
        self.base_url = base_url.rstrip('/')
        self.access_token = access_token
        self.headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }

    def request(self, endpoint, method='GET', data=None):
        url = f"{self.base_url}/wp-json/omnix-chatbot/v1/{endpoint}"
        
        if method == 'GET':
            response = requests.get(url, headers=self.headers)
        else:
            response = requests.request(method, url, headers=self.headers, json=data)
        
        return response.json()

    def search(self, query, options=None):
        if options is None:
            options = {}
        
        data = {
            'query': query,
            'post_types': options.get('post_types', ['post']),
            'limit': options.get('limit', 10),
            'include_meta': options.get('include_meta', False)
        }
        
        return self.request('search', 'POST', data)

    def get_info(self):
        return self.request('info')

    def export_posts(self, options=None):
        if options is None:
            options = {}
        
        params = {
            'limit': options.get('limit', 100),
            'offset': options.get('offset', 0),
            'post_type': options.get('post_type', 'post'),
            'status': options.get('status', 'publish')
        }
        
        query_string = '&'.join([f"{k}={v}" for k, v in params.items()])
        return self.request(f'export/posts?{query_string}')

    def export_full(self, options=None):
        if options is None:
            options = {}
        
        data = {
            'include_posts': options.get('include_posts', True),
            'include_pages': options.get('include_pages', True),
            'include_categories': options.get('include_categories', True),
            'include_tags': options.get('include_tags', True),
            'include_media': options.get('include_media', False),
            'limit': options.get('limit', 100)
        }
        
        return self.request('export/full', 'POST', data)

# Usage
api = OmniXChatbotAPI('https://your-site.com', 'ox_your_token')

# Search for content
results = api.search('WordPress tutorials', {
    'post_types': ['post'],
    'limit': 5
})

# Get site info
info = api.get_info()

# Export all posts
posts = api.export_posts({'limit': 50})
```

## Error Handling

### Common Error Codes
- `400` - Bad Request (missing parameters)
- `401` - Unauthorized (invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (endpoint doesn't exist)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

### Error Response Format
```json
{
  "code": "error_code",
  "message": "Error description",
  "data": {
    "status": 400
  }
}
```

### Example Error Handling
```javascript
try {
  const results = await api.search('test');
} catch (error) {
  if (error.status === 401) {
    console.error('Invalid access token');
  } else if (error.status === 429) {
    console.error('Rate limit exceeded. Please try again later.');
  } else {
    console.error('API Error:', error.message);
  }
}
```

## Best Practices

### 1. Caching
```javascript
// Cache API responses to reduce requests
const cache = new Map();

async function searchWithCache(query) {
  const cacheKey = `search_${query}`;
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  
  const results = await api.search(query);
  cache.set(cacheKey, results);
  
  // Clear cache after 5 minutes
  setTimeout(() => cache.delete(cacheKey), 5 * 60 * 1000);
  
  return results;
}
```

### 2. Pagination
```javascript
async function getAllPosts() {
  const allPosts = [];
  let offset = 0;
  const limit = 100;
  
  while (true) {
    const response = await api.exportPosts({ limit, offset });
    
    if (response.data.length === 0) {
      break;
    }
    
    allPosts.push(...response.data);
    offset += limit;
  }
  
  return allPosts;
}
```

### 3. Rate Limiting
```javascript
class RateLimitedAPI extends OmniXChatbotAPI {
  constructor(baseUrl, accessToken, requestsPerMinute = 50) {
    super(baseUrl, accessToken);
    this.requestsPerMinute = requestsPerMinute;
    this.requestTimes = [];
  }

  async request(endpoint, method = 'GET', data = null) {
    // Clean old request times
    const now = Date.now();
    this.requestTimes = this.requestTimes.filter(time => now - time < 60000);
    
    // Check if we're at the limit
    if (this.requestTimes.length >= this.requestsPerMinute) {
      const oldestRequest = Math.min(...this.requestTimes);
      const waitTime = 60000 - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.requestTimes.push(now);
    return super.request(endpoint, method, data);
  }
}
```

## Testing

### 1. Test Script
Use the included `test-api.php` script to verify your setup:

```bash
# Update configuration in test-api.php
php test-api.php
```

### 2. Manual Testing
```bash
# Test site info
curl -X GET "https://your-site.com/wp-json/omnix-chatbot/v1/info" \
  -H "Authorization: Bearer ox_your_token"

# Test search
curl -X POST "https://your-site.com/wp-json/omnix-chatbot/v1/search" \
  -H "Authorization: Bearer ox_your_token" \
  -H "Content-Type: application/json" \
  -d '{"query": "test", "limit": 5}'
```

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check if access token is correct
   - Verify token is included in Authorization header

2. **404 Not Found**
   - Ensure permalinks are enabled
   - Check if plugin is activated

3. **429 Rate Limit Exceeded**
   - Implement request caching
   - Reduce request frequency

4. **500 Internal Server Error**
   - Check WordPress error logs
   - Verify plugin compatibility

### Debug Mode
Enable WordPress debug mode for detailed error messages:
```php
// wp-config.php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
```

## Support

For additional help:
- Check the plugin admin panel for configuration
- Review API responses for error messages
- Enable debug mode for detailed logging
- Contact support with specific error details
