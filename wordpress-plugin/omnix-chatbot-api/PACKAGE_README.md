# 📦 OmniX Chatbot API - Complete Package

## 🎯 What This Package Contains

This is a complete WordPress plugin package that integrates your WordPress site with the OmniX Chatbot platform. It provides secure API endpoints for content access, automatic synchronization, and seamless integration.

## 📁 Package Contents

```
omnix-chatbot-api/
├── omnix-chatbot-api.php     # Main plugin file (890 lines)
├── install.php               # Installation wizard
├── quick-install.php         # One-click installation
├── test-api.php              # API testing tool
├── download.php              # Package downloader
├── README.md                 # Complete documentation
├── INTEGRATION_GUIDE.md      # Developer integration guide
├── INSTALLATION_GUIDE.md     # Step-by-step installation
└── PACKAGE_README.md         # This file
```

## 🚀 Quick Start (3 Steps)

### Step 1: Upload Plugin
1. **Download** this entire folder
2. **Upload** to your WordPress site: `wp-content/plugins/`
3. **Activate** the plugin in WordPress admin

### Step 2: Quick Install
1. Go to: `https://your-site.com/wp-content/plugins/omnix-chatbot-api/quick-install.php`
2. Enter your **OmniX Platform URL** and **Bot ID**
3. Click **"Install & Configure Plugin"**

### Step 3: Get Credentials
1. Copy the generated **API credentials**
2. Configure your **OmniX platform** with these credentials
3. Test the integration

## 🔧 Installation Methods

### Method 1: WordPress Admin Upload (Recommended)
1. **Zip** this entire folder
2. Go to **Plugins** → **Add New** → **Upload Plugin**
3. Choose the zip file and install
4. Activate the plugin

### Method 2: Manual Upload
1. **Upload** the folder to `wp-content/plugins/`
2. **Activate** the plugin in WordPress admin
3. Run the installation wizard

### Method 3: FTP Upload
1. **Upload** via FTP to `wp-content/plugins/`
2. **Activate** the plugin in WordPress admin
3. Configure via admin panel

## ⚙️ Configuration Options

### Basic Settings
- **OmniX Platform URL** - Your chatbot platform URL
- **Bot ID** - Your bot's ID number
- **Auto Sync** - Automatic content synchronization
- **Sync Enabled** - Enable data sync with platform

### API Credentials (Auto-Generated)
- **Access Token** - For API authentication
- **Secret Key** - Additional security layer
- **Webhook Secret** - For webhook validation

### Sync Settings
- ✅ **Posts** - WordPress blog posts
- ✅ **Pages** - Static pages
- ✅ **Categories** - Post categories
- ✅ **Tags** - Post tags
- ❌ **Media** - Images and files (optional)

## 🔗 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/info` | GET | Site information and statistics |
| `/search` | POST | Search content with filters |
| `/export/posts` | GET | Export WordPress posts |
| `/export/pages` | GET | Export WordPress pages |
| `/export/categories` | GET | Export all categories |
| `/export/tags` | GET | Export all tags |
| `/export/full` | POST | Export complete site data |
| `/webhook/sync` | POST | Webhook for OmniX platform |

## 🛡️ Security Features

- **Bearer Token Authentication** - Secure API access
- **Rate Limiting** - 100 requests per hour per token
- **Data Sanitization** - All output is properly sanitized
- **Meta Field Filtering** - Sensitive data is filtered out
- **Admin-only Configuration** - Only admins can configure
- **Webhook Validation** - Secure webhook endpoints

## 🧪 Testing Tools

### 1. API Test Script
```bash
# Update configuration in test-api.php
php test-api.php
```

### 2. Manual API Testing
```bash
# Test site info
curl -X GET "https://your-site.com/wp-json/omnix-chatbot/v1/info" \
  -H "Authorization: Bearer ox_your_access_token"

# Test search
curl -X POST "https://your-site.com/wp-json/omnix-chatbot/v1/search" \
  -H "Authorization: Bearer ox_your_access_token" \
  -H "Content-Type: application/json" \
  -d '{"query": "test", "limit": 5}'
```

### 3. WordPress Admin Test
1. Go to **Settings** → **OmniX Chatbot API**
2. Click **"Trigger Manual Sync"**
3. Check if sync completes successfully

## 📚 Documentation Files

### README.md
Complete plugin documentation with:
- Installation instructions
- API reference
- Configuration guide
- Troubleshooting tips

### INTEGRATION_GUIDE.md
Developer integration examples for:
- JavaScript/Node.js
- PHP
- Python
- cURL commands

### INSTALLATION_GUIDE.md
Step-by-step installation guide with:
- Multiple installation methods
- Configuration options
- Testing procedures
- Troubleshooting solutions

## 🔧 Troubleshooting

### Common Issues

#### Plugin Won't Activate
- Check file permissions
- Ensure PHP 7.4+ is installed
- Check WordPress error logs

#### API Returns 404
- Enable permalinks in WordPress
- Go to Settings → Permalinks → Save Changes
- Check if plugin is activated

#### 401 Unauthorized
- Check if access token is correct
- Verify token is in Authorization header
- Regenerate tokens if needed

#### 429 Rate Limit Exceeded
- Wait for rate limit to reset (1 hour)
- Implement request caching
- Reduce request frequency

### Debug Mode
Enable WordPress debug mode for detailed errors:
```php
// wp-config.php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
```

## 🎉 Success Checklist

After installation, you should have:

- [ ] Plugin activated in WordPress
- [ ] API credentials generated
- [ ] Configuration completed
- [ ] API endpoints responding
- [ ] Test script passing
- [ ] Manual sync working
- [ ] OmniX platform configured

## 🚀 Next Steps

1. **Configure OmniX Platform** - Use the generated credentials
2. **Set Up Auto-Sync** - Enable automatic content synchronization
3. **Test Integration** - Verify data flows correctly
4. **Monitor Performance** - Check sync status regularly

## 📞 Support

### Getting Help
1. **Check WordPress Error Logs** - Look for specific error messages
2. **Test API Endpoints** - Use the included test script
3. **Verify Configuration** - Ensure all settings are correct
4. **Check File Permissions** - Ensure files are readable

### Common Solutions
- **Clear Cache** - Clear any caching plugins
- **Check Permalinks** - Ensure permalinks are enabled
- **Verify Tokens** - Regenerate API credentials
- **Test Network** - Check if your site is accessible

## 🔄 Plugin Status

Check your plugin status:
- **Plugin Active** - Plugin is activated and running
- **API Token** - Authentication token generated
- **API URL** - OmniX platform URL configured
- **Bot ID** - Bot ID configured
- **Sync Enabled** - Data synchronization enabled

## 📋 System Requirements

- **WordPress** 5.0 or higher
- **PHP** 7.4 or higher
- **Admin Access** to WordPress
- **File Upload** permissions
- **OmniX Platform** URL and Bot ID

## 🎯 Key Benefits

- **Zero-Code Setup** - Just enter URL and Bot ID
- **Automatic Sync** - Content syncs automatically
- **Secure API** - Bearer token authentication
- **Rate Limited** - Prevents abuse
- **Admin Interface** - Easy configuration
- **Complete Documentation** - Guides and examples
- **Testing Tools** - Verify functionality
- **Webhook Support** - Real-time integration

---

**Ready to get started?** Follow the Quick Start guide above or use the installation wizard for a guided setup process.
