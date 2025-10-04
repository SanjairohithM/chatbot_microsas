# OmniX Chatbot WordPress Plugin Integration

This document provides comprehensive instructions for integrating your OmniX Chatbot with WordPress using the provided plugin and access token system.

## Overview

The WordPress plugin creates a bridge between your OmniX Chatbot system and external websites, allowing you to:

- Generate secure access tokens for chatbot access
- Embed chatbots on any WordPress site using shortcodes
- Track API usage and analytics
- Manage multiple bots with different permissions
- Support voice features and customization

## Installation

### 1. WordPress Plugin Installation

1. Upload the `wordpress-plugin` folder to your WordPress site's `/wp-content/plugins/` directory
2. Rename the folder to `omnix-chatbot`
3. Activate the plugin from the WordPress admin dashboard
4. Go to **OmniX Chatbot** in the admin menu to configure

### 2. Configure Plugin Settings

1. Navigate to **OmniX Chatbot > Settings**
2. Set your **API Base URL** (e.g., `https://your-domain.com`)
3. Enter your **API Key** for authentication
4. Configure default permissions and token expiry settings
5. Test the connection to ensure everything is working

### 3. Generate Access Tokens

1. Go to **OmniX Chatbot > Access Tokens**
2. Click **Generate New Token**
3. Fill in the required information:
   - **Token Name**: Descriptive name (e.g., "Website Integration")
   - **Bot ID**: Select the bot this token will access
   - **Permissions**: Choose what the token can do
   - **Expiry**: Set when the token expires (optional)
4. Copy the generated **Access Token** and **Secret Key**

## Usage

### 1. Shortcode Integration

Use the shortcode in any post, page, or widget:

```php
[omnix_chatbot bot_id="1" access_token="YOUR_ACCESS_TOKEN"]
```

#### Available Parameters

| Parameter | Description | Default | Required |
|-----------|-------------|---------|----------|
| `bot_id` | Your chatbot ID | - | Yes |
| `access_token` | Generated access token | - | Yes |
| `theme` | Widget theme (default, dark, light) | default | No |
| `position` | Widget position | bottom-right | No |
| `auto_open` | Auto-open widget | false | No |
| `show_avatar` | Show bot avatar | true | No |
| `show_title` | Show bot title | true | No |
| `enable_voice` | Enable voice features | true | No |
| `voice_language` | Voice language | en-US | No |
| `auto_speak` | Auto-speak responses | false | No |

#### Example Shortcodes

```php
// Basic chatbot
[omnix_chatbot bot_id="1" access_token="ox_abc123..."]

// Customized chatbot with voice
[omnix_chatbot 
    bot_id="1" 
    access_token="ox_abc123..." 
    theme="dark" 
    position="bottom-left" 
    enable_voice="true" 
    voice_language="en-GB"]

// Auto-opening chatbot
[omnix_chatbot 
    bot_id="2" 
    access_token="ox_def456..." 
    auto_open="true" 
    show_avatar="false"]
```

### 2. JavaScript Widget Integration

Include the widget script directly in your HTML:

```html
<script src="https://your-wordpress-site.com/wp-content/plugins/omnix-chatbot/assets/chatbot-widget.js" 
        data-bot-id="1"
        data-access-token="ox_abc123..."
        data-theme="default"
        data-position="bottom-right"
        data-enable-voice="true">
</script>
```

### 3. REST API Integration

Use the REST API for custom implementations:

```javascript
// Send a chat message
const response = await fetch('https://your-wordpress-site.com/wp-json/omnix-chatbot/v1/chat', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        message: 'Hello, how can you help me?',
        conversationId: null
    })
});

const data = await response.json();
console.log(data.message);
```

#### Available Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/wp-json/omnix-chatbot/v1/chat` | POST | Send chat messages |
| `/wp-json/omnix-chatbot/v1/bots` | GET | Get bot information |
| `/wp-json/omnix-chatbot/v1/conversations` | GET | Get conversation history |
| `/wp-json/omnix-chatbot/v1/analytics` | GET | Get analytics data |

## Token Management

### Creating Tokens

```bash
curl -X POST "https://your-domain.com/api/tokens" \
  -H "Content-Type: application/json" \
  -d '{
    "bot_id": 1,
    "token_name": "Website Integration",
    "permissions": "chat,analytics,conversations",
    "expires_days": 365
  }'
```

### Validating Tokens

```bash
curl -X GET "https://your-domain.com/api/auth/token?access_token=ox_abc123..."
```

### Revoking Tokens

```bash
curl -X DELETE "https://your-domain.com/api/tokens" \
  -H "Content-Type: application/json" \
  -d '{"access_token": "ox_abc123..."}'
```

## Security Features

### 1. Token Security
- **Access Tokens**: Used for API authentication
- **Secret Keys**: Additional security validation
- **Expiration**: Optional token expiry dates
- **Permissions**: Granular access control

### 2. Rate Limiting
- Configurable requests per hour per token
- Automatic blocking of excessive requests
- Detailed logging of all API calls

### 3. CORS Protection
- Configurable allowed origins
- Secure cross-origin requests
- Proper headers for security

## Customization

### 1. Widget Styling

The widget supports CSS customization:

```css
.omnix-chatbot-container {
    /* Custom container styles */
}

.omnix-chatbot-window {
    /* Custom window styles */
}

.omnix-chatbot-button {
    /* Custom button styles */
}
```

### 2. Theme Support

Three built-in themes:
- **Default**: Clean, modern design
- **Dark**: Dark mode for better night viewing
- **Light**: Light mode for bright environments

### 3. Voice Features

Voice capabilities include:
- **Speech Recognition**: Voice input support
- **Text-to-Speech**: Audio responses
- **Multiple Languages**: Support for various languages
- **Customizable Settings**: Rate, pitch, and language

## Analytics and Monitoring

### 1. API Logs
- Track all API requests and responses
- Monitor error rates and performance
- View detailed request information
- Filter logs by token, status, or date

### 2. Usage Statistics
- Total requests per token
- Success/error rates
- Average response times
- Most active tokens

### 3. Dashboard
- Real-time statistics
- Quick actions
- Integration examples
- System health monitoring

## Troubleshooting

### Common Issues

1. **Token Not Working**
   - Verify the token is active and not expired
   - Check the bot ID matches
   - Ensure proper permissions are set

2. **Widget Not Loading**
   - Check if the script is properly included
   - Verify the access token is correct
   - Check browser console for errors

3. **API Connection Failed**
   - Verify the API URL is correct
   - Check if the API key is valid
   - Ensure the server is accessible

### Debug Mode

Enable debug logging in the plugin settings to get detailed error information.

## Advanced Configuration

### 1. Custom API Endpoints

You can create custom endpoints by extending the plugin:

```php
add_action('rest_api_init', function() {
    register_rest_route('omnix-chatbot/v1', '/custom', array(
        'methods' => 'POST',
        'callback' => 'your_custom_function',
        'permission_callback' => 'omnix_verify_token_permission'
    ));
});
```

### 2. Custom Widget Themes

Add custom themes by extending the CSS:

```css
.omnix-chatbot-theme-custom {
    /* Your custom theme styles */
}
```

### 3. Integration with Other Plugins

The plugin provides hooks for integration:

```php
// Before sending message
do_action('omnix_chatbot_before_message', $message, $token_info);

// After receiving response
do_action('omnix_chatbot_after_response', $response, $token_info);
```

## Support and Maintenance

### Regular Maintenance
- Monitor API usage and performance
- Review and rotate tokens regularly
- Update the plugin when new versions are available
- Check logs for any issues

### Backup
- Regular database backups
- Plugin file backups
- Token configuration backups

## API Reference

### Authentication
All API requests require either:
- `Authorization: Bearer YOUR_ACCESS_TOKEN` header
- `access_token` parameter in request body

### Response Format
```json
{
    "success": true,
    "message": "Response message",
    "conversationId": 123,
    "messageId": 456,
    "usage": {
        "total_tokens": 150,
        "prompt_tokens": 100,
        "completion_tokens": 50
    },
    "model": "gpt-4o-mini",
    "response_time_ms": 1250
}
```

### Error Format
```json
{
    "success": false,
    "error": "Error message",
    "code": "ERROR_CODE"
}
```

## Conclusion

This WordPress plugin provides a complete solution for integrating your OmniX Chatbot with external websites. The token-based authentication system ensures security while providing flexibility for various integration scenarios.

For additional support or custom development, refer to the plugin documentation or contact your development team.
