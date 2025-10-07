(function() {
    'use strict';
    
    // Configuration from window.omnixChatbot
    const config = window.omnixChatbot || {};
    const apiUrl = config.apiUrl || 'https://68904f022ec3.ngrok-free.app';
    const botId = config.botId || 'auto';
    const accessToken = config.accessToken;
    const autoOpen = config.autoOpen || false;
    const position = config.position || 'bottom-right';
    const theme = config.theme || 'modern';
    
    if (!accessToken) {
        console.warn('OmniX Chatbot: Access token not provided');
                return;
            }
            
    // Create chatbot widget
    const widget = document.createElement('div');
    widget.id = 'omnix-chatbot-widget';
    widget.innerHTML = `
        <div class="omnix-chatbot-container">
            <div class="omnix-chatbot-header">
                <div class="omnix-chatbot-title">
                    <span class="omnix-chatbot-icon">🤖</span>
                    <span>AI Assistant</span>
                </div>
                <button class="omnix-chatbot-close" onclick="toggleChatbot()">×</button>
            </div>
            <div class="omnix-chatbot-messages" id="omnix-messages"></div>
            <div class="omnix-chatbot-input-container">
                <input type="text" id="omnix-input" placeholder="Ask me anything..." onkeypress="handleKeyPress(event)">
                <button onclick="sendMessage()" class="omnix-chatbot-send">Send</button>
            </div>
        </div>
        <button class="omnix-chatbot-toggle" onclick="toggleChatbot()">
            <span class="omnix-chatbot-icon">💬</span>
        </button>
    `;
    
    // Add styles
    const styles = document.createElement('style');
    styles.textContent = `
        #omnix-chatbot-widget {
                position: fixed;
            ${position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
            ${position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
                z-index: 9999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .omnix-chatbot-container {
                width: 350px;
                height: 500px;
                background: white;
                border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
                display: none;
                flex-direction: column;
                overflow: hidden;
            border: 1px solid #e1e5e9;
        }
        
        .omnix-chatbot-container.open {
            display: flex;
        }
        
        .omnix-chatbot-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .omnix-chatbot-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 600;
        }
        
        .omnix-chatbot-close {
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .omnix-chatbot-messages {
                flex: 1;
                padding: 16px;
                overflow-y: auto;
                background: #f8f9fa;
        }
        
        .omnix-message {
            margin-bottom: 12px;
            padding: 12px;
            border-radius: 12px;
            max-width: 80%;
            word-wrap: break-word;
        }
        
        .omnix-message.user {
            background: #007bff;
            color: white;
            margin-left: auto;
            text-align: right;
        }
        
        .omnix-message.bot {
            background: white;
            color: #333;
            border: 1px solid #e1e5e9;
        }
        
        .omnix-chatbot-input-container {
                padding: 16px;
                background: white;
            border-top: 1px solid #e1e5e9;
                display: flex;
                gap: 8px;
        }
        
        #omnix-input {
                flex: 1;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 8px;
                outline: none;
                font-size: 14px;
        }
        
        #omnix-input:focus {
            border-color: #007bff;
        }
        
        .omnix-chatbot-send {
            background: #007bff;
            color: white;
            border: none;
            padding: 12px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
        }
        
        .omnix-chatbot-send:hover {
            background: #0056b3;
        }
        
        .omnix-chatbot-toggle {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
                border-radius: 50%;
                color: white;
            font-size: 24px;
                cursor: pointer;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
                display: flex;
                align-items: center;
                justify-content: center;
            transition: transform 0.2s;
        }
        
        .omnix-chatbot-toggle:hover {
            transform: scale(1.05);
        }
        
        .omnix-typing {
            display: flex;
            align-items: center;
            gap: 4px;
            color: #666;
            font-style: italic;
        }
        
        .omnix-typing-dots {
            display: inline-block;
            width: 4px;
            height: 4px;
            background: #666;
            border-radius: 50%;
            animation: typing 1.4s infinite;
        }
        
        .omnix-typing-dots:nth-child(2) {
            animation-delay: 0.2s;
        }
        
        .omnix-typing-dots:nth-child(3) {
            animation-delay: 0.4s;
        }
        
        @keyframes typing {
            0%, 60%, 100% {
                transform: translateY(0);
            }
            30% {
                transform: translateY(-10px);
            }
        }
        
        @media (max-width: 480px) {
            .omnix-chatbot-container {
                width: calc(100vw - 40px);
                height: calc(100vh - 40px);
                max-height: 500px;
            }
        }
    `;
    
    document.head.appendChild(styles);
    document.body.appendChild(widget);
    
    // Global functions
    window.toggleChatbot = function() {
        const container = document.querySelector('.omnix-chatbot-container');
        container.classList.toggle('open');
        
        if (container.classList.contains('open')) {
            document.getElementById('omnix-input').focus();
        }
    };
    
    window.sendMessage = function() {
        const input = document.getElementById('omnix-input');
        const message = input.value.trim();
        
            if (!message) return;
            
        // Add user message
        addMessage(message, 'user');
        input.value = '';
            
            // Show typing indicator
        showTyping();
        
        // Send to API
        fetch(`${apiUrl}/api/chat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                'ngrok-skip-browser-warning': 'true'
                    },
                    body: JSON.stringify({
                        message: message,
                botId: botId,
                context: 'wordpress'
            })
        })
        .then(response => response.json())
        .then(data => {
            hideTyping();
            if (data.success && data.message) {
                addMessage(data.message, 'bot');
            } else if (data.response) {
                addMessage(data.response, 'bot');
                } else {
                addMessage('Sorry, I encountered an error. Please try again.', 'bot');
                }
        })
        .catch(error => {
            hideTyping();
                console.error('Chatbot error:', error);
            addMessage('Sorry, I encountered an error. Please try again.', 'bot');
        });
    };
    
    window.handleKeyPress = function(event) {
        if (event.key === 'Enter') {
            sendMessage();
        }
    };
    
    function addMessage(text, sender) {
        const messagesContainer = document.getElementById('omnix-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `omnix-message ${sender}`;
        messageDiv.textContent = text;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    function showTyping() {
        const messagesContainer = document.getElementById('omnix-messages');
        const typingDiv = document.createElement('div');
        typingDiv.id = 'omnix-typing-indicator';
        typingDiv.className = 'omnix-typing';
        typingDiv.innerHTML = 'AI is typing<span class="omnix-typing-dots"></span><span class="omnix-typing-dots"></span><span class="omnix-typing-dots"></span>';
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    function hideTyping() {
        const typingIndicator = document.getElementById('omnix-typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    // Auto-open if configured
    if (autoOpen) {
        setTimeout(() => {
            toggleChatbot();
        }, 1000);
    }
    
    // Add welcome message
    setTimeout(() => {
        addMessage('Hello! I\'m your AI assistant. How can I help you today?', 'bot');
    }, 500);
    
})();
