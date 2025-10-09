# OmniX Chatbot Voice Features Guide

## Overview

The OmniX Chatbot WordPress plugin includes comprehensive voice functionality that allows users to interact with the chatbot using speech recognition and receive responses through text-to-speech synthesis.

## Voice Features

### 🎤 Voice Input (Speech Recognition)
- **Microphone Button**: Click the microphone icon to start voice input
- **Real-time Recognition**: Converts speech to text in real-time
- **Visual Feedback**: Button turns red when listening
- **Auto-send**: Automatically sends recognized text as a message
- **Multi-language Support**: Supports multiple languages and accents

### 🔊 Voice Output (Text-to-Speech)
- **Speaker Button**: Click the speaker icon on assistant messages to hear them
- **Auto-speak**: Option to automatically speak all assistant responses
- **Customizable Voice**: Adjustable rate, pitch, and volume
- **Multiple Languages**: Supports various languages for speech synthesis

## Configuration Options

### Shortcode Parameters

```php
[omnix_chatbot 
    bot_id="123" 
    access_token="your_token"
    enable_voice="true"
    voice_language="en-US"
    auto_speak="false"
    voice_rate="1.0"
    voice_pitch="1.0"
    voice_volume="1.0"
    voice_continuous="false"
    voice_interim_results="false"
]
```

### Parameter Descriptions

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `enable_voice` | boolean | `true` | Enable/disable voice features |
| `voice_language` | string | `en-US` | Language for voice recognition and synthesis |
| `auto_speak` | boolean | `false` | Automatically speak assistant responses |
| `voice_rate` | float | `1.0` | Speech rate (0.1 = very slow, 2.0 = very fast) |
| `voice_pitch` | float | `1.0` | Voice pitch (0.1 = very low, 2.0 = very high) |
| `voice_volume` | float | `1.0` | Voice volume (0.1 = very quiet, 1.0 = maximum) |
| `voice_continuous` | boolean | `false` | Continuous speech recognition |
| `voice_interim_results` | boolean | `false` | Show interim recognition results |

## Supported Languages

### Speech Recognition
- English (US) - `en-US`
- English (UK) - `en-GB`
- Spanish - `es-ES`
- French - `fr-FR`
- German - `de-DE`
- Italian - `it-IT`
- Portuguese (Brazil) - `pt-BR`
- Japanese - `ja-JP`
- Korean - `ko-KR`
- Chinese (Simplified) - `zh-CN`

### Text-to-Speech
Supports all languages available in the user's browser, including:
- All major European languages
- Asian languages (Japanese, Korean, Chinese)
- Middle Eastern languages
- And many more

## Browser Compatibility

### Speech Recognition
- **Chrome**: Full support
- **Edge**: Full support
- **Safari**: Limited support (iOS 14.5+)
- **Firefox**: Limited support

### Text-to-Speech
- **All Modern Browsers**: Full support
- **Mobile Browsers**: Full support

## Usage Examples

### Basic Voice Chatbot
```php
[omnix_chatbot 
    bot_id="123" 
    access_token="your_token"
    enable_voice="true"
]
```

### Advanced Voice Configuration
```php
[omnix_chatbot 
    bot_id="123" 
    access_token="your_token"
    enable_voice="true"
    voice_language="es-ES"
    auto_speak="true"
    voice_rate="1.2"
    voice_pitch="0.9"
    voice_volume="0.8"
]
```

### Continuous Voice Recognition
```php
[omnix_chatbot 
    bot_id="123" 
    access_token="your_token"
    enable_voice="true"
    voice_continuous="true"
    voice_interim_results="true"
]
```

## Admin Settings

### Voice Settings Panel
Access the voice settings in WordPress Admin:
1. Go to **OmniX Chatbot** → **Settings**
2. Scroll to the **Voice Settings** section
3. Configure default voice parameters
4. Save settings

### Global Voice Configuration
- **Default Language**: Set the default language for all chatbots
- **Default Rate**: Set the default speech rate
- **Default Pitch**: Set the default voice pitch
- **Default Volume**: Set the default voice volume
- **Auto-Speak**: Enable automatic speech for all responses

## JavaScript API

### Manual Initialization
```javascript
const chatbot = new OmniXChatbotWidget({
    botId: '123',
    accessToken: 'your_token',
    enableVoice: true,
    voiceLanguage: 'en-US',
    autoSpeak: false,
    voiceRate: 1.0,
    voicePitch: 1.0,
    voiceVolume: 1.0
});
```

### Voice Control Methods
```javascript
// Start voice recognition
chatbot.toggleVoiceRecognition();

// Speak text
chatbot.speakText('Hello, how can I help you?');

// Check if voice is supported
if (chatbot.isVoiceSupported) {
    console.log('Voice features are available');
}
```

## Troubleshooting

### Voice Not Working
1. **Check Browser Support**: Ensure your browser supports Web Speech API
2. **Check HTTPS**: Voice features require HTTPS in production
3. **Check Permissions**: Ensure microphone permissions are granted
4. **Check Language**: Verify the language code is correct

### Common Issues
- **No Microphone Access**: User needs to grant microphone permissions
- **Voice Not Recognized**: Check language settings and speak clearly
- **No Sound Output**: Check browser volume and voice settings
- **Intermittent Issues**: Try refreshing the page or clearing browser cache

## Security Considerations

### Privacy
- Voice data is processed locally in the browser
- No voice recordings are stored on the server
- Speech recognition uses browser's built-in APIs

### HTTPS Requirement
- Voice features require HTTPS in production
- Local development (localhost) works with HTTP
- Always use HTTPS for live websites

## Performance Tips

### Optimization
- Disable voice features if not needed to improve performance
- Use appropriate voice settings for your use case
- Test voice features on different devices and browsers

### Mobile Considerations
- Voice features work well on mobile devices
- Consider battery usage for continuous voice recognition
- Test on different mobile browsers

## Advanced Configuration

### Custom Voice Settings
```javascript
// Custom voice configuration
const customConfig = {
    enableVoice: true,
    voiceLanguage: 'en-US',
    autoSpeak: true,
    voiceRate: 1.1,
    voicePitch: 0.95,
    voiceVolume: 0.9,
    voiceContinuous: false,
    voiceInterimResults: true
};
```

### Event Handling
```javascript
// Listen for voice events
chatbot.recognition.onstart = () => {
    console.log('Voice recognition started');
};

chatbot.recognition.onresult = (event) => {
    console.log('Voice recognized:', event.results[0][0].transcript);
};

chatbot.recognition.onerror = (event) => {
    console.error('Voice recognition error:', event.error);
};
```

## Support

For technical support or feature requests related to voice functionality:
1. Check the troubleshooting section above
2. Review browser compatibility requirements
3. Test with different voice settings
4. Contact support with specific error details

## Changelog

### Version 1.0.0
- Initial voice features implementation
- Speech recognition support
- Text-to-speech synthesis
- Multi-language support
- Admin settings panel
- Shortcode parameters
- JavaScript API
