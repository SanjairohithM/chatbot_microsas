/**
 * Universal Chatbot Widget Script
 * This script can be embedded on any website to display a chatbot widget
 * 
 * Usage:
 * <script src="https://your-domain.com/widgets/chatbot-widget.js"></script>
 * <script>
 *   ChatbotWidget.init({
 *     botId: 'your-bot-id',
 *     primaryColor: '#3b82f6',
 *     secondaryColor: '#1e40af',
 *     position: 'bottom-right',
 *     size: 'medium',
 *     showAvatar: true,
 *     showTitle: true,
 *     autoOpen: false,
 *     apiUrl: 'https://your-domain.com/api/chat'
 *   });
 * </script>
 */

(function(global) {
  'use strict';

  // Configuration defaults
  const DEFAULT_CONFIG = {
    primaryColor: '#3b82f6',
    secondaryColor: '#1e40af',
    position: 'bottom-right',
    size: 'medium',
    showAvatar: true,
    showTitle: true,
    autoOpen: false,
    apiUrl: 'https://your-domain.com/api/chat'
  };

  // Widget state
  let config = {};
  let isOpen = false;
  let isMinimized = false;
  let messages = [];
  let isLoading = false;
  let conversationId = null;
  let widgetElement = null;

  // Position mappings
  const POSITIONS = {
    'bottom-right': 'bottom: 20px; right: 20px;',
    'bottom-left': 'bottom: 20px; left: 20px;',
    'top-right': 'top: 20px; right: 20px;',
    'top-left': 'top: 20px; left: 20px;'
  };

  // Size mappings
  const SIZES = {
    small: 'width: 300px; height: 400px;',
    medium: 'width: 350px; height: 500px;',
    large: 'width: 400px; height: 600px;'
  };

  // Initialize the widget
  function init(userConfig) {
    config = { ...DEFAULT_CONFIG, ...userConfig };
    isOpen = config.autoOpen;
    
    if (!config.botId) {
      console.error('ChatbotWidget: botId is required');
      return;
    }

    createWidget();
    addStyles();
  }

  // Create the widget HTML structure
  function createWidget() {
    widgetElement = document.createElement('div');
    widgetElement.id = `chatbot-widget-${config.botId}`;
    widgetElement.style.cssText = `
      position: fixed;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.4;
      ${POSITIONS[config.position] || POSITIONS['bottom-right']}
    `;

    document.body.appendChild(widgetElement);
    renderWidget();
  }

  // Render the widget content
  function renderWidget() {
    if (!widgetElement) return;

    if (!isOpen) {
      renderButton();
    } else {
      renderChatWindow();
    }
  }

  // Render the chat button
  function renderButton() {
    widgetElement.innerHTML = `
      <div class="chatbot-button" style="
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background-color: ${config.primaryColor};
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
    `;
    
    widgetElement.querySelector('.chatbot-button').onclick = () => {
      isOpen = true;
      renderWidget();
    };
  }

  // Render the chat window
  function renderChatWindow() {
    const sizeStyle = SIZES[config.size] || SIZES.medium;
    
    widgetElement.innerHTML = `
      <div class="chatbot-window" style="
        ${sizeStyle}
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        background: white;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border: 2px solid ${config.primaryColor};
      ">
        <!-- Header -->
        <div class="chatbot-header" style="
          background-color: ${config.primaryColor};
          color: white;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        ">
          <div style="display: flex; align-items: center; gap: 8px;">
            ${config.showAvatar ? `
              <div style="
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background-color: ${config.secondaryColor};
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: 600;
                font-size: 14px;
              ">
                ${config.botName ? config.botName.charAt(0).toUpperCase() : 'B'}
              </div>
            ` : ''}
            ${config.showTitle ? `
              <div>
                <div style="font-weight: 600; font-size: 14px;">${config.botName || 'Chatbot'}</div>
                <div style="font-size: 12px; opacity: 0.8;">Online</div>
              </div>
            ` : ''}
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
              ${isMinimized ? '⤢' : '⤡'}
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
        
        ${!isMinimized ? `
          <!-- Messages -->
          <div class="chatbot-messages" style="
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 12px;
          ">
            ${messages.length === 0 ? `
              <div style="text-align: center; color: #666; font-size: 13px; padding: 20px;">
                Hi! I'm ${config.botName || 'your assistant'}. How can I help you today?
              </div>
            ` : messages.map(msg => `
              <div style="display: flex; ${msg.role === 'user' ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}">
                <div style="
                  max-width: 80%;
                  padding: 8px 12px;
                  border-radius: 12px;
                  font-size: 13px;
                  ${msg.role === 'user' 
                    ? `background-color: ${config.primaryColor}; color: white;`
                    : 'background-color: #f1f3f4; color: #333;'
                  }
                ">
                  ${escapeHtml(msg.content)}
                </div>
              </div>
            `).join('')}
            ${isLoading ? `
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
            ` : ''}
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
            " onkeypress="if(event.key==='Enter') ChatbotWidget.sendMessage()">
            <button class="send-btn" style="
              width: 36px;
              height: 36px;
              border: none;
              border-radius: 50%;
              background-color: ${config.primaryColor};
              color: white;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
            " onclick="ChatbotWidget.sendMessage()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        ` : ''}
      </div>
    `;

    // Add event listeners
    const closeBtn = widgetElement.querySelector('.close-btn');
    const minimizeBtn = widgetElement.querySelector('.minimize-btn');
    
    if (closeBtn) {
      closeBtn.onclick = () => {
        isOpen = false;
        renderWidget();
      };
    }
    
    if (minimizeBtn) {
      minimizeBtn.onclick = () => {
        isMinimized = !isMinimized;
        renderWidget();
      };
    }

    // Scroll to bottom
    const messagesContainer = widgetElement.querySelector('.chatbot-messages');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  // Send message function
  function sendMessage() {
    const input = widgetElement?.querySelector('.message-input');
    if (!input) return;
    
    const message = input.value.trim();
    if (!message || isLoading) return;
    
    input.value = '';
    isLoading = true;
    messages.push({ role: 'user', content: message });
    renderWidget();
    
    // Scroll to bottom
    const messagesContainer = widgetElement?.querySelector('.chatbot-messages');
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
      const messagesContainer = widgetElement?.querySelector('.chatbot-messages');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    })
    .catch(error => {
      console.error('ChatbotWidget Error:', error);
      isLoading = false;
      messages.push({ role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' });
      renderWidget();
    });
  }

  // Add CSS styles
  function addStyles() {
    if (document.getElementById('chatbot-widget-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'chatbot-widget-styles';
    style.textContent = `
      @keyframes bounce {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1); }
      }
      
      .chatbot-widget * {
        box-sizing: border-box;
      }
      
      .chatbot-widget input:focus {
        border-color: ${config.primaryColor} !important;
        box-shadow: 0 0 0 2px ${config.primaryColor}20 !important;
      }
    `;
    document.head.appendChild(style);
  }

  // Utility function to escape HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Public API
  const ChatbotWidget = {
    init: init,
    sendMessage: sendMessage,
    open: () => {
      isOpen = true;
      renderWidget();
    },
    close: () => {
      isOpen = false;
      renderWidget();
    },
    toggle: () => {
      isOpen = !isOpen;
      renderWidget();
    },
    destroy: () => {
      if (widgetElement) {
        widgetElement.remove();
        widgetElement = null;
      }
    }
  };

  // Expose to global scope
  global.ChatbotWidget = ChatbotWidget;

  // Auto-initialize if config is provided via data attributes
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  function autoInit() {
    const script = document.querySelector('script[src*="chatbot-widget.js"]');
    if (script) {
      const botId = script.getAttribute('data-bot-id');
      const primaryColor = script.getAttribute('data-primary-color');
      const secondaryColor = script.getAttribute('data-secondary-color');
      const position = script.getAttribute('data-position');
      const size = script.getAttribute('data-size');
      const showAvatar = script.getAttribute('data-show-avatar');
      const showTitle = script.getAttribute('data-show-title');
      const autoOpen = script.getAttribute('data-auto-open');
      const apiUrl = script.getAttribute('data-api-url');
      const botName = script.getAttribute('data-bot-name');

      if (botId) {
        const autoConfig = {
          botId: botId,
          primaryColor: primaryColor || DEFAULT_CONFIG.primaryColor,
          secondaryColor: secondaryColor || DEFAULT_CONFIG.secondaryColor,
          position: position || DEFAULT_CONFIG.position,
          size: size || DEFAULT_CONFIG.size,
          showAvatar: showAvatar !== 'false',
          showTitle: showTitle !== 'false',
          autoOpen: autoOpen === 'true',
          apiUrl: apiUrl || DEFAULT_CONFIG.apiUrl,
          botName: botName
        };
        
        init(autoConfig);
      }
    }
  }

})(typeof window !== 'undefined' ? window : this);

