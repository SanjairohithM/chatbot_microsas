# Voice Features Implementation

This document describes the complete voice conversation implementation for the chatbot application, including Text-to-Speech (TTS) and Speech-to-Speech (STS) functionality.

## 🎯 Features Implemented

### 1. Text-to-Speech (TTS)
- **API Route**: `/api/audio/tts`
- **Functionality**: Converts text responses to natural-sounding speech
- **Voice Options**: Multiple OpenAI voices (alloy, verse, shimmer, etc.)
- **Integration**: Automatic TTS for bot responses in chat messages

### 2. Speech-to-Text (STT)
- **API Route**: `/api/audio/stt`
- **Functionality**: Converts user voice input to text
- **Model**: OpenAI Whisper for high accuracy
- **Integration**: Voice input in chat interface

### 3. Speech-to-Speech (STS)
- **API Route**: `/api/voice-conversation`
- **Functionality**: Complete voice conversation flow
- **Process**: Voice → Text → AI Processing → Text → Voice
- **Features**: Real-time conversation with voice feedback

## 📁 Files Created/Modified

### New Files
- `hooks/use-voice-chat.tsx` - React hook for voice interactions
- `components/dashboard/voice-chat-input.tsx` - Enhanced chat input with voice controls
- `components/dashboard/voice-conversation.tsx` - Complete voice conversation component
- `app/api/voice-conversation/route.ts` - STS API endpoint
- `app/voice-demo/page.tsx` - Demo page for voice features

### Modified Files
- `components/dashboard/chat-message.tsx` - Added TTS playback controls
- `app/api/audio/tts/route.ts` - Already existed, enhanced
- `app/api/audio/stt/route.ts` - Already existed, enhanced

## 🚀 Usage Examples

### Basic TTS Usage
```tsx
import { useVoiceChat } from '@/hooks/use-voice-chat'

function MyComponent() {
  const { speak, isSpeaking } = useVoiceChat()
  
  const handleSpeak = () => {
    speak("Hello, this is a test message")
  }
  
  return (
    <button onClick={handleSpeak} disabled={isSpeaking}>
      {isSpeaking ? 'Speaking...' : 'Speak'}
    </button>
  )
}
```

### Voice Chat Input
```tsx
import { VoiceChatInput } from '@/components/dashboard/voice-chat-input'

function ChatInterface() {
  const [voiceMode, setVoiceMode] = useState(false)
  
  return (
    <VoiceChatInput
      onSendMessage={(message) => console.log(message)}
      isLoading={false}
      botId={1}
      enableVoiceMode={voiceMode}
      onVoiceModeToggle={setVoiceMode}
    />
  )
}
```

### Complete Voice Conversation
```tsx
import { VoiceConversation } from '@/components/dashboard/voice-conversation'

function VoiceChatPage() {
  return (
    <VoiceConversation 
      botId={1}
      onConversationUpdate={(id) => console.log('New conversation:', id)}
    />
  )
}
```

## 🔧 API Endpoints

### POST /api/audio/tts
Converts text to speech audio.

**Request:**
```json
{
  "text": "Hello world",
  "voice": "alloy",
  "model": "tts-1",
  "format": "mp3"
}
```

**Response:** Audio file (MP3)

### POST /api/audio/stt
Converts speech audio to text.

**Request:** Multipart form data with audio file

**Response:**
```json
{
  "text": "Hello world"
}
```

### POST /api/voice-conversation
Complete voice conversation processing.

**Request:** Multipart form data with:
- `audio`: Audio file
- `botId`: Bot ID
- `conversationId`: Optional conversation ID
- `userId`: Optional user ID
- `voice`: Voice preference

**Response:**
```json
{
  "success": true,
  "text": "AI response text",
  "audio": "base64_encoded_audio",
  "conversationId": 123,
  "transcription": "User's transcribed text",
  "usage": { "total_tokens": 150 }
}
```

## 🎨 UI Components

### Voice Controls
- **Microphone Button**: Start/stop recording
- **Speaker Button**: Play/pause TTS
- **Voice Mode Toggle**: Switch between text and voice modes
- **Status Indicators**: Recording, processing, speaking states

### Visual Feedback
- **Recording**: Red pulsing indicator
- **Processing**: Blue spinning indicator  
- **Speaking**: Green pulsing indicator
- **Error States**: Red error messages with dismiss option

## 🔒 Security & Permissions

### Browser Permissions
- **Microphone Access**: Required for voice recording
- **Audio Playback**: Automatic for TTS responses

### Error Handling
- Permission denied scenarios
- Network connectivity issues
- Audio processing failures
- Timeout handling (30s for STT, 60s for full conversation)

## 🌐 Browser Compatibility

### Supported Features
- **MediaRecorder API**: Modern browsers
- **Web Audio API**: For audio playback
- **File API**: For audio file handling

### Fallbacks
- Graceful degradation for unsupported browsers
- Clear error messages for missing features
- Alternative text input when voice unavailable

## 📱 Mobile Considerations

### Touch Interface
- Large touch targets for voice buttons
- Visual feedback for touch interactions
- Responsive design for mobile screens

### Performance
- Optimized audio compression
- Efficient memory usage
- Background processing for audio

## 🧪 Testing

### Demo Page
Visit `/voice-demo` to test all voice features:
- Voice conversation interface
- Feature explanations
- Usage instructions
- Live testing environment

### Test Scenarios
1. **Basic TTS**: Text to speech conversion
2. **Basic STT**: Speech to text conversion  
3. **Full STS**: Complete voice conversation
4. **Error Handling**: Permission denied, network errors
5. **Mobile Testing**: Touch interface and responsiveness

## 🔮 Future Enhancements

### Planned Features
- **Voice Cloning**: Custom voice models
- **Language Support**: Multiple languages
- **Voice Commands**: Special voice commands
- **Audio Effects**: Background music, sound effects
- **Conversation Analytics**: Voice interaction metrics

### Technical Improvements
- **Streaming Audio**: Real-time audio streaming
- **Noise Cancellation**: Enhanced audio quality
- **Voice Activity Detection**: Automatic recording start/stop
- **Audio Compression**: Better compression algorithms

## 📚 Dependencies

### Required Packages
- `openai`: For TTS and STT APIs
- `react`: For UI components
- `lucide-react`: For icons
- `@/components/ui/*`: UI component library

### Environment Variables
```env
OPENAI_API_KEY=your_openai_api_key
```

## 🚨 Troubleshooting

### Common Issues
1. **Microphone not working**: Check browser permissions
2. **No audio playback**: Check browser audio settings
3. **Poor transcription**: Speak clearly, reduce background noise
4. **Network errors**: Check internet connection and API keys

### Debug Mode
Enable console logging for detailed debugging:
```javascript
// In browser console
localStorage.setItem('voice-debug', 'true')
```

## 📄 License

This implementation follows the same license as the main project.
