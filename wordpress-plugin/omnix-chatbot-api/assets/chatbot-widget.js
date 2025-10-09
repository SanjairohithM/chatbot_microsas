/**
 * OmniX Chatbot Widget with Voice Features
 * Enhanced version with conversation context for follow-up questions
 */

class OmniXChatbotWidget {
    constructor(element) {
        this.element = element;
        this.config = this.parseConfig();
        this.isOpen = false;
        this.isListening = false;
        this.conversationId = this.generateConversationId();
        this.messages = [];
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        
        this.init();
    }

    parseConfig() {
        const element = this.element;
        const omnixConfig = window.omnixChatbot || {};
        
        console.log('Parsing config for element:', element);
        console.log('Dataset:', element.dataset);
        console.log('OmniX config:', omnixConfig);
        
        return {
            botId: element.dataset.botId || '',
            accessToken: element.dataset.accessToken || '',
            apiUrl: element.dataset.apiUrl || omnixConfig.apiUrl || '',
            theme: element.dataset.theme || 'default',
            position: element.dataset.position || 'bottom-right',
            autoOpen: element.dataset.autoOpen === 'true',
            showAvatar: element.dataset.showAvatar === 'true',
            showTitle: element.dataset.showTitle === 'true',
            enableVoice: element.dataset.enableVoice === 'true',
            voiceLanguage: element.dataset.voiceLanguage || 'en-US',
            autoSpeak: element.dataset.autoSpeak === 'true',
            voiceRate: parseFloat(element.dataset.voiceRate) || 1.0,
            voicePitch: parseFloat(element.dataset.voicePitch) || 1.0,
            voiceVolume: parseFloat(element.dataset.voiceVolume) || 1.0,
            voiceContinuous: element.dataset.voiceContinuous === 'true',
            voiceInterimResults: element.dataset.voiceInterimResults === 'true'
        };
    }

    generateConversationId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    }

    init() {
        console.log('Initializing OmniX Chatbot Widget with config:', this.config);
        this.createWidget();
        this.initializeVoice();
        this.bindEvents();
        
        if (this.config.autoOpen) {
            this.toggleWidget();
        }
    }

    createWidget() {
        console.log('Creating widget with enableVoice:', this.config.enableVoice);
        
        // Force voice to be enabled for debugging
        const forceVoice = true; // Set to true to always show voice buttons
        
        const widgetHTML = `
            <div class="omnix-chatbot-container ${this.config.position}">
                <div class="omnix-chatbot-toggle" id="chatbot-toggle">
                    <div class="omnix-chatbot-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
                        </svg>
                    </div>
                </div>
                
                <div class="omnix-chatbot-window" id="chatbot-window" style="display: none;">
                    <div class="omnix-chatbot-header">
                        ${this.config.showTitle ? '<h3>Chat Assistant</h3>' : ''}
                        <div class="omnix-chatbot-controls">
                            ${(this.config.enableVoice || forceVoice) ? '<button class="voice-btn" id="voice-btn" title="Voice Input">🎤</button>' : ''}
                            <button class="close-btn" id="close-btn" title="Close">×</button>
                        </div>
                    </div>
                    
                    <div class="omnix-chatbot-messages" id="chatbot-messages">
                        <div class="message bot-message">
                            <div class="message-content">
                                <p>Hello! How can I help you today?</p>
                                ${(this.config.enableVoice || forceVoice) ? '<button class="speak-btn" onclick="this.parentElement.querySelector(\'p\').click()">🔊</button>' : ''}
                            </div>
                        </div>
                    </div>
                    
                    <div class="omnix-chatbot-input">
                        <input type="text" id="chatbot-input" placeholder="Type your message...">
                        <button id="send-btn">Send</button>
                    </div>
                </div>
            </div>
        `;
        
        console.log('Generated widget HTML:', widgetHTML);
        this.element.innerHTML = widgetHTML;
    }

    initializeVoice() {
        // Force voice initialization for debugging
        const forceVoice = true;
        if (!this.config.enableVoice && !forceVoice) return;

        // Check for speech recognition support
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = this.config.voiceContinuous;
            this.recognition.interimResults = this.config.voiceInterimResults;
            this.recognition.lang = this.config.voiceLanguage;
            
            this.recognition.onstart = () => {
                this.isListening = true;
                this.updateVoiceButton();
            };
            
            this.recognition.onresult = (event) => {
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
                    document.getElementById('chatbot-input').value = finalTranscript;
                    this.sendMessage();
                } else if (interimTranscript && this.config.voiceInterimResults) {
                    document.getElementById('chatbot-input').value = interimTranscript;
                }
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.isListening = false;
                this.updateVoiceButton();
            };
            
            this.recognition.onend = () => {
                this.isListening = false;
                this.updateVoiceButton();
            };
        } else {
            console.warn('Speech recognition not supported in this browser');
            // Hide voice button if not supported
            const voiceBtn = document.getElementById('voice-btn');
            if (voiceBtn) voiceBtn.style.display = 'none';
        }
    }

    bindEvents() {
        // Toggle widget
        document.getElementById('chatbot-toggle').addEventListener('click', () => {
            this.toggleWidget();
        });

        // Close widget
        document.getElementById('close-btn').addEventListener('click', () => {
            this.toggleWidget();
        });

        // Send message
        document.getElementById('send-btn').addEventListener('click', () => {
            this.sendMessage();
        });

        // Enter key to send
        document.getElementById('chatbot-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Voice button
        const voiceBtn = document.getElementById('voice-btn');
        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => {
                this.toggleVoiceInput();
            });
        }

        // Speak buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('speak-btn')) {
                const messageText = e.target.parentElement.querySelector('p').textContent;
                this.speakText(messageText);
            }
        });
    }

    toggleWidget() {
        const window = document.getElementById('chatbot-window');
        this.isOpen = !this.isOpen;
        window.style.display = this.isOpen ? 'block' : 'none';
        
        if (this.isOpen) {
            document.getElementById('chatbot-input').focus();
        }
    }

    toggleVoiceInput() {
        if (!this.recognition) return;

        if (this.isListening) {
            this.recognition.stop();
        } else {
            this.recognition.start();
        }
    }

    updateVoiceButton() {
        const voiceBtn = document.getElementById('voice-btn');
        if (voiceBtn) {
            voiceBtn.style.backgroundColor = this.isListening ? '#ff4444' : '#007cba';
            voiceBtn.textContent = this.isListening ? '🔴' : '🎤';
        }
    }

    async sendMessage() {
        const input = document.getElementById('chatbot-input');
        const message = input.value.trim();
        
        if (!message) return;

        // Add user message to chat
        this.addMessage(message, 'user');
        input.value = '';

        // Show typing indicator
        this.showTypingIndicator();

        try {
            const response = await fetch(omnixChatbot.ajaxUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'omnix_chat',
                    nonce: omnixChatbot.nonce,
                    message: message,
                    conversation_id: this.conversationId,
                    bot_id: this.config.botId,
                    access_token: this.config.accessToken
                })
            });

            const data = await response.json();
            
            if (data.success) {
                const botResponse = data.data.response || data.data.message || 'I apologize, but I couldn\'t process your request.';
                this.addMessage(botResponse, 'bot');
                
                // Auto-speak if enabled
                if (this.config.autoSpeak) {
                    this.speakText(botResponse);
                }
            } else {
                this.addMessage('Sorry, I encountered an error. Please try again.', 'bot');
            }
        } catch (error) {
            console.error('Chat error:', error);
            this.addMessage('Sorry, I couldn\'t connect to the server. Please try again.', 'bot');
        } finally {
            this.hideTypingIndicator();
        }
    }

    addMessage(text, sender) {
        const messagesContainer = document.getElementById('chatbot-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const textElement = document.createElement('p');
        textElement.textContent = text;
        
        messageContent.appendChild(textElement);
        
        // Add speak button for bot messages
        if (sender === 'bot' && this.config.enableVoice) {
            const speakBtn = document.createElement('button');
            speakBtn.className = 'speak-btn';
            speakBtn.textContent = '🔊';
            speakBtn.title = 'Speak message';
            messageContent.appendChild(speakBtn);
        }
        
        messageDiv.appendChild(messageContent);
        messagesContainer.appendChild(messageDiv);
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Store message for conversation context
        this.messages.push({ text, sender, timestamp: new Date() });
    }

    showTypingIndicator() {
        const messagesContainer = document.getElementById('chatbot-messages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing-indicator';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = `
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    speakText(text) {
        if (!this.synthesis) return;

        // Cancel any ongoing speech
        this.synthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = this.config.voiceRate;
        utterance.pitch = this.config.voicePitch;
        utterance.volume = this.config.voiceVolume;
        utterance.lang = this.config.voiceLanguage;

        this.synthesis.speak(utterance);
    }
}

// Initialize widgets when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Looking for chatbot widgets');
    const widgets = document.querySelectorAll('.omnix-chatbot-widget');
    console.log('Found widgets:', widgets.length);
    widgets.forEach((widget, index) => {
        console.log(`Initializing widget ${index}:`, widget);
        try {
            new OmniXChatbotWidget(widget);
        } catch (error) {
            console.error('Error initializing widget:', error);
        }
    });
});

// Auto-initialize widgets added dynamically
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1) { // Element node
                if (node.classList && node.classList.contains('omnix-chatbot-widget')) {
                    console.log('Found new widget via mutation observer:', node);
                    try {
                        new OmniXChatbotWidget(node);
                    } catch (error) {
                        console.error('Error initializing widget via mutation observer:', error);
                    }
                } else {
                    const widgets = node.querySelectorAll && node.querySelectorAll('.omnix-chatbot-widget');
                    if (widgets && widgets.length > 0) {
                        console.log('Found widgets in added node:', widgets.length);
                        widgets.forEach(widget => {
                            try {
                                new OmniXChatbotWidget(widget);
                            } catch (error) {
                                console.error('Error initializing widget via mutation observer:', error);
                            }
                        });
                    }
                }
            }
        });
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});
