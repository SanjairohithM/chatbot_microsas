# 🔧 Troubleshooting Voice UI Not Showing

## Issue: Voice buttons (🎤 and 🔊) are not appearing in the chatbot widget

### Quick Fix Steps:

1. **Use Debug Shortcode** (for testing):
   ```php
   [omnix_chatbot_debug]
   ```

2. **Check Browser Console**:
   - Press F12 to open Developer Tools
   - Go to Console tab
   - Look for error messages or debug logs

3. **Verify Plugin Settings**:
   - Go to **Settings** → **OmniX Chatbot API**
   - Make sure **Bot ID** and **Access Token** are set
   - Check **Voice Settings** section

### Detailed Troubleshooting:

#### Step 1: Check if JavaScript is Loading
1. Open browser Developer Tools (F12)
2. Go to **Network** tab
3. Reload the page
4. Look for `chatbot-widget.js` - it should load without errors
5. If it's not loading, check the file path in WordPress

#### Step 2: Check Console for Errors
Look for these messages in the console:
- `"DOM Content Loaded - Looking for chatbot widgets"`
- `"Found widgets: X"` (should be > 0)
- `"Initializing OmniX Chatbot Widget with config:"`
- `"Creating widget with enableVoice: true"`

#### Step 3: Verify Shortcode Parameters
Make sure your shortcode includes voice parameters:
```php
[omnix_chatbot 
    bot_id="7" 
    access_token="your_token"
    enable_voice="true"
    voice_language="en-US"
]
```

#### Step 4: Check Data Attributes
In the browser console, run:
```javascript
const widget = document.querySelector('.omnix-chatbot-widget');
console.log('Widget dataset:', widget.dataset);
console.log('Enable voice:', widget.dataset.enableVoice);
```

#### Step 5: Force Voice Enable
If voice is still not showing, try this debug shortcode:
```php
[omnix_chatbot_debug]
```

### Common Issues & Solutions:

#### Issue 1: JavaScript Not Loading
**Symptoms**: No console logs, widget appears but no voice buttons
**Solution**: 
- Check file permissions
- Verify file path in `enqueue_chatbot_assets()`
- Clear WordPress cache

#### Issue 2: Widget Not Initializing
**Symptoms**: Console shows "Found widgets: 0"
**Solution**:
- Check if shortcode is properly placed
- Verify the widget HTML is being generated
- Check for JavaScript errors

#### Issue 3: Voice Config Not Parsing
**Symptoms**: Console shows "enableVoice: false"
**Solution**:
- Check data attributes in the widget HTML
- Verify shortcode parameters
- Check WordPress options

#### Issue 4: CSS Not Loading
**Symptoms**: Widget appears but looks broken
**Solution**:
- Check if `chatbot-styles.css` is loading
- Verify file path and permissions
- Check for CSS conflicts

### Debug Commands:

#### Check Widget HTML:
```javascript
document.querySelector('.omnix-chatbot-widget').outerHTML
```

#### Check Voice Buttons:
```javascript
document.querySelectorAll('.voice-btn, .speak-btn')
```

#### Check Widget Config:
```javascript
const widget = document.querySelector('.omnix-chatbot-widget');
const config = {
    enableVoice: widget.dataset.enableVoice,
    voiceLanguage: widget.dataset.voiceLanguage,
    autoSpeak: widget.dataset.autoSpeak
};
console.log('Config:', config);
```

### Manual Test:

1. **Create a test page** with this content:
```html
<div class="omnix-chatbot-widget" 
     data-bot-id="7" 
     data-access-token="test"
     data-enable-voice="true"
     data-voice-language="en-US">
</div>

<script>
// Mock the required object
window.omnixChatbot = {
    apiUrl: 'https://test.com',
    ajaxUrl: '/wp-admin/admin-ajax.php',
    nonce: 'test'
};
</script>
```

2. **Include the JavaScript file**:
```html
<script src="/wp-content/plugins/omnix-chatbot-api/assets/chatbot-widget.js"></script>
```

3. **Check the console** for debug messages

### File Structure Check:

Make sure these files exist:
```
wordpress-plugin/omnix-chatbot-api/
├── omnix-chatbot-api.php
├── assets/
│   ├── chatbot-widget.js
│   └── chatbot-styles.css
└── test-widget.html
```

### WordPress Debug:

1. **Enable WordPress Debug** in `wp-config.php`:
```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
```

2. **Check debug logs** in `/wp-content/debug.log`

3. **Look for these log entries**:
```
OmniX Chatbot Shortcode - Bot ID: 7
OmniX Chatbot Shortcode - Enable Voice: true
OmniX Chatbot Widget HTML: <div id="omnix-chatbot-...
```

### Still Not Working?

If voice buttons still don't appear:

1. **Try the debug shortcode**: `[omnix_chatbot_debug]`
2. **Check browser compatibility**: Use Chrome/Edge for best results
3. **Verify HTTPS**: Voice requires HTTPS in production
4. **Check permissions**: Make sure microphone access is allowed

### Contact Support:

If the issue persists, provide:
1. Browser console logs
2. WordPress debug logs
3. Shortcode being used
4. Browser and version
5. WordPress version
