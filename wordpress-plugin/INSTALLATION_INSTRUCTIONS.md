# OmniX Chatbot WordPress Plugin - Installation Instructions

## Overview
The OmniX Chatbot WordPress Plugin allows you to integrate AI chatbots into your WordPress website with secure access token authentication.

## Prerequisites
- WordPress 5.0 or higher
- PHP 7.4 or higher
- Administrator access to your WordPress site

## Installation Methods

### Method 1: Upload Plugin Files (Recommended)
1. Download the complete plugin package
2. Extract the ZIP file
3. Upload the `omnix-chatbot` folder to `/wp-content/plugins/` on your WordPress site
4. Activate the plugin from the WordPress admin dashboard

### Method 2: WordPress Admin Upload
1. Go to WordPress Admin → Plugins → Add New
2. Click "Upload Plugin"
3. Select the downloaded ZIP file
4. Click "Install Now" and then "Activate"

## Configuration

### Step 1: Plugin Settings
1. Go to **OmniX Chatbot → Settings** in your WordPress admin
2. Enter your API details:
   - **API Base URL**: Your OmniX Chatbot API endpoint (e.g., `https://your-domain.com`)
   - **API Key**: Your OmniX Chatbot API key
3. Configure other settings as needed
4. Click "Save Changes"

### Step 2: Generate Access Tokens
1. Go to **OmniX Chatbot → Access Tokens**
2. Click "Generate New Token"
3. Fill in the required information:
   - **Token Name**: A descriptive name (e.g., "Website Integration")
   - **Bot ID**: The ID of your chatbot
   - **Permissions**: Select appropriate permissions
   - **Expiry**: Set token expiration (optional)
4. Click "Generate Token"
5. Copy the generated access token (you'll need this for embedding)

### Step 3: Test Connection
1. In the Settings page, click "Test API Connection"
2. Ensure the connection is successful before proceeding

## Usage

### Shortcode Method
Use the following shortcode in your posts, pages, or widgets:

```
[omnix_chatbot bot_id="YOUR_BOT_ID" access_token="YOUR_ACCESS_TOKEN"]
```

#### Available Parameters:
- `bot_id` (required): Your chatbot ID
- `access_token` (required): Generated access token
- `theme`: Widget theme (default, dark, light)
- `position`: Widget position (bottom-right, bottom-left, top-right, top-left)
- `auto_open`: Auto-open widget (true/false)
- `show_avatar`: Show bot avatar (true/false)
- `show_title`: Show bot title (true/false)
- `enable_voice`: Enable voice features (true/false)
- `voice_language`: Voice language (en-US, en-GB, etc.)
- `auto_speak`: Auto-speak responses (true/false)

### JavaScript Method
Include this script in your HTML:

```html
<script src="/wp-content/plugins/omnix-chatbot/assets/chatbot-widget.js"
        data-bot-id="YOUR_BOT_ID"
        data-access-token="YOUR_ACCESS_TOKEN"
        data-position="bottom-right"
        data-theme="default">
</script>
```

### REST API Method
Use the WordPress REST API endpoints:

- **Chat**: `POST /wp-json/omnix-chatbot/v1/chat`
- **Bots**: `GET /wp-json/omnix-chatbot/v1/bots`
- **Conversations**: `GET /wp-json/omnix-chatbot/v1/conversations`
- **Analytics**: `GET /wp-json/omnix-chatbot/v1/analytics`

Include your access token in the Authorization header:
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## Features

### Admin Dashboard
- **Dashboard**: Overview of tokens, API usage, and recent activity
- **Access Tokens**: Generate and manage API access tokens
- **API Logs**: View detailed logs of all API requests
- **Settings**: Configure plugin settings and API connections

### Security Features
- Secure token-based authentication
- Token expiration and revocation
- API request logging and monitoring
- CORS support for cross-origin requests

### Widget Features
- Responsive design for all devices
- Voice recognition and synthesis
- Multiple themes and positions
- Customizable appearance
- Real-time chat functionality

## Troubleshooting

### Common Issues

1. **Plugin won't activate**
   - Check PHP version (requires 7.4+)
   - Ensure WordPress version is 5.0+
- Check file permissions

2. **API connection fails**
   - Verify API URL and key are correct
   - Check if your server can make outbound HTTPS requests
   - Ensure the API endpoint is accessible

3. **Widget doesn't appear**
   - Check if shortcode parameters are correct
   - Verify access token is valid and not expired
   - Check browser console for JavaScript errors

4. **Voice features not working**
   - Ensure HTTPS is enabled (required for voice features)
   - Check browser compatibility
   - Verify microphone permissions

### Debug Mode
Enable WordPress debug mode to see detailed error messages:
1. Add to `wp-config.php`:
```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
```
2. Check `/wp-content/debug.log` for error messages

### Support
For additional support:
- Check the plugin logs in **OmniX Chatbot → API Logs**
- Review the WordPress debug log
- Contact support with specific error messages

## File Structure
```
omnix-chatbot/
├── omnix-chatbot-plugin.php (Main plugin file)
├── admin/
│   ├── dashboard.php
│   ├── tokens.php
│   ├── settings.php
│   └── logs.php
├── assets/
│   ├── chatbot-widget.js
│   └── chatbot-widget.css
└── README.md
```

## Changelog

### Version 1.0.0
- Initial release
- Access token management
- WordPress shortcode support
- REST API endpoints
- Admin dashboard
- Voice features
- Responsive widget design
- API logging and monitoring

## License
This plugin is licensed under the GPL v2 or later.