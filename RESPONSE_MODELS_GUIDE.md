# Response Models Implementation Guide

This guide explains how to use the new Response Models system that allows users to choose between **Voice Response** and **Chat Response** modes.

## 🎯 Overview

The Response Models system provides two distinct interaction modes:

1. **Voice Response Model** - Bot responds with natural speech (TTS)
2. **Chat Response Model** - Bot responds with text messages

## 🚀 Quick Start

### 1. **Demo Pages**
Visit these URLs to see the system in action:
- **Response Models Demo**: `http://localhost:3000/response-models-demo`
- **Voice Demo**: `http://localhost:3000/voice-demo`

### 2. **Basic Integration**
Replace your existing chat component with the smart wrapper:

```tsx
import { SmartChatWrapper } from '@/components/dashboard/smart-chat-wrapper'

function YourChatPage() {
  return (
    <SmartChatWrapper 
      botId={1}
      onConversationUpdate={(id) => console.log('New conversation:', id)}
    />
  )
}
```

## 🛠️ Components

### **ResponseModelSelector**
A UI component for selecting between response models:

```tsx
import { ResponseModelSelector } from '@/components/dashboard/response-model-selector'

function MyComponent() {
  const [model, setModel] = useState<'voice' | 'chat'>('chat')
  
  return (
    <ResponseModelSelector
      selectedModel={model}
      onModelChange={setModel}
    />
  )
}
```

### **AdaptiveChatInterface**
A complete chat interface that adapts based on the selected model:

```tsx
import { AdaptiveChatInterface } from '@/components/dashboard/adaptive-chat-interface'

function ChatPage() {
  return (
    <AdaptiveChatInterface
      botId={1}
      conversationId={123}
      userId={456}
      onConversationUpdate={(id) => console.log('Conversation updated:', id)}
    />
  )
}
```

### **SmartChatWrapper**
A wrapper that includes the response model provider:

```tsx
import { SmartChatWrapper } from '@/components/dashboard/smart-chat-wrapper'

// This automatically includes the ResponseModelProvider
<SmartChatWrapper botId={1} />
```

## 🎛️ State Management

### **useResponseModel Hook**
Access response model state in any component:

```tsx
import { useResponseModel } from '@/hooks/use-response-model'

function MyComponent() {
  const { 
    responseModel, 
    setResponseModel, 
    isVoiceMode, 
    isChatMode 
  } = useResponseModel()
  
  return (
    <div>
      <p>Current mode: {responseModel}</p>
      <button onClick={() => setResponseModel('voice')}>
        Switch to Voice
      </button>
    </div>
  )
}
```

### **useResponseModelState Hook**
Extended hook with helper functions:

```tsx
import { useResponseModelState } from '@/hooks/use-response-model'

function MyComponent() {
  const { 
    responseModel,
    switchToVoice,
    switchToChat,
    toggleModel,
    isVoiceMode,
    isChatMode
  } = useResponseModelState()
  
  return (
    <div>
      <button onClick={switchToVoice}>Voice Mode</button>
      <button onClick={switchToChat}>Chat Mode</button>
      <button onClick={toggleModel}>Toggle Mode</button>
    </div>
  )
}
```

## 🎨 UI Features

### **Voice Response Model**
- 🎤 **Microphone button** for voice input
- 🔊 **Speaker buttons** for TTS playback
- 🎵 **Audio controls** for managing playback
- 📱 **Visual indicators** for recording/speaking states

### **Chat Response Model**
- ⌨️ **Text input** for typing messages
- 💬 **Text responses** from the bot
- 📝 **Rich formatting** support
- ⚡ **Quick responses** without audio processing

## 🔧 Configuration

### **Model Persistence**
The selected model is automatically saved to localStorage and restored on page reload.

### **Default Model**
Set the default model when creating the provider:

```tsx
<ResponseModelProvider defaultModel="voice">
  <YourApp />
</ResponseModelProvider>
```

### **Custom Styling**
All components accept className props for custom styling:

```tsx
<ResponseModelSelector 
  className="my-custom-styles"
  selectedModel={model}
  onModelChange={setModel}
/>
```

## 📱 Responsive Design

### **Mobile Support**
- Touch-optimized voice controls
- Responsive model selector
- Mobile-friendly audio playback

### **Desktop Features**
- Keyboard shortcuts (Enter to send)
- Hover effects and animations
- Full feature set available

## 🔍 Testing

### **Manual Testing**
1. **Switch Models**: Use the model selector to switch between modes
2. **Voice Mode**: Test microphone recording and TTS playback
3. **Chat Mode**: Test text input and responses
4. **Persistence**: Refresh page to verify model is remembered

### **Automated Testing**
```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { ResponseModelSelector } from '@/components/dashboard/response-model-selector'

test('switches between models', () => {
  const mockOnChange = jest.fn()
  render(
    <ResponseModelSelector 
      selectedModel="chat" 
      onModelChange={mockOnChange} 
    />
  )
  
  fireEvent.click(screen.getByText('Voice Response'))
  expect(mockOnChange).toHaveBeenCalledWith('voice')
})
```

## 🚨 Troubleshooting

### **Common Issues**

1. **Model not switching**
   - Check if ResponseModelProvider is wrapping your components
   - Verify the onModelChange callback is working

2. **Voice not working**
   - Check microphone permissions
   - Verify TTS API is working
   - Check browser console for errors

3. **State not persisting**
   - Check if localStorage is available
   - Verify the provider is mounted correctly

### **Debug Mode**
Enable debug logging:

```tsx
// In your component
const { responseModel } = useResponseModel()
console.log('Current response model:', responseModel)
```

## 🔮 Advanced Usage

### **Custom Model Logic**
```tsx
function MyCustomComponent() {
  const { responseModel, setResponseModel } = useResponseModel()
  
  const handleModelChange = (newModel) => {
    // Custom logic before changing model
    if (newModel === 'voice') {
      // Check if microphone is available
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => setResponseModel('voice'))
        .catch(() => alert('Microphone not available'))
    } else {
      setResponseModel(newModel)
    }
  }
  
  return (
    <ResponseModelSelector
      selectedModel={responseModel}
      onModelChange={handleModelChange}
    />
  )
}
```

### **Conditional Rendering**
```tsx
function MyComponent() {
  const { isVoiceMode, isChatMode } = useResponseModel()
  
  return (
    <div>
      {isVoiceMode && <VoiceControls />}
      {isChatMode && <TextControls />}
    </div>
  )
}
```

## 📚 API Reference

### **ResponseModelSelector Props**
```tsx
interface ResponseModelSelectorProps {
  selectedModel: ResponseModel
  onModelChange: (model: ResponseModel) => void
  className?: string
}
```

### **AdaptiveChatInterface Props**
```tsx
interface AdaptiveChatInterfaceProps {
  botId: number
  conversationId?: number
  userId?: number
  onConversationUpdate?: (conversationId: number) => void
  className?: string
}
```

### **ResponseModel Type**
```tsx
type ResponseModel = 'voice' | 'chat'
```

## 🎉 Examples

### **Simple Integration**
```tsx
// pages/chat.tsx
import { SmartChatWrapper } from '@/components/dashboard/smart-chat-wrapper'

export default function ChatPage() {
  return (
    <div className="h-screen">
      <SmartChatWrapper botId={1} />
    </div>
  )
}
```

### **Custom Integration**
```tsx
// components/MyChat.tsx
import { ResponseModelProvider, AdaptiveChatInterface } from '@/components/dashboard'

export function MyChat() {
  return (
    <ResponseModelProvider defaultModel="voice">
      <div className="my-custom-chat">
        <AdaptiveChatInterface botId={1} />
      </div>
    </ResponseModelProvider>
  )
}
```

This implementation provides a complete, flexible system for managing different response modes in your chatbot application!
