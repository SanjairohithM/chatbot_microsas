(function() {
    'use strict';
    
    // Configuration from window.omnixChatbot
    const config = window.omnixChatbot || {};
    const apiUrl = config.apiUrl || ' https://e282694e5c26.ngrok-free.app';
    const botId = config.botId || 'auto';
    const accessToken = config.accessToken;
    const autoOpen = config.autoOpen || false;
    const position = config.position || 'bottom-right';
    const theme = config.theme || 'modern';
    
    // Voice configuration
    const voiceConfig = {
        enabled: config.enableVoice !== false,
        language: config.voiceLanguage || 'en-US',
        rate: config.voiceRate || 1.0,
        pitch: config.voicePitch || 1.0,
        volume: config.voiceVolume || 1.0,
        autoSpeak: config.autoSpeak || false,
        continuous: config.voiceContinuous || false,
        interimResults: config.voiceInterimResults || false
    };
    
    // Voice state
    let recognition = null;
    let isListening = false;
    let speechSynthesis = null;
    let currentUtterance = null;
    let isVoiceSupported = false;
    
    // Navigation state
    let isAutoNavigating = false;
    let navigationTimeout = null;
    
    if (!accessToken) {
        console.warn('OmniX Chatbot: Access token not provided');
        return;
    }
            
    // Get bot name from config or use default
    const botName = config.botName || 'Smart Assistant';
    
    // Create chatbot widget
    const widget = document.createElement('div');
    widget.id = 'omnix-chatbot-widget';
    widget.innerHTML = `
        <div class="omnix-chatbot-container">
            <div class="omnix-chatbot-header">
                <div class="omnix-chatbot-title">
                    <div class="omnix-chatbot-avatar">
                        <div class="omnix-avatar-circle">
                            <span class="omnix-avatar-text">${botName.charAt(0).toUpperCase()}</span>
                        </div>
                    </div>
                    <div class="omnix-title-content">
                        <span class="omnix-bot-name">${botName}</span>
                        <span class="omnix-status-indicator">Online</span>
                    </div>
                </div>
                <div class="omnix-header-actions">
                    <button class="omnix-minimize-btn" onclick="toggleMinimize()" title="Minimize">
                        <span class="omnix-minimize-icon">−</span>
                    </button>
                    <button class="omnix-chatbot-close" onclick="toggleChatbot()" title="Close">
                        <span class="omnix-close-icon">×</span>
                    </button>
                </div>
            </div>
            <div class="omnix-chatbot-messages" id="omnix-messages"></div>
            <div class="omnix-chatbot-input-container">
                <div class="omnix-input-wrapper">
                    <input type="text" id="omnix-input" placeholder="Type your message..." onkeypress="handleKeyPress(event)">
                    <div class="omnix-input-actions">
                        ${voiceConfig.enabled ? `
                            <button id="omnix-voice-mic" class="omnix-voice-btn" onclick="toggleVoiceInput()" title="Voice Input">
                                <span class="omnix-voice-icon">🎤</span>
                            </button>
                        ` : ''}
                        <button onclick="sendMessage()" class="omnix-send-btn">
                            <span class="omnix-send-icon">→</span>
                        </button>
                    </div>
                </div>
                ${voiceConfig.enabled ? `
                    <div class="omnix-voice-controls">
                        <button id="omnix-voice-speaker" class="omnix-voice-control-btn" onclick="toggleVoiceOutput()" title="Voice Output">
                            <span class="omnix-voice-icon">🔊</span>
                        </button>
                    </div>
                ` : ''}
            </div>
        </div>
        <button class="omnix-chatbot-toggle" onclick="toggleChatbot()">
            <div class="omnix-toggle-content">
                <div class="omnix-toggle-avatar">
                    <span class="omnix-toggle-text">${botName.charAt(0).toUpperCase()}</span>
                </div>
                <div class="omnix-toggle-badge">
                    <span class="omnix-badge-dot"></span>
                </div>
            </div>
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
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        
        .omnix-chatbot-container {
            width: 380px;
            height: 600px;
            background: #ffffff;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15), 0 8px 25px rgba(0, 0, 0, 0.1);
            display: none;
            flex-direction: column;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
        }
        
        .omnix-chatbot-container.open {
            display: flex;
            animation: slideUp 0.3s ease-out;
        }
        
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(20px) scale(0.95);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
        
        .omnix-chatbot-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: relative;
            overflow: hidden;
        }
        
        .omnix-chatbot-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 100%);
            pointer-events: none;
        }
        
        .omnix-chatbot-title {
            display: flex;
            align-items: center;
            gap: 12px;
            position: relative;
            z-index: 1;
        }
        
        .omnix-chatbot-avatar {
            position: relative;
        }
        
        .omnix-avatar-circle {
            width: 45px;
            height: 45px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid rgba(255, 255, 255, 0.3);
            backdrop-filter: blur(10px);
        }
        
        .omnix-avatar-text {
            font-size: 18px;
            font-weight: 700;
            color: white;
        }
        
        .omnix-title-content {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        
        .omnix-bot-name {
            font-size: 16px;
            font-weight: 600;
            color: white;
        }
        
        .omnix-status-indicator {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.8);
            display: flex;
            align-items: center;
            gap: 4px;
        }
        
        .omnix-status-indicator::before {
            content: '';
            width: 8px;
            height: 8px;
            background: #4ade80;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        
        .omnix-header-actions {
            display: flex;
            gap: 8px;
            position: relative;
            z-index: 1;
        }
        
        .omnix-minimize-btn, .omnix-chatbot-close {
            background: rgba(255, 255, 255, 0.1);
            border: none;
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            backdrop-filter: blur(10px);
        }
        
        .omnix-minimize-btn:hover, .omnix-chatbot-close:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: scale(1.05);
        }
        
        .omnix-minimize-icon, .omnix-close-icon {
            font-size: 16px;
            font-weight: 600;
        }
        
        .omnix-chatbot-messages {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
            scroll-behavior: smooth;
        }
        
        .omnix-chatbot-messages::-webkit-scrollbar {
            width: 4px;
        }
        
        .omnix-chatbot-messages::-webkit-scrollbar-track {
            background: transparent;
        }
        
        .omnix-chatbot-messages::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.1);
            border-radius: 2px;
        }
        
        .omnix-message {
            margin-bottom: 16px;
            padding: 16px 20px;
            border-radius: 18px;
            max-width: 85%;
            word-wrap: break-word;
            position: relative;
            animation: messageSlide 0.3s ease-out;
        }
        
        @keyframes messageSlide {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .omnix-message.user {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            margin-left: auto;
            text-align: right;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }
        
        .omnix-message.bot {
            background: white;
            color: #374151;
            border: 1px solid #e5e7eb;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }
        
        .omnix-chatbot-input-container {
            padding: 20px;
            background: white;
            border-top: 1px solid #f1f5f9;
        }
        
        .omnix-input-wrapper {
            display: flex;
            align-items: center;
            background: #f8fafc;
            border: 2px solid #e2e8f0;
            border-radius: 25px;
            padding: 8px 12px;
            transition: all 0.2s ease;
        }
        
        .omnix-input-wrapper:focus-within {
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .omnix-input-wrapper input {
            flex: 1;
            border: none;
            background: transparent;
            padding: 12px 16px;
            font-size: 14px;
            outline: none;
            color: #374151;
        }
        
        .omnix-input-wrapper input::placeholder {
            color: #9ca3af;
        }
        
        .omnix-input-actions {
            display: flex;
            gap: 8px;
            align-items: center;
        }
        
        .omnix-voice-btn {
            background: #10b981;
            color: white;
            border: none;
            border-radius: 50%;
            width: 36px;
            height: 36px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
        }
        
        .omnix-voice-btn:hover {
            background: #059669;
            transform: scale(1.05);
        }
        
        .omnix-voice-btn:active {
            transform: scale(0.95);
        }
        
        .omnix-voice-btn.listening {
            background: #ef4444;
            animation: pulse 1.5s infinite;
        }
        
        .omnix-voice-btn.speaking {
            background: #f59e0b;
        }
        
        .omnix-send-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 50%;
            width: 36px;
            height: 36px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        }
        
        .omnix-send-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        
        .omnix-send-icon {
            font-size: 16px;
            font-weight: 600;
        }
        
        .omnix-voice-controls {
            margin-top: 12px;
            display: flex;
            justify-content: center;
        }
        
        .omnix-voice-control-btn {
            background: #f3f4f6;
            color: #6b7280;
            border: 1px solid #d1d5db;
            border-radius: 20px;
            padding: 8px 16px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s ease;
        }
        
        .omnix-voice-control-btn:hover {
            background: #e5e7eb;
            color: #374151;
        }
        
        .omnix-chatbot-toggle {
            width: 70px;
            height: 70px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .omnix-chatbot-toggle:hover {
            transform: scale(1.05);
            box-shadow: 0 12px 35px rgba(102, 126, 234, 0.5);
        }
        
        .omnix-toggle-content {
            position: relative;
            z-index: 1;
        }
        
        .omnix-toggle-avatar {
            width: 50px;
            height: 50px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid rgba(255, 255, 255, 0.3);
            backdrop-filter: blur(10px);
        }
        
        .omnix-toggle-text {
            font-size: 20px;
            font-weight: 700;
            color: white;
        }
        
        .omnix-toggle-badge {
            position: absolute;
            top: -5px;
            right: -5px;
            width: 20px;
            height: 20px;
            background: #10b981;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
        }
        
        .omnix-badge-dot {
            width: 8px;
            height: 8px;
            background: white;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        
        .omnix-typing {
            display: flex;
            align-items: center;
            gap: 6px;
            color: #6b7280;
            font-style: italic;
            font-size: 14px;
        }
        
        .omnix-typing-dots {
            display: inline-block;
            width: 6px;
            height: 6px;
            background: #6b7280;
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
                transform: translateY(-8px);
            }
        }
        
        .omnix-navigation-buttons {
            margin-top: 12px;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .omnix-nav-button {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 12px 16px;
            font-size: 14px;
            color: #374151;
            cursor: pointer;
            transition: all 0.2s ease;
            text-align: left;
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 500;
        }
        
        .omnix-nav-button:hover {
            background: #e2e8f0;
            border-color: #cbd5e1;
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .omnix-nav-button:active {
            transform: translateY(0);
        }
        
        .omnix-nav-indicator {
            font-size: 12px;
            opacity: 0.8;
            animation: pulse 1.5s infinite;
        }
        
        @media (max-width: 480px) {
            .omnix-chatbot-container {
                width: calc(100vw - 20px);
                height: calc(100vh - 20px);
                max-height: 600px;
                border-radius: 15px;
            }
            
            .omnix-chatbot-toggle {
                width: 60px;
                height: 60px;
            }
        }
    `;
    
    document.head.appendChild(styles);
    document.body.appendChild(widget);
    
    // Global state
    let isOpen = false;
    let isMinimized = false;
    
    // Initialize voice recognition
    if (voiceConfig.enabled && 'webkitSpeechRecognition' in window) {
        const SpeechRecognition = window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = voiceConfig.continuous;
        recognition.interimResults = voiceConfig.interimResults;
        recognition.lang = voiceConfig.language;
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            document.getElementById('omnix-input').value = transcript;
            isListening = false;
            updateVoiceButton();
        };
        
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            isListening = false;
            updateVoiceButton();
        };
        
        recognition.onend = () => {
            isListening = false;
            updateVoiceButton();
        };
        
        isVoiceSupported = true;
    }
    
    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
        speechSynthesis = window.speechSynthesis;
    }
    
    // Auto-open if configured
    if (autoOpen) {
        setTimeout(() => {
            toggleChatbot();
        }, 1000);
    }
    
    // Global functions
    window.toggleChatbot = function() {
        isOpen = !isOpen;
        const container = document.querySelector('.omnix-chatbot-container');
        const toggle = document.querySelector('.omnix-chatbot-toggle');
        
        if (isOpen) {
            container.classList.add('open');
            toggle.style.display = 'none';
            document.getElementById('omnix-input').focus();
        } else {
            container.classList.remove('open');
            toggle.style.display = 'flex';
        }
    };
    
    window.toggleMinimize = function() {
        isMinimized = !isMinimized;
        const container = document.querySelector('.omnix-chatbot-container');
        
        if (isMinimized) {
            container.style.height = '60px';
            document.querySelector('.omnix-chatbot-messages').style.display = 'none';
            document.querySelector('.omnix-chatbot-input-container').style.display = 'none';
        } else {
            container.style.height = '600px';
            document.querySelector('.omnix-chatbot-messages').style.display = 'block';
            document.querySelector('.omnix-chatbot-input-container').style.display = 'block';
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
        
        // Check if user is asking for navigation
        const navigationKeywords = ['go to', 'navigate', 'redirect', 'take me to', 'show me', 'visit', 'open', 'link', 'page', 'section', 'about', 'pricing', 'features', 'contact', 'dashboard', 'admin'];
        const hasNavigationIntent = navigationKeywords.some(keyword => message.toLowerCase().includes(keyword));
        
        // Use navigation API only if user is asking for navigation, otherwise use chat API
        const apiEndpoint = hasNavigationIntent ? '/api/website-navigation' : '/api/chat';
        const requestBody = hasNavigationIntent ? {
            message: message,
            currentPath: window.location.pathname,
            botId: botId
        } : {
            message: message,
            botId: botId
        };
        
        // Send to appropriate API
        fetch(`${apiUrl}${apiEndpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify(requestBody)
        })
        .then(response => response.json())
        .then(data => {
            hideTyping();
            let botMessage = '';
            if (data.message) {
                botMessage = data.message;
                addMessage(botMessage, 'bot');
                
                // Add navigation buttons only if user asked for navigation and actions are available
                if (hasNavigationIntent && data.navigationActions && data.navigationActions.length > 0) {
                    addNavigationButtons(data.navigationActions);
                }
            } else {
                botMessage = 'Sorry, I encountered an error. Please try again.';
                addMessage(botMessage, 'bot');
            }
            
            // Auto-speak the response if enabled
            if (voiceConfig.autoSpeak && voiceConfig.enabled && botMessage) {
                setTimeout(() => {
                    speakText(botMessage);
                }, 500);
            }
            
            // Auto-navigate only if user asked for navigation and auto-navigate is enabled
            if (hasNavigationIntent && data.autoNavigate) {
                handleAutoNavigation(data.autoNavigate);
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
    
    // Voice control functions
    window.toggleVoiceInput = function() {
        if (!recognition || !isVoiceSupported) {
            addMessage('Voice input not supported in this browser', 'bot');
            return;
        }
        
        if (isListening) {
            recognition.stop();
        } else {
            recognition.start();
        }
    };
    
    window.toggleVoiceOutput = function() {
        const lastMessage = document.querySelector('.omnix-message.bot:last-child');
        if (lastMessage) {
            speakText(lastMessage.textContent);
        } else {
            addMessage('No message to speak', 'bot');
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
    
    function addNavigationButtons(actions) {
        const messagesContainer = document.getElementById('omnix-messages');
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'omnix-navigation-buttons';
        
        actions.forEach(action => {
            const button = document.createElement('button');
            button.className = 'omnix-nav-button';
            button.textContent = action.label;
            button.onclick = () => handleNavigation(action);
            buttonContainer.appendChild(button);
        });
        
        messagesContainer.appendChild(buttonContainer);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    function handleNavigation(action) {
        console.log('Handling navigation:', action);
        
        if (action.action === 'navigate' && action.path) {
            if (action.path.startsWith('#')) {
                // Scroll to section
                const element = document.getElementById(action.path.substring(1));
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            } else if (action.path.startsWith('http://') || action.path.startsWith('https://')) {
                // External URL - open in new tab
                console.log('Opening external URL:', action.path);
                window.open(action.path, '_blank');
            } else {
                // Internal page navigation
                const cleanPath = action.path.startsWith('/') ? action.path : `/${action.path}`;
                console.log('Navigating to internal page:', cleanPath);
                window.location.assign(cleanPath);
            }
        } else if (action.action === 'scroll' && action.section) {
            const element = document.getElementById(action.section);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        } else if (action.action === 'link' && action.path) {
            window.open(action.path, '_blank');
        }
    }
    
    function handleAutoNavigation(action) {
        if (isAutoNavigating) return;
        
        isAutoNavigating = true;
        showNavigationIndicator();
        
        // Add navigation message
        addMessage(`🚀 Auto-navigating you to ${action.path || action.section} in a moment...`, 'bot');
        
        // Clear any existing timeout
        if (navigationTimeout) {
            clearTimeout(navigationTimeout);
        }
        
        // Navigate after delay
        navigationTimeout = setTimeout(() => {
            handleNavigation(action);
            hideNavigationIndicator();
            isAutoNavigating = false;
        }, navigationDelay * 1000);
    }
    
    function showNavigationIndicator() {
        const header = document.querySelector('.omnix-chatbot-title');
        if (header) {
            const indicator = document.createElement('span');
            indicator.id = 'omnix-nav-indicator';
            indicator.className = 'omnix-nav-indicator';
            indicator.textContent = ' 🚀 Navigating...';
            header.appendChild(indicator);
        }
    }
    
    function hideNavigationIndicator() {
        const indicator = document.getElementById('omnix-nav-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    function showTyping() {
        const messagesContainer = document.getElementById('omnix-messages');
        const typingDiv = document.createElement('div');
        typingDiv.id = 'omnix-typing-indicator';
        typingDiv.className = 'omnix-typing';
        typingDiv.innerHTML = `
            <span>${botName} is typing</span>
            <div class="omnix-typing-dots"></div>
            <div class="omnix-typing-dots"></div>
            <div class="omnix-typing-dots"></div>
        `;
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    function hideTyping() {
        const typingDiv = document.getElementById('omnix-typing-indicator');
        if (typingDiv) {
            typingDiv.remove();
        }
    }
    
    function updateVoiceButton() {
        const micBtn = document.getElementById('omnix-voice-mic');
        if (micBtn) {
            if (isListening) {
                micBtn.classList.add('listening');
            } else {
                micBtn.classList.remove('listening');
            }
        }
    }
    
    function speakText(text) {
        if (!speechSynthesis) return;
        
        // Stop any current speech
        speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = voiceConfig.rate;
        utterance.pitch = voiceConfig.pitch;
        utterance.volume = voiceConfig.volume;
        utterance.lang = voiceConfig.language;
        
        utterance.onstart = () => {
            const speakerBtn = document.getElementById('omnix-voice-speaker');
            if (speakerBtn) {
                speakerBtn.classList.add('speaking');
            }
        };
        
        utterance.onend = () => {
            const speakerBtn = document.getElementById('omnix-voice-speaker');
            if (speakerBtn) {
                speakerBtn.classList.remove('speaking');
            }
        };
        
        speechSynthesis.speak(utterance);
    }
    
    // Add welcome message
    setTimeout(() => {
        addMessage(`Hello! I'm ${botName}. How can I help you today?`, 'bot');
    }, 500);
    
})();
