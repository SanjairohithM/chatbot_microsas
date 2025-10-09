<?php
/**
 * Force Voice Fix for OmniX Smart Sync
 * Add this to your theme's functions.php or as a separate plugin
 */

// Force enable voice features
add_action('wp_footer', 'omnix_force_voice_features', 999);

function omnix_force_voice_features() {
    // Only run if OmniX Smart Sync is active
    if (!class_exists('OmniX_Smart_Sync')) {
        return;
    }
    
    // Get current settings
    $access_token = get_option('omnix_smart_sync_access_token', '');
    $sync_enabled = get_option('omnix_smart_sync_enabled', false);
    $bot_id = get_option('omnix_smart_sync_bot_id', '');
    $api_url = get_option('omnix_smart_sync_api_url', 'https://1016271b626b.ngrok-free.app');
    
    if (!$access_token || !$sync_enabled || !$bot_id) {
        return;
    }
    
    // Force voice settings
    $voice_enabled = true;
    $voice_language = 'en-US';
    $voice_rate = '1.0';
    $voice_pitch = '1.0';
    $voice_volume = '1.0';
    $auto_speak = false;
    $voice_continuous = false;
    $voice_interim_results = false;
    
    ?>
    <script>
    // Force voice configuration
    if (typeof window.omnixChatbot !== 'undefined') {
        window.omnixChatbot.enableVoice = true;
        window.omnixChatbot.voiceLanguage = "<?php echo esc_js($voice_language); ?>";
        window.omnixChatbot.voiceRate = <?php echo esc_js($voice_rate); ?>;
        window.omnixChatbot.voicePitch = <?php echo esc_js($voice_pitch); ?>;
        window.omnixChatbot.voiceVolume = <?php echo esc_js($voice_volume); ?>;
        window.omnixChatbot.autoSpeak = <?php echo $auto_speak ? 'true' : 'false'; ?>;
        window.omnixChatbot.voiceContinuous = <?php echo $voice_continuous ? 'true' : 'false'; ?>;
        window.omnixChatbot.voiceInterimResults = <?php echo $voice_interim_results ? 'true' : 'false'; ?>;
        
        console.log('🎤 Voice features forced enabled:', window.omnixChatbot);
    }
    
    // Force voice buttons to show after widget loads
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(function() {
            const widget = document.getElementById('omnix-chatbot-widget');
            if (widget) {
                // Force voice buttons to be visible
                const voiceButtons = widget.querySelectorAll('.omnix-voice-button, [data-voice]');
                voiceButtons.forEach(button => {
                    button.style.display = 'block !important';
                    button.style.visibility = 'visible !important';
                });
                
                // Add voice buttons if they don't exist
                const inputArea = widget.querySelector('.omnix-input-area, .chat-input, .message-input');
                if (inputArea && !inputArea.querySelector('.omnix-voice-button')) {
                    const micButton = document.createElement('button');
                    micButton.className = 'omnix-voice-button omnix-mic-button';
                    micButton.innerHTML = '🎤';
                    micButton.title = 'Voice Input';
                    micButton.style.cssText = 'background: #007cba; color: white; border: none; border-radius: 50%; width: 40px; height: 40px; margin: 5px; cursor: pointer; font-size: 16px;';
                    
                    const speakerButton = document.createElement('button');
                    speakerButton.className = 'omnix-voice-button omnix-speaker-button';
                    speakerButton.innerHTML = '🔊';
                    speakerButton.title = 'Voice Output';
                    speakerButton.style.cssText = 'background: #28a745; color: white; border: none; border-radius: 50%; width: 40px; height: 40px; margin: 5px; cursor: pointer; font-size: 16px;';
                    
                    inputArea.appendChild(micButton);
                    inputArea.appendChild(speakerButton);
                    
                    console.log('🎤 Voice buttons added manually');
                }
            }
        }, 2000);
    });
    </script>
    <?php
}
?>
