"use client"

import { ResponseModelProvider } from "@/hooks/use-response-model"
import { AdaptiveChatInterface } from "./adaptive-chat-interface"

interface SmartChatWrapperProps {
  botId: number
  conversationId?: number
  userId?: number
  onConversationUpdate?: (conversationId: number) => void
  className?: string
}

export function SmartChatWrapper(props: SmartChatWrapperProps) {
  return (
    <ResponseModelProvider defaultModel="chat">
      <AdaptiveChatInterface {...props} />
    </ResponseModelProvider>
  )
}

// Export the individual components for custom usage
export { AdaptiveChatInterface } from "./adaptive-chat-interface"
export { ResponseModelSelector } from "./response-model-selector"
export { useResponseModel, useResponseModelState } from "@/hooks/use-response-model"
