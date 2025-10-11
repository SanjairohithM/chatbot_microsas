;(() => {
  // Configuration from window.omnixChatbot
  const config = window.omnixChatbot || {}
  const apiUrl = config.apiUrl || "https://38983cb9d4c9.ngrok-free.app"
  const botId = config.botId || "auto"
  const accessToken = config.accessToken
  const autoOpen = config.autoOpen || false
  const position = config.position || "bottom-right"
  const theme = config.theme || "modern"
  const navigationDelay = config.navigationDelay || 3 // Declare navigationDelay here

  // Voice configuration
  const voiceConfig = {
    enabled: config.enableVoice !== false,
    language: config.voiceLanguage || "en-US",
    rate: config.voiceRate || 1.0,
    pitch: config.voicePitch || 1.0,
    volume: config.voiceVolume || 1.0,
    autoSpeak: config.autoSpeak || false,
    continuous: config.voiceContinuous || false,
    interimResults: config.voiceInterimResults || false,
  }

  // Voice state
  let recognition = null
  let isListening = false
  let speechSynthesis = null
  const currentUtterance = null
  let isVoiceSupported = false

  // Navigation state
  let isAutoNavigating = false
  let navigationTimeout = null

  if (!accessToken) {
    console.warn("OmniX Chatbot: Access token not provided")
    return
  }

  // Get bot name from config or use default
  const botName = config.botName || "Smart Assistant"

  // Create chatbot widget
  const widget = document.createElement("div")
  widget.id = "omnix-chatbot-widget"
  widget.innerHTML = `
        <div class="omnix-chatbot-container">
            <div class="omnix-chatbot-header">
                <div class="omnix-chatbot-title">
                    <h2 class="omnix-hero-title">
                        Your <span class="omnix-hero-accent">Smart Assistant</span> for Daily Tasks
                    </h2>
                    <div class="omnix-hero-bubble">
                        Hi! I'm ${botName} - Here to help you
                    </div>
                </div>
                <div class="omnix-header-actions">
                    <button class="omnix-minimize-btn" onclick="toggleMinimize()" title="Minimize" aria-label="Minimize">
                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                             <path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V5C18 3.9 17.1 3 16 3H8C6.9 3 6 3.9 6 5V19ZM8 5H16V19H8V5Z" fill="currentColor"/>
                         </svg>
                    </button>
                    <button class="omnix-chatbot-close" onclick="toggleChatbot()" title="Close" aria-label="Close">
                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                             <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
                         </svg>
                    </button>
                </div>
            </div>
            <div class="omnix-chatbot-messages" id="omnix-messages"></div>
            <div class="omnix-chatbot-input-container">
                <div class="omnix-input-wrapper">
                    <input type="text" id="omnix-input" placeholder="Type your message..." onkeypress="handleKeyPress(event)">
                    <div class="omnix-input-actions">
                        ${
                          voiceConfig.enabled
                            ? `
                            <button id="omnix-voice-mic" class="omnix-voice-btn" onclick="toggleVoiceInput()" title="Voice Input" aria-label="Voice input">
                                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                     <path d="M12 1C10.34 1 9 2.34 9 4V12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12V4C15 2.34 13.66 1 12 1Z" fill="currentColor"/>
                                     <path d="M19 10V12C19 15.87 15.87 19 12 19C8.13 19 5 15.87 5 12V10H7V12C7 14.76 9.24 17 12 17C14.76 17 17 14.76 17 12V10H19Z" fill="currentColor"/>
                                     <path d="M11 22H13V24H11V22Z" fill="currentColor"/>
                                     <path d="M7 22H9V24H7V22Z" fill="currentColor"/>
                                     <path d="M15 22H17V24H15V22Z" fill="currentColor"/>
                                 </svg>
                            </button>
                        `
                            : ""
                        }
                        <button onclick="sendMessage()" class="omnix-send-btn" aria-label="Send message">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="currentColor"/>
                            </svg>
                        </button>
                    </div>
                </div>
                ${
                  voiceConfig.enabled
                    ? `
                    <div class="omnix-voice-controls">
                        <button id="omnix-voice-speaker" class="omnix-voice-control-btn" onclick="toggleVoiceOutput()" title="Voice Output">
                             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                 <path d="M3 9V15H7L12 20V4L7 9H3Z" fill="currentColor"/>
                                 <path d="M16.5 12C16.5 10.23 15.48 8.71 14 7.97V16.02C15.48 15.29 16.5 13.77 16.5 12Z" fill="currentColor"/>
                                 <path d="M14 3.23V5.29C16.89 6.15 19 8.83 19 12C19 15.17 16.89 17.85 14 18.71V20.77C18.01 19.86 21 16.28 21 12C21 7.72 18.01 4.14 14 3.23Z" fill="currentColor"/>
                             </svg> Speak last reply
                        </button>
                    </div>
                `
                    : ""
                }
            </div>
        </div>
        <button class="omnix-chatbot-toggle" onclick="toggleChatbot()" aria-label="Open chat">
            <div class="omnix-toggle-content">
                 <div class="omnix-toggle-avatar">
                     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                         <!-- Full blue circle covering the entire button -->
                         <circle cx="6" cy="6" r="6" fill="#3B82F6"/>
                         <!-- Large white message box filling most of the circle -->
                         <path d="M6 8C6 6.9 6.9 6 8 6H16C17.1 6 18 6.9 18 8V14C18 15.1 17.1 16 16 16H12L9 19V16H8C6.9 16 6 15.1 6 14V8Z" 
                               fill="white"/>
                         <!-- Message box tail -->
                         <path d="M9 19L6 22L9 20.5L12 22L9 19Z" 
                               fill="white"/>
                     </svg>
                 </div>
                <div class="omnix-toggle-badge">
                    <span class="omnix-badge-dot"></span>
                </div>
            </div>
        </button>
    `

  // Add styles
  const styles = document.createElement("style")
  styles.textContent = `
        :root {
            --brand: #1E88E5;      /* primary blue */
            --accent: #22D3EE;     /* cyan accent for mic glow */
            --bg: #FFFFFF;         /* white background */
            --bg-subtle: #F1F5F9;  /* soft neutral surface */
            --text: #0F172A;       /* slate-900 */
        }

        #omnix-chatbot-widget {
            position: fixed;
            ${position.includes("right") ? "right: 20px;" : "left: 20px;"}
            ${position.includes("bottom") ? "bottom: 20px;" : "top: 20px;"}
            z-index: 9999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            color: var(--text);
        }

        .omnix-chatbot-container {
            position: relative; /* for absolute mic button positioning */
            width: 380px;
            height: 600px;
            background: var(--bg);
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15), 0 8px 25px rgba(0, 0, 0, 0.08);
            display: none;
            flex-direction: column;
            overflow: hidden;
            border: 1px solid rgba(15, 23, 42, 0.06);
        }
        .omnix-chatbot-container.open { display: flex; animation: slideUp 0.3s ease-out; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.96);} to {opacity:1; transform: translateY(0) scale(1);} }

        /* Hero header */
        .omnix-chatbot-header {
             background: linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%);
            padding: 20px 20px 10px 20px;
            display: grid;
            grid-template-columns: 1fr auto;
            align-items: start;
            position: relative;
            min-height: 160px;
        }
        .omnix-chatbot-title { display: flex; flex-direction: column; gap: 10px; z-index: 1; }
        .omnix-hero-title {
            font-size: 22px;
            line-height: 1.25;
            font-weight: 700;
            letter-spacing: -0.01em;
             color: white;
        }
         .omnix-hero-accent { color: #E0F2FE; font-weight: 800; }
        .omnix-hero-bubble {
            display: inline-block;
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: var(--text);
            font-size: 13px;
            padding: 10px 12px;
            border-radius: 12px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.1);
            max-width: 75%;
            backdrop-filter: blur(10px);
        }

        /* Header actions */
        .omnix-header-actions {
            display: flex;
            gap: 8px;
            z-index: 2;
        }
        .omnix-minimize-btn, .omnix-chatbot-close {
             background: rgba(255, 255, 255, 0.2);
             border: 1px solid rgba(255, 255, 255, 0.3);
             color: white;
            width: 32px; height: 32px;
            border-radius: 8px;
            cursor: pointer;
            display: inline-flex; align-items: center; justify-content: center;
            transition: transform 0.2s ease, background 0.2s ease;
             backdrop-filter: blur(10px);
         }
         .omnix-minimize-btn:hover, .omnix-chatbot-close:hover { 
             background: rgba(255, 255, 255, 0.3); 
             transform: scale(1.05); 
         }
         .omnix-minimize-btn svg, .omnix-chatbot-close svg { 
             width: 16px; 
             height: 16px; 
             fill: currentColor; 
         }

        /* Messages */
        .omnix-chatbot-messages {
            flex: 1;
            padding: 16px 16px 28px 16px;
            overflow-y: auto;
            background: var(--bg);
            scroll-behavior: smooth;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
        }
        .omnix-chatbot-messages::-webkit-scrollbar { width: 4px; }
        .omnix-chatbot-messages::-webkit-scrollbar-thumb { background: rgba(15,23,42,0.12); border-radius: 2px; }

        .omnix-message {
            margin-bottom: 12px;
            padding: 14px 16px;
            border-radius: 16px;
            max-width: 85%;
            word-wrap: break-word;
            position: relative;
            animation: messageSlide 0.25s ease-out;
            font-size: 14px;
        }
        @keyframes messageSlide { from {opacity:0; transform: translateY(8px)} to {opacity:1; transform: translateY(0)} }

        .omnix-message.user {
            background: var(--brand);
            color: #fff;
            margin-left: auto;
            text-align: right;
            box-shadow: 0 4px 12px rgba(30, 136, 229, 0.25);
        }
        .omnix-message.bot {
            background: var(--bg);
            color: var(--text);
            border: 1px solid rgba(15,23,42,0.08);
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
             text-align: left;
             margin-right: auto;
        }

        /* Input */
        .omnix-chatbot-input-container {
            padding: 14px 16px 18px 16px;
            background: var(--bg);
            border-top: 1px solid rgba(15,23,42,0.06);
        }
        .omnix-input-wrapper {
            position: relative;
            display: flex; align-items: center;
            background: var(--bg-subtle);
            border: 1px solid rgba(15,23,42,0.10);
            border-radius: 20px;
            padding: 6px 8px;
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .omnix-input-wrapper:focus-within {
            border-color: var(--brand);
            box-shadow: 0 0 0 3px rgba(30,136,229,0.12);
        }
        .omnix-input-wrapper input {
            flex: 1; border: none; background: transparent;
            padding: 10px 12px; font-size: 14px; outline: none; color: var(--text);
        }
        .omnix-input-wrapper input::placeholder { color: rgba(15,23,42,0.45); }

        .omnix-input-actions { display: flex; gap: 6px; align-items: center; }

        /* Mic "FAB" and glow ring (center-bottom) */
        .omnix-voice-btn {
            background: var(--brand);
            color: #fff;
            border: none;
            border-radius: 50%;
            width: 36px; height: 36px;
            cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            box-shadow: 0 2px 8px rgba(30,136,229,0.28);
        }
        /* Move/scale the mic to center-bottom if voice is enabled */
        #omnix-voice-mic {
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            bottom: 92px; /* floats above the input area */
            width: 64px;
            height: 64px;
            font-size: 22px;
            box-shadow:
              0 4px 14px rgba(34,211,238,0.35),
              0 0 0 6px rgba(34,211,238,0.20);
            transition: box-shadow 0.25s ease, transform 0.2s ease;
        }
        #omnix-voice-mic:hover { transform: translateX(-50%) scale(1.05); }
         #omnix-voice-mic svg { 
             width: 20px; 
             height: 20px; 
             fill: currentColor; 
         }
        #omnix-voice-mic.listening {
            animation: omnixPulse 1.6s infinite;
            background: var(--accent);
        }
        @keyframes omnixPulse {
            0%   { box-shadow: 0 4px 14px rgba(34,211,238,0.35), 0 0 0 6px rgba(34,211,238,0.20); }
            70%  { box-shadow: 0 4px 14px rgba(34,211,238,0.45), 0 0 0 14px rgba(34,211,238,0.10); }
            100% { box-shadow: 0 4px 14px rgba(34,211,238,0.35), 0 0 0 6px rgba(34,211,238,0.20); }
        }

        .omnix-send-btn {
            background: var(--brand);
            color: white;
            border: none;
            border-radius: 50%;
            width: 36px; height: 36px;
            cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            box-shadow: 0 2px 8px rgba(30,136,229,0.28);
        }
        .omnix-send-btn:hover { transform: scale(1.05); box-shadow: 0 4px 12px rgba(30,136,229,0.36); }
         .omnix-send-btn svg { 
             width: 16px; 
             height: 16px; 
             fill: currentColor; 
         }

        /* Voice controls small */
        .omnix-voice-controls { margin-top: 10px; display: flex; justify-content: center; }
        .omnix-voice-control-btn {
            background: var(--bg-subtle);
            color: var(--text);
            border: 1px solid rgba(15,23,42,0.10);
            border-radius: 16px;
            padding: 8px 14px;
            cursor: pointer;
            font-size: 12px;
            transition: background 0.2s ease, color 0.2s ease;
             display: flex;
             align-items: center;
             gap: 6px;
        }
        .omnix-voice-control-btn:hover { background: #E7EEF6; }
         .omnix-voice-control-btn svg { 
             width: 14px; 
             height: 14px; 
             fill: currentColor; 
         }

        /* Toggle button with mic look */
        .omnix-chatbot-toggle {
            width: 70px; height: 70px;
            background: var(--bg);
            border: none;
            border-radius: 50%;
            cursor: pointer;
            box-shadow:
              0 8px 22px rgba(30,136,229,0.25),
              inset 0 0 0 2px rgba(15,23,42,0.06);
            display: flex; align-items: center; justify-content: center;
            transition: transform 0.25s ease, box-shadow 0.25s ease;
            position: relative; overflow: hidden;
        }
        .omnix-chatbot-toggle:hover { transform: scale(1.06); box-shadow: 0 12px 30px rgba(30,136,229,0.33), inset 0 0 0 2px rgba(15,23,42,0.08); }
        .omnix-toggle-avatar {
            width: 50px; height: 50px;
            background: var(--brand);
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            border: 2px solid rgba(255,255,255,0.9);
            box-shadow: 0 2px 10px rgba(30,136,229,0.35);
        }
         .omnix-toggle-avatar svg { 
             width: 24px; 
             height: 24px; 
             fill: currentColor; 
         }
        .omnix-toggle-badge { position: absolute; top: -5px; right: -5px; width:20px; height:20px; background:#10b981; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #fff; }
        .omnix-badge-dot { width:8px; height:8px; background:#fff; border-radius:50%; animation:pulse 2s infinite; }
        @keyframes pulse { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-3px)} }

        /* Typing indicator and nav buttons */
        .omnix-typing { display:flex; align-items:center; gap:6px; color: rgba(15,23,42,0.6); font-style: italic; font-size: 14px; }
        .omnix-typing-dots { width:6px; height:6px; background: rgba(15,23,42,0.6); border-radius:50%; animation: typing 1.4s infinite; }
        .omnix-typing-dots:nth-child(2){ animation-delay:.2s } .omnix-typing-dots:nth-child(3){ animation-delay:.4s }
        @keyframes typing { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }

        .omnix-navigation-buttons { margin-top: 10px; display:flex; flex-direction:column; gap:8px; }
        .omnix-nav-button {
            background: var(--bg-subtle);
            border: 1px solid rgba(15,23,42,0.10);
            border-radius: 12px;
            padding: 12px 14px;
            font-size: 14px; color: var(--text);
            cursor: pointer; transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease;
            text-align: left; display: flex; align-items: center; gap: 8px; font-weight: 600;
        }
        .omnix-nav-button:hover { background: #E7EEF6; border-color: rgba(15,23,42,0.18); transform: translateY(-1px); }

        @media (max-width: 480px) {
            .omnix-chatbot-container {
                width: calc(100vw - 20px);
                height: calc(100vh - 20px);
                max-height: 600px;
                border-radius: 15px;
            }
            #omnix-voice-mic { bottom: 88px; width: 60px; height: 60px; }
            .omnix-chatbot-toggle { width: 64px; height: 64px; }
            .omnix-toggle-avatar { width: 46px; height: 46px; }
        }
    `

  document.head.appendChild(styles)
  document.body.appendChild(widget)

  // Global state
  let isOpen = false
  let isMinimized = false

  // Initialize voice recognition
  if (voiceConfig.enabled && "webkitSpeechRecognition" in window) {
    const SpeechRecognition = window.webkitSpeechRecognition
    recognition = new SpeechRecognition()
    recognition.continuous = voiceConfig.continuous
    recognition.interimResults = voiceConfig.interimResults
    recognition.lang = voiceConfig.language

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      document.getElementById("omnix-input").value = transcript
      isListening = false
      updateVoiceButton()
    }

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error)
      isListening = false
      updateVoiceButton()
    }

    recognition.onend = () => {
      isListening = false
      updateVoiceButton()
    }

    isVoiceSupported = true
  }

  // Initialize speech synthesis
  if ("speechSynthesis" in window) {
    speechSynthesis = window.speechSynthesis
  }

  // Auto-open if configured
  if (autoOpen) {
    setTimeout(() => {
      window.toggleChatbot() // Use window.toggleChatbot here
    }, 1000)
  }

  // Global functions
  window.toggleChatbot = () => {
    isOpen = !isOpen
    const container = document.querySelector(".omnix-chatbot-container")
    const toggle = document.querySelector(".omnix-chatbot-toggle")

    if (isOpen) {
      container.classList.add("open")
      toggle.style.display = "none"
      document.getElementById("omnix-input").focus()
    } else {
      container.classList.remove("open")
      toggle.style.display = "flex"
    }
  }

  window.toggleMinimize = () => {
    isMinimized = !isMinimized
    const container = document.querySelector(".omnix-chatbot-container")

    if (isMinimized) {
      container.style.height = "60px"
      document.querySelector(".omnix-chatbot-messages").style.display = "none"
      document.querySelector(".omnix-chatbot-input-container").style.display = "none"
    } else {
      container.style.height = "600px"
      document.querySelector(".omnix-chatbot-messages").style.display = "block"
      document.querySelector(".omnix-chatbot-input-container").style.display = "block"
    }
  }

  window.sendMessage = () => {
    const input = document.getElementById("omnix-input")
    const message = input.value.trim()

    if (!message) return

    // Add user message
    addMessage(message, "user")
    input.value = ""

    // Show typing indicator
    showTyping()

    // Check if user is asking for navigation (more specific keywords)
    const navigationKeywords = [
      "go to",
      "navigate to",
      "redirect to",
      "take me to",
      "visit",
      "open page",
      "show page",
      "go to page",
      "navigate",
      "redirect",
    ]
    const hasNavigationIntent = navigationKeywords.some((keyword) => message.toLowerCase().includes(keyword))

    // Use navigation API only if user is asking for navigation, otherwise use chat API
    const apiEndpoint = hasNavigationIntent ? "/api/website-navigation" : "/api/chat"
    const requestBody = hasNavigationIntent
      ? {
          message: message,
          currentPath: window.location.pathname,
          botId: botId,
        }
      : {
          message: message,
          botId: botId,
        }

    // Send to appropriate API
    fetch(`${apiUrl}${apiEndpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify(requestBody),
    })
      .then((response) => response.json())
      .then((data) => {
        hideTyping()
        let botMessage = ""
        if (data.message) {
          botMessage = data.message
          addMessage(botMessage, "bot")

          // Add navigation buttons only if user asked for navigation and actions are available
          if (hasNavigationIntent && data.navigationActions && data.navigationActions.length > 0) {
            addNavigationButtons(data.navigationActions)
          }
        } else {
          botMessage = "Sorry, I encountered an error. Please try again."
          addMessage(botMessage, "bot")
        }

        // Auto-speak the response if enabled
        if (voiceConfig.autoSpeak && voiceConfig.enabled && botMessage) {
          setTimeout(() => {
            speakText(botMessage)
          }, 500)
        }

        // Auto-navigate only if user asked for navigation and auto-navigate is enabled
        if (hasNavigationIntent && data.autoNavigate) {
          handleAutoNavigation(data.autoNavigate)
        }
      })
      .catch((error) => {
        hideTyping()
        console.error("Chatbot error:", error)
        addMessage("Sorry, I encountered an error. Please try again.", "bot")
      })
  }

  window.handleKeyPress = (event) => {
    if (event.key === "Enter") {
      window.sendMessage() // Use window.sendMessage here
    }
  }

  // Voice control functions
  window.toggleVoiceInput = () => {
    if (!recognition || !isVoiceSupported) {
      addMessage("Voice input not supported in this browser", "bot")
      return
    }

    if (isListening) {
      recognition.stop()
    } else {
      recognition.start()
    }
  }

  window.toggleVoiceOutput = () => {
    const lastMessage = document.querySelector(".omnix-message.bot:last-child")
    if (lastMessage) {
      speakText(lastMessage.textContent)
    } else {
      addMessage("No message to speak", "bot")
    }
  }

  function addMessage(text, sender) {
    const messagesContainer = document.getElementById("omnix-messages")
    const messageDiv = document.createElement("div")
    messageDiv.className = `omnix-message ${sender}`
    messageDiv.textContent = text
    messagesContainer.appendChild(messageDiv)
    messagesContainer.scrollTop = messagesContainer.scrollHeight
  }

  function addNavigationButtons(actions) {
    const messagesContainer = document.getElementById("omnix-messages")
    const buttonContainer = document.createElement("div")
    buttonContainer.className = "omnix-navigation-buttons"

    actions.forEach((action) => {
      const button = document.createElement("button")
      button.className = "omnix-nav-button"
      button.textContent = action.label
      button.onclick = () => handleNavigation(action)
      buttonContainer.appendChild(button)
    })

    messagesContainer.appendChild(buttonContainer)
    messagesContainer.scrollTop = messagesContainer.scrollHeight
  }

  function handleNavigation(action) {
    console.log("Handling navigation:", action)

    if (action.action === "navigate" && action.path) {
      if (action.path.startsWith("#")) {
        // Scroll to section
        const element = document.getElementById(action.path.substring(1))
        if (element) {
          element.scrollIntoView({ behavior: "smooth" })
        }
      } else if (action.path.startsWith("http://") || action.path.startsWith("https://")) {
        // External URL - open in new tab
        console.log("Opening external URL:", action.path)
        window.open(action.path, "_blank")
      } else {
        // Internal page navigation
        const cleanPath = action.path.startsWith("/") ? action.path : `/${action.path}`
        console.log("Navigating to internal page:", cleanPath)
        window.location.assign(cleanPath)
      }
    } else if (action.action === "scroll" && action.section) {
      const element = document.getElementById(action.section)
      if (element) {
        element.scrollIntoView({ behavior: "smooth" })
      }
    } else if (action.action === "link" && action.path) {
      window.open(action.path, "_blank")
    }
  }

  function handleAutoNavigation(action) {
    if (isAutoNavigating) return

    isAutoNavigating = true
    showNavigationIndicator()

    // Add navigation message
    addMessage(`Auto-navigating you to ${action.path || action.section} in a moment...`, "bot")

    // Clear any existing timeout
    if (navigationTimeout) {
      clearTimeout(navigationTimeout)
    }

    // Navigate after delay
    navigationTimeout = setTimeout(() => {
      handleNavigation(action)
      hideNavigationIndicator()
      isAutoNavigating = false
    }, navigationDelay * 1000)
  }

  function showNavigationIndicator() {
    const header = document.querySelector(".omnix-chatbot-title")
    if (header) {
      const indicator = document.createElement("span")
      indicator.id = "omnix-nav-indicator"
      indicator.className = "omnix-nav-indicator"
      indicator.textContent = " Navigating..."
      header.appendChild(indicator)
    }
  }

  function hideNavigationIndicator() {
    const indicator = document.getElementById("omnix-nav-indicator")
    if (indicator) {
      indicator.remove()
    }
  }

  function showTyping() {
    const messagesContainer = document.getElementById("omnix-messages")
    const typingDiv = document.createElement("div")
    typingDiv.id = "omnix-typing-indicator"
    typingDiv.className = "omnix-typing"
    typingDiv.innerHTML = `
            <span>${botName} is typing</span>
            <div class="omnix-typing-dots"></div>
            <div class="omnix-typing-dots"></div>
            <div class="omnix-typing-dots"></div>
        `
    messagesContainer.appendChild(typingDiv)
    messagesContainer.scrollTop = messagesContainer.scrollHeight
  }

  function hideTyping() {
    const typingDiv = document.getElementById("omnix-typing-indicator")
    if (typingDiv) {
      typingDiv.remove()
    }
  }

  function updateVoiceButton() {
    const micBtn = document.getElementById("omnix-voice-mic")
    if (micBtn) {
      if (isListening) {
        micBtn.classList.add("listening")
      } else {
        micBtn.classList.remove("listening")
      }
    }
  }

  function speakText(text) {
    if (!speechSynthesis) return

    // Stop any current speech
    speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = voiceConfig.rate
    utterance.pitch = voiceConfig.pitch
    utterance.volume = voiceConfig.volume
    utterance.lang = voiceConfig.language

    utterance.onstart = () => {
      const speakerBtn = document.getElementById("omnix-voice-speaker")
      if (speakerBtn) {
        speakerBtn.classList.add("speaking")
      }
    }

    utterance.onend = () => {
      const speakerBtn = document.getElementById("omnix-voice-speaker")
      if (speakerBtn) {
        speakerBtn.classList.remove("speaking")
      }
    }

    speechSynthesis.speak(utterance)
  }

  // Welcome message is displayed in the header bubble, no need for duplicate
})()
