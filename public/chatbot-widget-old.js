(function() {
    'use strict';
    
    // Configuration from window.omnixChatbot
    const config = window.omnixChatbot || {};
    const apiUrl = config.apiUrl || 'https://d13cf0272749.ngrok-free.app';
    const botId = config.botId || 'auto';
    const accessToken = config.accessToken;
    const autoOpen = config.autoOpen || false;
    const position = config.position || 'bottom-right';
    const theme = config.theme || 'modern';
    
    // Navigation configuration
    const navigationEnabled = config.navigationEnabled !== false;
    const autoNavigate = config.autoNavigate !== false;
    const navigationDelay = config.navigationDelay || 3;
    
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
        
        .omnix-voice-btn {
            background: #28a745;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            margin: 0 2px;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 40px;
            height: 40px;
        }
        
        .omnix-voice-btn:hover {
            background: #218838;
            transform: scale(1.05);
        }
        
        .omnix-voice-btn:active {
            transform: scale(0.95);
        }
        
        .omnix-voice-btn.listening {
            background: #dc3545;
            animation: pulse 1.5s infinite;
        }
        
        .omnix-voice-btn.speaking {
            background: #ffc107;
            color: #212529;
        }
        
        .omnix-voice-icon {
            font-size: 16px;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
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
        
        .omnix-navigation-buttons {
            margin-top: 8px;
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        
        .omnix-nav-button {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 8px 12px;
            font-size: 14px;
            color: #495057;
            cursor: pointer;
            transition: all 0.2s ease;
            text-align: left;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .omnix-nav-button:hover {
            background: #e9ecef;
            border-color: #adb5bd;
            transform: translateY(-1px);
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
                width: calc(100vw - 40px);
                height: calc(100vh - 40px);
                max-height: 500px;
            }
        }
    `;
    
    document.head.appendChild(styles);
    document.body.appendChild(widget);
    
    // Initialize voice functionality
    initializeVoice();
    
    // Voice functionality
    function initializeVoice() {
        if (!voiceConfig.enabled) {
            console.log('🎤 Voice features disabled');
            return;
        }
        
        // Check for speech recognition support
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition = new SpeechRecognition();
            recognition.continuous = voiceConfig.continuous;
            recognition.interimResults = voiceConfig.interimResults;
            recognition.lang = voiceConfig.language;
            
            recognition.onstart = function() {
                isListening = true;
                updateVoiceButton('mic', true);
                console.log('🎤 Voice recognition started');
            };
            
            recognition.onend = function() {
                isListening = false;
                updateVoiceButton('mic', false);
                console.log('🎤 Voice recognition ended');
            };
            
            recognition.onresult = function(event) {
                let finalTranscript = '';
                let interimTranscript = '';
                
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }
                
                if (finalTranscript) {
                    document.getElementById('omnix-input').value = finalTranscript;
                    console.log('🎤 Voice input:', finalTranscript);
                    // Auto-send message after voice input
                    setTimeout(() => {
                        sendMessage();
                    }, 500);
                } else if (interimTranscript && voiceConfig.interimResults) {
                    document.getElementById('omnix-input').value = interimTranscript;
                }
            };
            
            recognition.onerror = function(event) {
                console.error('🎤 Speech recognition error:', event.error);
                isListening = false;
                updateVoiceButton('mic', false);
                
                // Show error message to user
                addMessage('Voice input error: ' + event.error, 'bot');
            };
            
            isVoiceSupported = true;
            console.log('🎤 Voice recognition initialized');
        } else {
            console.warn('🎤 Speech recognition not supported in this browser');
        }
        
        // Check for speech synthesis support
        if ('speechSynthesis' in window) {
            speechSynthesis = window.speechSynthesis;
            console.log('🔊 Speech synthesis available');
        } else {
            console.warn('🔊 Speech synthesis not supported in this browser');
        }
    }
    
    function updateVoiceButton(type, active) {
        const button = document.getElementById(`omnix-voice-${type}`);
        if (button) {
            if (active) {
                button.classList.add(type === 'mic' ? 'listening' : 'speaking');
            } else {
                button.classList.remove('listening', 'speaking');
            }
        }
    }
    
    function speakText(text) {
        if (!speechSynthesis || !voiceConfig.enabled) {
            console.warn('🔊 Speech synthesis not available');
            return;
        }
        
        // Stop any current speech
        if (currentUtterance) {
            speechSynthesis.cancel();
        }
        
        currentUtterance = new SpeechSynthesisUtterance(text);
        currentUtterance.lang = voiceConfig.language;
        currentUtterance.rate = voiceConfig.rate;
        currentUtterance.pitch = voiceConfig.pitch;
        currentUtterance.volume = voiceConfig.volume;
        
        currentUtterance.onstart = function() {
            updateVoiceButton('speaker', true);
            console.log('🔊 Speaking:', text);
        };
        
        currentUtterance.onend = function() {
            updateVoiceButton('speaker', false);
            currentUtterance = null;
            console.log('🔊 Speech completed');
        };
        
        currentUtterance.onerror = function(event) {
            updateVoiceButton('speaker', false);
            console.error('🔊 Speech synthesis error:', event.error);
        };
        
        speechSynthesis.speak(currentUtterance);
    }
    
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
        
        // Send to API with navigation support
        fetch(`${apiUrl}/api/website-navigation`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                'ngrok-skip-browser-warning': 'true'
                    },
                    body: JSON.stringify({
                        message: message,
                        currentPath: window.location.pathname,
                        botId: botId
            })
        })
        .then(response => response.json())
        .then(data => {
            hideTyping();
            let botMessage = '';
            if (data.message) {
                botMessage = data.message;
                addMessage(botMessage, 'bot');
                
                // Add navigation buttons if available and enabled
                if (navigationEnabled && data.navigationActions && data.navigationActions.length > 0) {
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
            
            // Auto-navigate if enabled and specified
            if (navigationEnabled && autoNavigate) {
                if (data.autoNavigate) {
                    handleAutoNavigation(data.autoNavigate);
                } else if (data.navigationActions && data.navigationActions.length > 0) {
                    // Auto-navigate to first navigation action
                    const firstAction = data.navigationActions[0];
                    if (firstAction.action === 'navigate') {
                        handleAutoNavigation(firstAction);
                    }
                }
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
        let welcomeMessage = 'Hello! I\'m your AI assistant. How can I help you today?';
        if (voiceConfig.enabled && isVoiceSupported) {
            welcomeMessage += ' You can use the microphone button to speak to me or the speaker button to hear my responses.';
        }
        addMessage(welcomeMessage, 'bot');
    }, 500);
    
    // Cleanup function for voice resources
    window.cleanupVoice = function() {
        if (recognition) {
            recognition.stop();
            recognition = null;
        }
        if (speechSynthesis && currentUtterance) {
            speechSynthesis.cancel();
            currentUtterance = null;
        }
        console.log('🎤 Voice resources cleaned up');
    };
    
})();
