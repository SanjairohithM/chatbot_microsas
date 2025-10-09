/**
 * OmniX Chatbot Widget
 * A lightweight JavaScript widget for embedding chatbots
 */

(function() {
    'use strict';
    
    // Configuration
    const defaultConfig = {
        botId: null,
        accessToken: null,
        apiUrl: window.omnixChatbot?.apiUrl || window.location.origin,
        position: 'bottom-right',
        theme: 'default',
        autoOpen: false,
        showAvatar: true,
        showTitle: true,
        enableVoice: true,
        voiceLanguage: 'en-US',
        autoSpeak: false,
        voiceRate: 1.0,
        voicePitch: 1.0,
        voiceVolume: 1.0,
        voiceContinuous: false,
        voiceInterimResults: false,
        primaryColor: '#3b82f6',
        secondaryColor: '#1e40af'
    };
    
    class OmniXChatbotWidget {
        constructor(config = {}) {
            this.config = { ...defaultConfig, ...config };
            this.isOpen = false;
            this.isMinimized = false;
            this.isLoading = false;
            this.messages = [];
            this.conversationId = null;
            this.isListening = false;
            this.recognition = null;
            this.speechSynthesis = null;
            this.isVoiceSupported = false;
            
            this.init();
        }
        
        init() {
            if (!this.config.botId || !this.config.accessToken) {
                console.error('OmniX Chatbot: Bot ID and Access Token are required');
                return;
            }
            
            this.createWidget();
            this.initializeVoice();
            this.loadStyles();
            
            if (this.config.autoOpen) {
                this.open();
            }
        }
        
        createWidget() {
            // Create main container
            this.container = document.createElement('div');
            this.container.className = 'omnix-chatbot-container';
            this.container.style.cssText = `
                position: fixed;
                ${this.config.position.includes('bottom') ? 'bottom' : 'top'}: 20px;
                ${this.config.position.includes('right') ? 'right' : 'left'}: 20px;
                z-index: 9999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            `;
            
            // Create chat button
            this.chatButton = document.createElement('button');
            this.chatButton.className = 'omnix-chatbot-button';
            this.chatButton.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
            `;
            this.chatButton.style.cssText = `
                width: 60px;
                height: 60px;
                border-radius: 50%;
                border: none;
                background: ${this.config.primaryColor};
                color: white;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
            `;
            
            this.chatButton.addEventListener('click', () => this.toggle());
            this.chatButton.addEventListener('mouseenter', () => {
                this.chatButton.style.transform = 'scale(1.1)';
            });
            this.chatButton.addEventListener('mouseleave', () => {
                this.chatButton.style.transform = 'scale(1)';
            });
            
            // Create chat window
            this.chatWindow = document.createElement('div');
            this.chatWindow.className = 'omnix-chatbot-window';
            this.chatWindow.style.cssText = `
                width: 350px;
                height: 500px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.12);
                border: 2px solid ${this.config.primaryColor};
                display: none;
                flex-direction: column;
                overflow: hidden;
                position: relative;
            `;
            
            this.createHeader();
            this.createMessagesArea();
            this.createInputArea();
            
            this.container.appendChild(this.chatButton);
            this.container.appendChild(this.chatWindow);
            document.body.appendChild(this.container);
        }
        
        createHeader() {
            this.header = document.createElement('div');
            this.header.className = 'omnix-chatbot-header';
            this.header.style.cssText = `
                background: ${this.config.primaryColor};
                color: white;
                padding: 15px;
                display: flex;
                align-items: center;
                justify-content: space-between;
            `;
            
            const headerLeft = document.createElement('div');
            headerLeft.style.cssText = 'display: flex; align-items: center; gap: 10px;';
            
            if (this.config.showAvatar) {
                const avatar = document.createElement('div');
                avatar.className = 'omnix-chatbot-avatar';
                avatar.style.cssText = `
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: ${this.config.secondaryColor};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 16px;
                `;
                avatar.textContent = '🤖';
                headerLeft.appendChild(avatar);
            }
            
            const titleContainer = document.createElement('div');
            if (this.config.showTitle) {
                const title = document.createElement('div');
                title.className = 'omnix-chatbot-title';
                title.textContent = 'AI Assistant';
                title.style.cssText = 'font-weight: 600; font-size: 16px;';
                titleContainer.appendChild(title);
            }
            
            const status = document.createElement('div');
            status.className = 'omnix-chatbot-status';
            status.textContent = 'Online';
            status.style.cssText = 'font-size: 12px; opacity: 0.8;';
            titleContainer.appendChild(status);
            
            headerLeft.appendChild(titleContainer);
            
            const headerRight = document.createElement('div');
            headerRight.style.cssText = 'display: flex; gap: 5px;';
            
            const minimizeBtn = document.createElement('button');
            minimizeBtn.className = 'omnix-chatbot-minimize';
            minimizeBtn.innerHTML = '−';
            minimizeBtn.style.cssText = `
                width: 30px;
                height: 30px;
                border: none;
                background: rgba(255,255,255,0.2);
                color: white;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
            `;
            minimizeBtn.addEventListener('click', () => this.toggleMinimize());
            
            const closeBtn = document.createElement('button');
            closeBtn.className = 'omnix-chatbot-close';
            closeBtn.innerHTML = '×';
            closeBtn.style.cssText = `
                width: 30px;
                height: 30px;
                border: none;
                background: rgba(255,255,255,0.2);
                color: white;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
            `;
            closeBtn.addEventListener('click', () => this.close());
            
            headerRight.appendChild(minimizeBtn);
            headerRight.appendChild(closeBtn);
            
            this.header.appendChild(headerLeft);
            this.header.appendChild(headerRight);
            this.chatWindow.appendChild(this.header);
        }
        
        createMessagesArea() {
            this.messagesArea = document.createElement('div');
            this.messagesArea.className = 'omnix-chatbot-messages';
            this.messagesArea.style.cssText = `
                flex: 1;
                padding: 15px;
                overflow-y: auto;
                background: #f8f9fa;
            `;
            
            // Add welcome message
            this.addMessage('assistant', 'Hi! How can I help you today?');
            
            this.chatWindow.appendChild(this.messagesArea);
        }
        
        createInputArea() {
            this.inputArea = document.createElement('div');
            this.inputArea.className = 'omnix-chatbot-input-area';
            this.inputArea.style.cssText = `
                padding: 15px;
                border-top: 1px solid #e9ecef;
                background: white;
                display: flex;
                gap: 10px;
                align-items: center;
            `;
            
            this.input = document.createElement('input');
            this.input.className = 'omnix-chatbot-input';
            this.input.type = 'text';
            this.input.placeholder = 'Type your message...';
            this.input.style.cssText = `
                flex: 1;
                padding: 10px 15px;
                border: 1px solid #ddd;
                border-radius: 25px;
                outline: none;
                font-size: 14px;
            `;
            
            this.input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            
            // Voice button
            if (this.config.enableVoice && this.isVoiceSupported) {
                this.voiceBtn = document.createElement('button');
                this.voiceBtn.className = 'omnix-chatbot-voice';
                this.voiceBtn.innerHTML = '🎤';
                this.voiceBtn.style.cssText = `
                    width: 40px;
                    height: 40px;
                    border: none;
                    background: #f8f9fa;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                `;
                this.voiceBtn.addEventListener('click', () => this.toggleVoiceRecognition());
                this.inputArea.appendChild(this.voiceBtn);
            }
            
            this.sendBtn = document.createElement('button');
            this.sendBtn.className = 'omnix-chatbot-send';
            this.sendBtn.innerHTML = '➤';
            this.sendBtn.style.cssText = `
                width: 40px;
                height: 40px;
                border: none;
                background: ${this.config.primaryColor};
                color: white;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
            `;
            this.sendBtn.addEventListener('click', () => this.sendMessage());
            
            this.inputArea.appendChild(this.input);
            this.inputArea.appendChild(this.sendBtn);
            this.chatWindow.appendChild(this.inputArea);
        }
        
        initializeVoice() {
            if (!this.config.enableVoice) return;
            
            // Check for speech recognition support
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                this.recognition = new SpeechRecognition();
                this.recognition.continuous = this.config.voiceContinuous;
                this.recognition.interimResults = this.config.voiceInterimResults;
                this.recognition.lang = this.config.voiceLanguage;
                
                this.recognition.onstart = () => {
                    this.isListening = true;
                    if (this.voiceBtn) {
                        this.voiceBtn.style.background = '#ff4444';
                        this.voiceBtn.innerHTML = '🔴';
                    }
                };
                
                this.recognition.onend = () => {
                    this.isListening = false;
                    if (this.voiceBtn) {
                        this.voiceBtn.style.background = '#f8f9fa';
                        this.voiceBtn.innerHTML = '🎤';
                    }
                };
                
                this.recognition.onresult = (event) => {
                    const transcript = event.results[0][0].transcript;
                    if (transcript.trim()) {
                        this.input.value = transcript;
                        this.sendMessage(transcript);
                    }
                };
                
                this.recognition.onerror = (event) => {
                    console.error('Speech recognition error:', event.error);
                    this.isListening = false;
                    if (this.voiceBtn) {
                        this.voiceBtn.style.background = '#f8f9fa';
                        this.voiceBtn.innerHTML = '🎤';
                    }
                };
                
                this.isVoiceSupported = true;
            }
            
            // Check for speech synthesis support
            if ('speechSynthesis' in window) {
                this.speechSynthesis = window.speechSynthesis;
            }
        }
        
        addMessage(role, content, showVoiceButton = false) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `omnix-chatbot-message omnix-chatbot-message-${role}`;
            
            const isUser = role === 'user';
            messageDiv.style.cssText = `
                margin-bottom: 15px;
                display: flex;
                ${isUser ? 'justify-content: flex-end' : 'justify-content: flex-start'};
            `;
            
            const messageContent = document.createElement('div');
            messageContent.style.cssText = `
                max-width: 80%;
                padding: 10px 15px;
                border-radius: 18px;
                font-size: 14px;
                line-height: 1.4;
                ${isUser ? 
                    `background: ${this.config.primaryColor}; color: white;` : 
                    'background: white; color: #333; border: 1px solid #e9ecef;'
                }
            `;
            messageContent.textContent = content;
            
            const messageContainer = document.createElement('div');
            messageContainer.style.cssText = 'display: flex; align-items: flex-start; gap: 8px;';
            
            if (!isUser) {
                messageContainer.appendChild(messageContent);
                
                if (showVoiceButton && this.speechSynthesis) {
                    const voiceBtn = document.createElement('button');
                    voiceBtn.innerHTML = '🔊';
                    voiceBtn.style.cssText = `
                        width: 24px;
                        height: 24px;
                        border: none;
                        background: #f8f9fa;
                        border-radius: 50%;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 12px;
                        opacity: 0.7;
                    `;
                    voiceBtn.addEventListener('click', () => this.speakText(content));
                    messageContainer.appendChild(voiceBtn);
                }
            } else {
                messageContainer.appendChild(messageContent);
            }
            
            messageDiv.appendChild(messageContainer);
            this.messagesArea.appendChild(messageDiv);
            this.messagesArea.scrollTop = this.messagesArea.scrollHeight;
        }
        
        addLoadingMessage() {
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'omnix-chatbot-loading';
            loadingDiv.style.cssText = `
                margin-bottom: 15px;
                display: flex;
                justify-content: flex-start;
            `;
            
            const loadingContent = document.createElement('div');
            loadingContent.style.cssText = `
                padding: 10px 15px;
                background: white;
                border: 1px solid #e9ecef;
                border-radius: 18px;
                display: flex;
                align-items: center;
                gap: 5px;
            `;
            
            for (let i = 0; i < 3; i++) {
                const dot = document.createElement('div');
                dot.style.cssText = `
                    width: 8px;
                    height: 8px;
                    background: #999;
                    border-radius: 50%;
                    animation: omnix-bounce 1.4s infinite ease-in-out both;
                    animation-delay: ${i * 0.16}s;
                `;
                loadingContent.appendChild(dot);
            }
            
            loadingDiv.appendChild(loadingContent);
            this.messagesArea.appendChild(loadingDiv);
            this.messagesArea.scrollTop = this.messagesArea.scrollHeight;
            
            return loadingDiv;
        }
        
        removeLoadingMessage(loadingDiv) {
            if (loadingDiv && loadingDiv.parentNode) {
                loadingDiv.parentNode.removeChild(loadingDiv);
            }
        }
        
        async sendMessage(message = null) {
            const messageText = message || this.input.value.trim();
            if (!messageText || this.isLoading) return;
            
            this.input.value = '';
            this.addMessage('user', messageText);
            
            const loadingDiv = this.addLoadingMessage();
            this.isLoading = true;
            this.sendBtn.disabled = true;
            
            try {
                const response = await fetch(`${this.config.apiUrl}/wp-json/omnix-chatbot/v1/chat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.config.accessToken}`
                    },
                    body: JSON.stringify({
                        message: messageText,
                        conversationId: this.conversationId,
                        botId: this.config.botId
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    this.removeLoadingMessage(loadingDiv);
                    this.addMessage('assistant', data.message, true);
                    
                    if (data.conversationId) {
                        this.conversationId = data.conversationId;
                    }
                    
                    // Auto-speak if enabled
                    if (this.config.autoSpeak && this.speechSynthesis) {
                        this.speakText(data.message);
                    }
                } else {
                    this.removeLoadingMessage(loadingDiv);
                    this.addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
                }
            } catch (error) {
                console.error('Chat error:', error);
                this.removeLoadingMessage(loadingDiv);
                this.addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
            } finally {
                this.isLoading = false;
                this.sendBtn.disabled = false;
            }
        }
        
        speakText(text) {
            if (!this.speechSynthesis || !this.config.enableVoice) return;
            
            this.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = this.config.voiceLanguage;
            utterance.rate = this.config.voiceRate;
            utterance.pitch = this.config.voicePitch;
            utterance.volume = this.config.voiceVolume;
            
            this.speechSynthesis.speak(utterance);
        }
        
        toggleVoiceRecognition() {
            if (!this.recognition || !this.isVoiceSupported) return;
            
            if (this.isListening) {
                this.recognition.stop();
            } else {
                this.recognition.start();
            }
        }
        
        toggle() {
            if (this.isOpen) {
                this.close();
            } else {
                this.open();
            }
        }
        
        open() {
            this.isOpen = true;
            this.chatButton.style.display = 'none';
            this.chatWindow.style.display = 'flex';
        }
        
        close() {
            this.isOpen = false;
            this.chatButton.style.display = 'flex';
            this.chatWindow.style.display = 'none';
        }
        
        toggleMinimize() {
            this.isMinimized = !this.isMinimized;
            
            if (this.isMinimized) {
                this.chatWindow.style.height = '60px';
                this.messagesArea.style.display = 'none';
                this.inputArea.style.display = 'none';
            } else {
                this.chatWindow.style.height = '500px';
                this.messagesArea.style.display = 'block';
                this.inputArea.style.display = 'flex';
            }
        }
        
        loadStyles() {
            if (document.getElementById('omnix-chatbot-styles')) return;
            
            const style = document.createElement('style');
            style.id = 'omnix-chatbot-styles';
            style.textContent = `
                @keyframes omnix-bounce {
                    0%, 80%, 100% {
                        transform: scale(0);
                    }
                    40% {
                        transform: scale(1);
                    }
                }
                
                .omnix-chatbot-container * {
                    box-sizing: border-box;
                }
                
                .omnix-chatbot-messages::-webkit-scrollbar {
                    width: 6px;
                }
                
                .omnix-chatbot-messages::-webkit-scrollbar-track {
                    background: #f1f1f1;
                }
                
                .omnix-chatbot-messages::-webkit-scrollbar-thumb {
                    background: #c1c1c1;
                    border-radius: 3px;
                }
                
                .omnix-chatbot-messages::-webkit-scrollbar-thumb:hover {
                    background: #a8a8a8;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Auto-initialize widgets from script tags
    function initializeWidgets() {
        const scripts = document.querySelectorAll('script[data-bot-id][data-access-token]');
        
        scripts.forEach(script => {
            const config = {
                botId: script.getAttribute('data-bot-id'),
                accessToken: script.getAttribute('data-access-token'),
                apiUrl: script.getAttribute('data-api-url') || window.omnixChatbot?.apiUrl || window.location.origin,
                position: script.getAttribute('data-position') || 'bottom-right',
                theme: script.getAttribute('data-theme') || 'default',
                autoOpen: script.getAttribute('data-auto-open') === 'true',
                showAvatar: script.getAttribute('data-show-avatar') !== 'false',
                showTitle: script.getAttribute('data-show-title') !== 'false',
                enableVoice: script.getAttribute('data-enable-voice') !== 'false',
                voiceLanguage: script.getAttribute('data-voice-language') || 'en-US',
                autoSpeak: script.getAttribute('data-auto-speak') === 'true',
                voiceRate: parseFloat(script.getAttribute('data-voice-rate')) || 1.0,
                voicePitch: parseFloat(script.getAttribute('data-voice-pitch')) || 1.0,
                voiceVolume: parseFloat(script.getAttribute('data-voice-volume')) || 1.0,
                voiceContinuous: script.getAttribute('data-voice-continuous') === 'true',
                voiceInterimResults: script.getAttribute('data-voice-interim-results') === 'true',
                primaryColor: script.getAttribute('data-primary-color') || '#3b82f6',
                secondaryColor: script.getAttribute('data-secondary-color') || '#1e40af'
            };
            
            new OmniXChatbotWidget(config);
        });
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeWidgets);
    } else {
        initializeWidgets();
    }
    
    // Expose to global scope
    window.OmniXChatbotWidget = OmniXChatbotWidget;
    
})();
