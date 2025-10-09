# 🎤 OmniX Chat Sync Plugin - Voice Features Guide

## Overview

The OmniX Chat Sync Plugin now includes comprehensive voice functionality and enhanced conversation context handling for follow-up questions. This guide covers all the new features and how to use them.

## 🚀 New Features Added

### ✅ Voice Input & Output
- **Speech Recognition**: Convert speech to text
- **Text-to-Speech**: Convert responses to speech
- **Multi-language Support**: 10+ languages supported
- **Voice Controls**: Rate, pitch, volume adjustment
- **Continuous Recognition**: Keep listening mode
- **Interim Results**: See speech recognition in real-time

### ✅ Enhanced Follow-up Questions
- **Conversation Context**: Maintains conversation history
- **Database Storage**: Stores conversations for context
- **Smart Context Retrieval**: Uses conversation history for better responses
- **Follow-up Support**: Handles "what about...", "tell me more", etc.

### ✅ Modern UI/UX
- **Responsive Design**: Works on all devices
- **Dark Mode Support**: Automatic dark theme detection
- **Accessibility**: Screen reader and keyboard navigation support
- **Smooth Animations**: Professional look and feel

## 📋 Installation & Setup

### 1. Plugin Installation
1. Upload the `omnix-chatbot-api` folder to `/wp-content/plugins/`
2. Activate the plugin in WordPress Admin
3. Go to **Settings** → **OmniX Chatbot API**

### 2. Basic Configuration
1. **OmniX Platform URL**: Enter your chatbot API URL
2. **Bot ID**: Enter your bot ID
3. **Auto Sync**: Enable automatic content sync
4. **Sync Enabled**: Enable data synchronization

### 3. Voice Settings Configuration
1. **Voice Language**: Select your preferred language
2. **Voice Rate**: Adjust speech speed (0.1x - 2.0x)
3. **Voice Pitch**: Adjust voice pitch (0.1 - 2.0)
4. **Voice Volume**: Adjust volume (0.1 - 1.0)
5. **Auto Speak**: Automatically speak bot responses
6. **Continuous Recognition**: Keep voice input active
7. **Interim Results**: Show real-time speech recognition

## 🎯 Usage

### Shortcode Implementation

#### Basic Usage
```php
[omnix_chatbot]
```

#### Advanced Usage with Voice
```php
[omnix_chatbot 
    bot_id="6" 
    access_token="your_access_token" 
    enable_voice="true"
    voice_language="en-US"
    auto_speak="true"
    voice_rate="1.0"
    voice_pitch="1.0"
    voice_volume="1.0"
    voice_continuous="false"
    voice_interim_results="true"
]
```

#### All Available Parameters
- `bot_id`: Your bot ID (required)
- `access_token`: Your access token (required)
- `theme`: Widget theme (default: "default")
- `position`: Widget position (bottom-right, bottom-left, top-right, top-left)
- `auto_open`: Auto-open widget (true/false)
- `show_avatar`: Show avatar (true/false)
- `show_title`: Show title (true/false)
- `enable_voice`: Enable voice features (true/false)
- `voice_language`: Voice language (en-US, es-ES, fr-FR, etc.)
- `auto_speak`: Auto-speak responses (true/false)
- `voice_rate`: Speech rate (0.1-2.0)
- `voice_pitch`: Voice pitch (0.1-2.0)
- `voice_volume`: Volume level (0.1-1.0)
- `voice_continuous`: Continuous recognition (true/false)
- `voice_interim_results`: Show interim results (true/false)

### Widget Features

#### Voice Input
1. Click the microphone button (🎤) to start voice input
2. Speak your message clearly
3. The system will convert speech to text
4. Click send or wait for auto-send

#### Voice Output
1. Click the speaker button (🔊) on any bot response
2. The system will speak the message
3. Auto-speak can be enabled for all responses

#### Follow-up Questions
1. Ask your first question
2. Ask follow-up questions like:
   - "What about the pricing?"
   - "Tell me more about that"
   - "How does it work?"
   - "Can you explain further?"
3. The bot will use conversation context for better responses

## 🔧 Technical Details

### Database Schema
The plugin creates a `wp_omnix_chatbot_conversations` table to store:
- `conversation_id`: Unique conversation identifier
- `user_message`: User's message
- `bot_response`: Bot's response
- `created_at`: Timestamp

### API Integration
- **Chat Endpoint**: `/api/chat`
- **Context Handling**: Sends conversation history
- **Voice Support**: Handles voice input/output
- **Error Handling**: Comprehensive error management

### Browser Compatibility
- **Chrome/Edge**: Full voice support
- **Safari**: Limited voice support (iOS 14.5+)
- **Firefox**: Limited voice support
- **Mobile**: Full support on modern browsers

## 🎨 Customization

### CSS Customization
You can customize the widget appearance by overriding CSS:

```css
/* Custom theme colors */
.omnix-chatbot-toggle {
    background: linear-gradient(135deg, #your-color, #your-color-2);
}

.omnix-chatbot-header {
    background: linear-gradient(135deg, #your-color, #your-color-2);
}
```

### JavaScript Customization
Extend the widget functionality:

```javascript
// Custom event listeners
document.addEventListener('omnix-chatbot-message-sent', function(e) {
    console.log('Message sent:', e.detail);
});

document.addEventListener('omnix-chatbot-voice-started', function(e) {
    console.log('Voice recognition started');
});
```

## 🐛 Troubleshooting

### Voice Not Working
1. **Check HTTPS**: Voice requires HTTPS in production
2. **Browser Support**: Use Chrome/Edge for best compatibility
3. **Permissions**: Allow microphone access when prompted
4. **Console Errors**: Check browser console for errors

### Follow-up Questions Not Working
1. **Database**: Ensure conversations table is created
2. **API Connection**: Check chatbot API connectivity
3. **Context**: Verify conversation history is being sent
4. **Logs**: Check server logs for errors

### Widget Not Appearing
1. **Plugin Activation**: Ensure plugin is activated
2. **Shortcode**: Check shortcode syntax
3. **Settings**: Verify API URL and credentials
4. **JavaScript**: Check for JavaScript errors

## 📱 Mobile Support

### Voice Features on Mobile
- **iOS Safari**: Full voice support (iOS 14.5+)
- **Android Chrome**: Full voice support
- **Responsive Design**: Optimized for mobile screens
- **Touch Controls**: Touch-friendly interface

### Mobile-Specific Settings
```php
[omnix_chatbot 
    enable_voice="true"
    voice_continuous="false"
    voice_interim_results="true"
    position="bottom-right"
]
```

## 🔒 Security Features

### Data Protection
- **Nonce Verification**: CSRF protection
- **Input Sanitization**: All inputs are sanitized
- **SQL Injection Prevention**: Prepared statements
- **XSS Protection**: Output escaping

### Privacy Considerations
- **Conversation Storage**: Stored locally in WordPress database
- **Voice Data**: Processed locally, not stored
- **API Communication**: Encrypted HTTPS communication

## 📊 Performance Optimization

### Caching
- **Script Caching**: JavaScript and CSS are cached
- **Database Optimization**: Indexed conversation table
- **Minimal Requests**: Efficient API calls

### Resource Usage
- **Lazy Loading**: Assets loaded only when needed
- **Memory Management**: Efficient conversation storage
- **Bandwidth**: Optimized for mobile networks

## 🆘 Support

### Common Issues
1. **Voice not working**: Check HTTPS and browser support
2. **Follow-up questions failing**: Verify database and API connection
3. **Widget not showing**: Check plugin activation and shortcode
4. **Styling issues**: Clear cache and check CSS conflicts

### Getting Help
1. Check browser console for errors
2. Verify plugin settings
3. Test with different browsers
4. Check server error logs

## 🎉 Conclusion

The enhanced OmniX Chat Sync Plugin now provides:
- ✅ **Full voice functionality** with multi-language support
- ✅ **Enhanced follow-up question handling** with conversation context
- ✅ **Modern, responsive UI** with accessibility features
- ✅ **Comprehensive customization options**
- ✅ **Mobile-optimized experience**
- ✅ **Security and performance optimizations**

Your chatbot is now ready to provide an engaging, voice-enabled experience with intelligent follow-up question handling!
