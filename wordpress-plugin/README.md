# OmniX Chatbot WordPress Plugin

A powerful WordPress plugin that integrates AI chatbots into your website with secure access token authentication.

## Features

- 🤖 **AI Chatbot Integration** - Seamlessly integrate chatbots into your WordPress site
- 🔐 **Secure Authentication** - Token-based authentication system
- 📱 **Responsive Design** - Works perfectly on all devices
- 🎤 **Voice Features** - Voice recognition and text-to-speech capabilities
- 🎨 **Customizable Themes** - Multiple themes and positioning options
- 📊 **Analytics & Logging** - Comprehensive API usage tracking
- 🔧 **Easy Management** - User-friendly admin dashboard
- 📝 **Shortcode Support** - Easy embedding with WordPress shortcodes
- 🌐 **REST API** - Full REST API for custom integrations

## Quick Start

1. **Install the Plugin**
   - Upload the plugin files to `/wp-content/plugins/omnix-chatbot/`
   - Activate the plugin in WordPress admin

2. **Configure Settings**
   - Go to OmniX Chatbot → Settings
   - Enter your API URL and key
   - Test the connection

3. **Generate Access Token**
   - Go to OmniX Chatbot → Access Tokens
   - Create a new token for your bot
   - Copy the generated token

4. **Embed the Chatbot**
   - Use the shortcode: `[omnix_chatbot bot_id="YOUR_BOT_ID" access_token="YOUR_TOKEN"]`
   - Or use the JavaScript widget

## Installation

### Method 1: Manual Upload
1. Download the plugin ZIP file
2. Extract to your WordPress plugins directory
3. Activate in WordPress admin

### Method 2: WordPress Admin
1. Go to Plugins → Add New
2. Upload the ZIP file
3. Install and activate

## Configuration

### API Settings
- **API Base URL**: Your OmniX Chatbot API endpoint
- **API Key**: Your authentication key
- **Default Permissions**: Set default token permissions
- **Token Expiry**: Configure token expiration

### Widget Settings
- **Position**: Choose widget position (bottom-right, bottom-left, etc.)
- **Theme**: Select theme (default, dark, light)
- **Voice Features**: Enable/disable voice capabilities
- **Auto-open**: Set whether widget opens automatically

## Usage

### Shortcode
```php
[omnix_chatbot 
    bot_id="123" 
    access_token="your_token_here"
    theme="default"
    position="bottom-right"
    auto_open="false"
    enable_voice="true"
]
```

### JavaScript Widget
```html
<script src="/wp-content/plugins/omnix-chatbot/assets/chatbot-widget.js"
        data-bot-id="123"
        data-access-token="your_token_here"
        data-position="bottom-right">
</script>
```

### REST API
```bash
curl -X POST "https://yoursite.com/wp-json/omnix-chatbot/v1/chat" \
  -H "Authorization: Bearer your_token_here" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, how can you help me?"}'
```

## Admin Dashboard

### Dashboard
- Overview of tokens and API usage
- Recent activity and statistics
- Quick access to all features

### Access Tokens
- Generate new access tokens
- Manage existing tokens
- Set permissions and expiration
- View usage statistics

### API Logs
- Detailed request/response logs
- Filter by token, status, date
- Export logs for analysis
- Performance metrics

### Settings
- API configuration
- Security settings
- Widget defaults
- Integration options

## Security

- **Token-based Authentication** - Secure API access
- **Token Expiration** - Automatic token expiry
- **Permission System** - Granular access control
- **Request Logging** - Complete audit trail
- **CORS Support** - Cross-origin request handling

## Customization

### Themes
- **Default**: Clean, modern design
- **Dark**: Dark theme for better contrast
- **Light**: Light theme for bright sites

### Positioning
- `bottom-right` - Bottom right corner (default)
- `bottom-left` - Bottom left corner
- `top-right` - Top right corner
- `top-left` - Top left corner

### Voice Features
- Voice recognition for input
- Text-to-speech for responses
- Multiple language support
- Customizable voice settings

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/wp-json/omnix-chatbot/v1/chat` | POST | Send chat messages |
| `/wp-json/omnix-chatbot/v1/bots` | GET | Get available bots |
| `/wp-json/omnix-chatbot/v1/conversations` | GET | Get conversation history |
| `/wp-json/omnix-chatbot/v1/analytics` | GET | Get analytics data |

## Requirements

- WordPress 5.0+
- PHP 7.4+
- HTTPS (required for voice features)
- Modern web browser

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## Troubleshooting

### Common Issues

1. **Widget not appearing**
   - Check shortcode parameters
   - Verify access token is valid
   - Check browser console for errors

2. **API connection fails**
   - Verify API URL and key
   - Check server can make HTTPS requests
   - Ensure API endpoint is accessible

3. **Voice features not working**
   - Ensure HTTPS is enabled
   - Check browser permissions
   - Verify browser compatibility

### Debug Mode
Enable WordPress debug mode:
```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
```

## Support

- Check the plugin logs in the admin dashboard
- Review WordPress debug log
- Contact support with specific error messages

## Changelog

### Version 1.0.0
- Initial release
- Complete chatbot integration
- Admin dashboard
- Token management
- Voice features
- REST API
- Responsive design

## License

GPL v2 or later

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues.

## Credits

Developed by the OmniX Team for seamless AI chatbot integration.