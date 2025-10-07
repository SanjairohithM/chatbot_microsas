# OmniX Chatbot API WordPress Plugin

A comprehensive WordPress plugin that provides REST API endpoints for OmniX Chatbot to access and sync WordPress site data automatically.

## Features

### 🔐 **Secure Authentication**
- Bearer token authentication
- Rate limiting (100 requests per hour)
- Webhook secret validation
- IP-based access controls

### 📊 **Data Export Endpoints**
- **Search**: Intelligent content search with filters
- **Posts**: Export WordPress posts with metadata
- **Pages**: Export WordPress pages with hierarchy
- **Categories**: Export all categories and taxonomies
- **Tags**: Export all tags
- **Full Export**: Complete site data export
- **Site Info**: Basic site information and statistics

### 🔄 **Automatic Sync**
- Real-time sync on post publish
- Manual sync trigger
- Configurable sync settings
- Webhook integration with OmniX platform

### 🛡️ **Security & Privacy**
- Sanitized output (no sensitive data)
- Meta field filtering
- GDPR compliance ready
- Secure token management

## Installation

1. **Upload Plugin**
   ```bash
   # Upload to WordPress plugins directory
   wp-content/plugins/omnix-chatbot-api/
   ```

2. **Activate Plugin**
   - Go to WordPress Admin → Plugins
   - Find "OmniX Chatbot API"
   - Click "Activate"

3. **Configure Settings**
   - Go to Settings → OmniX Chatbot API
   - Enter your OmniX platform URL
   - Enter your Bot ID
   - Configure sync settings

## API Endpoints

### Authentication
All API requests require a Bearer token in the Authorization header:
```
Authorization: Bearer ox_your_access_token_here
```

### 1. Site Information
```http
GET /wp-json/omnix-chatbot/v1/info
```

**Response:**
```json
{
  "site": {
    "name": "My WordPress Site",
    "description": "Site description",
    "url": "https://example.com",
    "version": "6.4",
    "language": "en_US",
    "timezone": "America/New_York",
    "admin_email": "admin@example.com"
  },
  "content_stats": {
    "posts": 150,
    "pages": 25,
    "categories": 12,
    "tags": 45,
    "media": 300
  },
  "endpoints": { ... },
  "bot_id": "123",
  "sync_enabled": true
}
```

### 2. Search Content
```http
POST /wp-json/omnix-chatbot/v1/search
Content-Type: application/json

{
  "query": "how to reset password",
  "post_types": ["post", "page"],
  "limit": 10,
  "include_meta": true,
  "search_fields": ["title", "content", "excerpt"]
}
```

**Response:**
```json
{
  "query": "how to reset password",
  "count": 3,
  "total_found": 3,
  "results": [
    {
      "id": 123,
      "title": "How to Reset Your Password",
      "slug": "reset-password",
      "excerpt": "Learn how to reset your password...",
      "content": "Step-by-step guide...",
      "url": "https://example.com/reset-password",
      "post_type": "post",
      "date": "2024-01-15 10:30:00",
      "modified": "2024-01-15 10:30:00",
      "author": "Admin",
      "featured_image": "https://example.com/image.jpg",
      "categories": ["Help", "Security"],
      "tags": ["password", "security"],
      "word_count": 250,
      "meta": { ... }
    }
  ],
  "search_fields": ["title", "content", "excerpt"],
  "execution_time": "0.045"
}
```

### 3. Export Posts
```http
GET /wp-json/omnix-chatbot/v1/export/posts?limit=100&offset=0&post_type=post&status=publish
```

### 4. Export Pages
```http
GET /wp-json/omnix-chatbot/v1/export/pages?limit=100&offset=0
```

### 5. Export Categories
```http
GET /wp-json/omnix-chatbot/v1/export/categories
```

### 6. Export Tags
```http
GET /wp-json/omnix-chatbot/v1/export/tags
```

### 7. Full Site Export
```http
POST /wp-json/omnix-chatbot/v1/export/full
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

## Configuration

### Admin Settings

1. **OmniX Platform URL**: Your OmniX chatbot platform URL
2. **Bot ID**: The ID of your bot in the OmniX platform
3. **Auto Sync**: Automatically sync content when posts are published
4. **Sync Enabled**: Enable data sync with OmniX platform

### API Credentials

The plugin automatically generates three credentials:

1. **Access Token**: Used for API authentication
2. **Secret Key**: Additional security layer
3. **Webhook Secret**: For webhook validation

## Security Features

### Data Sanitization
- All output is sanitized using WordPress functions
- Sensitive meta fields are filtered out
- HTML content is properly escaped

### Rate Limiting
- 100 requests per hour per token
- IP-based tracking
- Automatic reset after time window

### Access Control
- Bearer token authentication
- Webhook secret validation
- Admin-only configuration

## Integration with OmniX Platform

### Automatic Sync
When enabled, the plugin automatically syncs content to your OmniX platform:

1. **On Post Publish**: New posts are immediately synced
2. **Manual Sync**: Trigger sync from admin panel
3. **Webhook Support**: Receives commands from OmniX platform

### Webhook Endpoints
```http
POST /wp-json/omnix-chatbot/v1/webhook/sync
X-Webhook-Secret: your_webhook_secret

{
  "action": "sync",
  "settings": {
    "auto_sync": true,
    "sync_enabled": true
  }
}
```

## Usage Examples

### JavaScript/Node.js
```javascript
const response = await fetch('https://example.com/wp-json/omnix-chatbot/v1/search', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ox_your_access_token_here',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: 'WordPress tutorials',
    post_types: ['post'],
    limit: 5
  })
});

const data = await response.json();
console.log(data.results);
```

### PHP
```php
$response = wp_remote_post('https://example.com/wp-json/omnix-chatbot/v1/search', [
    'headers' => [
        'Authorization' => 'Bearer ox_your_access_token_here',
        'Content-Type' => 'application/json'
    ],
    'body' => json_encode([
        'query' => 'WordPress tutorials',
        'post_types' => ['post'],
        'limit' => 5
    ])
]);

$data = json_decode(wp_remote_retrieve_body($response), true);
```

### cURL
```bash
curl -X POST "https://example.com/wp-json/omnix-chatbot/v1/search" \
  -H "Authorization: Bearer ox_your_access_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "WordPress tutorials",
    "post_types": ["post"],
    "limit": 5
  }'
```

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check if access token is correct
   - Verify token is included in Authorization header

2. **429 Rate Limit Exceeded**
   - Wait for rate limit window to reset
   - Consider implementing request caching

3. **404 Not Found**
   - Ensure permalinks are enabled
   - Check if plugin is activated

4. **500 Internal Server Error**
   - Check WordPress error logs
   - Verify plugin compatibility

### Debug Mode
Enable WordPress debug mode to see detailed error messages:
```php
// wp-config.php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
```

## Changelog

### Version 1.0.0
- Initial release
- Basic API endpoints
- Authentication system
- Rate limiting
- Admin configuration panel
- Auto-sync functionality

## Support

For support and questions:
- Check the WordPress admin panel for configuration
- Review API responses for error messages
- Enable debug mode for detailed logging

## License

GPL v2 or later

---

**Note**: This plugin is designed to work with the OmniX Chatbot platform. Make sure your OmniX platform is properly configured to receive data from this plugin.
