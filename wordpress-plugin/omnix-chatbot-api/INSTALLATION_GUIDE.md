# 🚀 OmniX Chatbot API - Complete Installation Guide

## 📦 What You'll Get

This package includes everything you need to integrate your WordPress site with the OmniX Chatbot platform:

- **Main Plugin File** - Complete WordPress plugin with all API endpoints
- **Installation Wizard** - Easy setup process
- **API Testing Tool** - Verify everything works
- **Documentation** - Complete guides and examples
- **Integration Examples** - Code samples for different languages

## 📁 Package Contents

```
omnix-chatbot-api/
├── omnix-chatbot-api.php     # Main plugin file
├── install.php               # Installation wizard
├── test-api.php              # API testing tool
├── README.md                 # Complete documentation
├── INTEGRATION_GUIDE.md      # Developer integration guide
└── INSTALLATION_GUIDE.md     # This file
```

## 🎯 Quick Start (5 Minutes)

### Step 1: Download & Upload
1. **Download** the `omnix-chatbot-api` folder
2. **Upload** to your WordPress site: `wp-content/plugins/`
3. **Extract** the files if they're in a zip

### Step 2: Activate Plugin
1. Go to **WordPress Admin** → **Plugins**
2. Find **"OmniX Chatbot API"**
3. Click **"Activate"**

### Step 3: Run Installation Wizard
1. Go to: `https://your-site.com/wp-content/plugins/omnix-chatbot-api/install.php`
2. Enter your **OmniX Platform URL**
3. Enter your **Bot ID**
4. Click **"Install & Configure Plugin"**

### Step 4: Get API Credentials
1. Go to **Settings** → **OmniX Chatbot API**
2. Copy the generated credentials:
   - **Access Token** (starts with `ox_`)
   - **Secret Key** (starts with `ox_sk_`)
   - **Webhook Secret** (starts with `ox_wh_`)

### Step 5: Test API
1. Go to: `https://your-site.com/wp-content/plugins/omnix-chatbot-api/test-api.php`
2. Update the configuration in the file
3. Run the test to verify everything works

## 🔧 Detailed Installation Steps

### Method 1: Manual Upload (Recommended)

#### 1.1 Download the Plugin
- Download the complete `omnix-chatbot-api` folder
- Ensure all files are included

#### 1.2 Upload to WordPress
```bash
# Upload to your WordPress site
wp-content/plugins/omnix-chatbot-api/
```

#### 1.3 Set File Permissions
```bash
# Set proper permissions (if needed)
chmod 644 omnix-chatbot-api.php
chmod 644 install.php
chmod 644 test-api.php
```

### Method 2: WordPress Admin Upload

#### 2.1 Create Zip File
1. Zip the `omnix-chatbot-api` folder
2. Name it `omnix-chatbot-api.zip`

#### 2.2 Upload via WordPress
1. Go to **Plugins** → **Add New**
2. Click **"Upload Plugin"**
3. Choose the zip file
4. Click **"Install Now"**
5. Click **"Activate Plugin"**

## ⚙️ Configuration

### 1. Basic Configuration
1. Go to **Settings** → **OmniX Chatbot API**
2. Fill in the required fields:
   - **OmniX Platform URL**: `https://your-omnix-platform.com`
   - **Bot ID**: Your bot's ID number
   - **Auto Sync**: Enable automatic content sync
   - **Sync Enabled**: Enable data synchronization

### 2. API Credentials
The plugin automatically generates secure credentials:
- **Access Token**: Used for API authentication
- **Secret Key**: Additional security layer
- **Webhook Secret**: For webhook validation

### 3. Sync Settings
Configure what content to sync:
- ✅ **Posts** - WordPress blog posts
- ✅ **Pages** - Static pages
- ✅ **Categories** - Post categories
- ✅ **Tags** - Post tags
- ❌ **Media** - Images and files (optional)

## 🧪 Testing Your Installation

### 1. Test API Endpoints
Use the included test script:
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

## 🔗 API Endpoints Available

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/info` | GET | Site information and stats |
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

## 🔧 Troubleshooting

### Common Issues

#### 1. Plugin Won't Activate
**Problem**: Plugin activation fails
**Solution**: 
- Check file permissions
- Ensure PHP 7.4+ is installed
- Check WordPress error logs

#### 2. API Returns 404
**Problem**: API endpoints not found
**Solution**:
- Enable permalinks in WordPress
- Go to Settings → Permalinks → Save Changes
- Check if plugin is activated

#### 3. 401 Unauthorized
**Problem**: API returns unauthorized error
**Solution**:
- Check if access token is correct
- Verify token is in Authorization header
- Regenerate tokens if needed

#### 4. 429 Rate Limit Exceeded
**Problem**: Too many API requests
**Solution**:
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

## 📚 Additional Resources

- **README.md** - Complete plugin documentation
- **INTEGRATION_GUIDE.md** - Developer integration examples
- **test-api.php** - API testing tool
- **WordPress Admin** - Plugin settings and management

---

**Need Help?** Check the troubleshooting section or review the error logs for specific issues.
