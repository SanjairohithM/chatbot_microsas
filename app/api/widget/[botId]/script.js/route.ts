import { NextRequest, NextResponse } from 'next/server'
import { getBotById } from '@/lib/services/bot.service'

export async function GET(
  request: NextRequest,
  { params }: { params: { botId: string } }
) {
  try {
    const botId = parseInt(params.botId)
    if (isNaN(botId)) {
      return new NextResponse('Invalid bot ID', { status: 400 })
    }

    // Get bot configuration
    const bot = await getBotById(botId)
    if (!bot) {
      return new NextResponse('Bot not found', { status: 404 })
    }

    // Get configuration from script tag data attribute
    const url = new URL(request.url)
    const configParam = url.searchParams.get('config')
    let config = {}
    
    if (configParam) {
      try {
        config = JSON.parse(decodeURIComponent(configParam))
      } catch (e) {
        console.error('Invalid config parameter:', e)
      }
    }

    // Generate the widget script
    const widgetScript = generateWidgetScript(bot, config)

    return new NextResponse(widgetScript, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })
  } catch (error) {
    console.error('Error generating widget script:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

function generateWidgetScript(bot: any, config: any) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  return `
(function() {
  'use strict';
  
  // Configuration
  const config = {
    botId: ${bot.id},
    primaryColor: '${config.primaryColor || '#3b82f6'}',
    secondaryColor: '${config.secondaryColor || '#1e40af'}',
    position: '${config.position || 'bottom-right'}',
    size: '${config.size || 'medium'}',
    showAvatar: ${config.showAvatar !== false},
    showTitle: ${config.showTitle !== false},
    autoOpen: ${config.autoOpen || false},
    apiUrl: '${baseUrl}/api/chat',
    embedUrl: '${baseUrl}/embed/${bot.id}'
  };

  // Widget state
  let isOpen = config.autoOpen;
  let isMinimized = false;
  let messages = [];
  let isLoading = false;
  let conversationId = null;

  // Create widget HTML
  function createWidget() {
    const widget = document.createElement('div');
    widget.id = 'chatbot-widget-${bot.id}';
    widget.style.cssText = \`
      position: fixed;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.4;
    \`;

    // Position the widget
    const positions = {
      'bottom-right': 'bottom: 20px; right: 20px;',
      'bottom-left': 'bottom: 20px; left: 20px;',
      'top-right': 'top: 20px; right: 20px;',
      'top-left': 'top: 20px; left: 20px;'
    };
    widget.style.cssText += positions[config.position] || positions['bottom-right'];

    document.body.appendChild(widget);
    renderWidget();
  }

  // Render widget content
  function renderWidget() {
    const widget = document.getElementById('chatbot-widget-${bot.id}');
    if (!widget) return;

    if (!isOpen) {
      // Show chat button
      widget.innerHTML = \`
        <div class="chatbot-button" style="
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background-color: \${config.primaryColor};
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          transition: transform 0.2s ease;
        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          </svg>
        </div>
      \`;
      
      widget.querySelector('.chatbot-button').onclick = () => {
        isOpen = true;
        renderWidget();
      };
    } else {
      // Show chat window
      const sizeStyles = {
        small: 'width: 300px; height: 400px;',
        medium: 'width: 350px; height: 500px;',
        large: 'width: 400px; height: 600px;'
      };
      
      widget.innerHTML = \`
        <div class="chatbot-window" style="
          \${sizeStyles[config.size] || sizeStyles.medium}
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12);
          background: white;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 2px solid \${config.primaryColor};
        ">
          <!-- Header -->
          <div class="chatbot-header" style="
            background-color: \${config.primaryColor};
            color: white;
            padding: 12px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          ">
            <div style="display: flex; align-items: center; gap: 8px;">
              \${config.showAvatar ? \`
                <div style="
                  width: 32px;
                  height: 32px;
                  border-radius: 50%;
                  background-color: \${config.secondaryColor};
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  font-weight: 600;
                  font-size: 14px;
                ">
                  ${bot.name.charAt(0).toUpperCase()}
                </div>
              \` : ''}
              \${config.showTitle ? \`
                <div>
                  <div style="font-weight: 600; font-size: 14px;">${bot.name}</div>
                  <div style="font-size: 12px; opacity: 0.8;">Online</div>
                </div>
              \` : ''}
            </div>
            <div style="display: flex; gap: 4px;">
              <button class="minimize-btn" style="
                width: 24px;
                height: 24px;
                border: none;
                background: none;
                color: white;
                cursor: pointer;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
              " onmouseover="this.style.backgroundColor='rgba(255,255,255,0.2)'" onmouseout="this.style.backgroundColor='transparent'">
                \${isMinimized ? '⤢' : '⤡'}
              </button>
              <button class="close-btn" style="
                width: 24px;
                height: 24px;
                border: none;
                background: none;
                color: white;
                cursor: pointer;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
              " onmouseover="this.style.backgroundColor='rgba(255,255,255,0.2)'" onmouseout="this.style.backgroundColor='transparent'">
                ✕
              </button>
            </div>
          </div>
          
          \${!isMinimized ? \`
            <!-- Messages -->
            <div class="chatbot-messages" style="
              flex: 1;
              padding: 16px;
              overflow-y: auto;
              display: flex;
              flex-direction: column;
              gap: 12px;
            ">
              \${messages.length === 0 ? \`
                <div style="text-align: center; color: #666; font-size: 13px; padding: 20px;">
                  Hi! I'm ${bot.name}. How can I help you today?
                </div>
              \` : messages.map(msg => \`
                <div style="display: flex; \${msg.role === 'user' ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}">
                  <div style="
                    max-width: 80%;
                    padding: 8px 12px;
                    border-radius: 12px;
                    font-size: 13px;
                    \${msg.role === 'user' 
                      ? \`background-color: \${config.primaryColor}; color: white;\`
                      : 'background-color: #f1f3f4; color: #333;'
                    }
                  ">
                    \${msg.content}
                  </div>
                </div>
              \`).join('')}
              \${isLoading ? \`
                <div style="display: flex; justify-content: flex-start;">
                  <div style="
                    background-color: #f1f3f4;
                    padding: 8px 12px;
                    border-radius: 12px;
                    display: flex;
                    gap: 4px;
                  ">
                    <div style="width: 6px; height: 6px; background-color: #999; border-radius: 50%; animation: bounce 1.4s infinite ease-in-out both;"></div>
                    <div style="width: 6px; height: 6px; background-color: #999; border-radius: 50%; animation: bounce 1.4s infinite ease-in-out both; animation-delay: 0.16s;"></div>
                    <div style="width: 6px; height: 6px; background-color: #999; border-radius: 50%; animation: bounce 1.4s infinite ease-in-out both; animation-delay: 0.32s;"></div>
                  </div>
                </div>
              \` : ''}
            </div>
            
            <!-- Input -->
            <div class="chatbot-input" style="
              padding: 16px;
              border-top: 1px solid #e0e0e0;
              display: flex;
              gap: 8px;
            ">
              <input type="text" class="message-input" placeholder="Type your message..." style="
                flex: 1;
                padding: 8px 12px;
                border: 1px solid #ddd;
                border-radius: 20px;
                outline: none;
                font-size: 13px;
              " onkeypress="if(event.key==='Enter') sendMessage()">
              <button class="send-btn" style="
                width: 36px;
                height: 36px;
                border: none;
                border-radius: 50%;
                background-color: \${config.primaryColor};
                color: white;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
              " onclick="sendMessage()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </button>
            </div>
          \` : ''}
        </div>
      \`;

      // Add event listeners
      widget.querySelector('.close-btn').onclick = () => {
        isOpen = false;
        renderWidget();
      };
      
      widget.querySelector('.minimize-btn').onclick = () => {
        isMinimized = !isMinimized;
        renderWidget();
      };
    }
  }

  // Send message function
  window.sendMessage = function() {
    const input = document.querySelector('.message-input');
    const message = input.value.trim();
    if (!message || isLoading) return;
    
    input.value = '';
    isLoading = true;
    messages.push({ role: 'user', content: message });
    renderWidget();
    
    // Scroll to bottom
    const messagesContainer = document.querySelector('.chatbot-messages');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Send to API
    fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        botId: config.botId,
        message: message,
        conversationId: conversationId
      })
    })
    .then(response => response.json())
    .then(data => {
      isLoading = false;
      if (data.success) {
        messages.push({ role: 'assistant', content: data.message });
        if (data.conversationId) {
          conversationId = data.conversationId;
        }
      } else {
        messages.push({ role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' });
      }
      renderWidget();
      
      // Scroll to bottom
      const messagesContainer = document.querySelector('.chatbot-messages');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    })
    .catch(error => {
      console.error('Error:', error);
      isLoading = false;
      messages.push({ role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' });
      renderWidget();
    });
  };

  // Add CSS animations
  const style = document.createElement('style');
  style.textContent = \`
    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }
  \`;
  document.head.appendChild(style);

  // Initialize widget when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }
})();
`
}

