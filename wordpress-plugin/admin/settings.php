<?php
if (!defined('ABSPATH')) {
    exit;
}

// Handle form submission
if (isset($_POST['submit'])) {
    check_admin_referer('omnix_chatbot_settings');
    
    update_option('omnix_chatbot_api_url', sanitize_url($_POST['omnix_chatbot_api_url']));
    update_option('omnix_chatbot_api_key', sanitize_text_field($_POST['omnix_chatbot_api_key']));
    update_option('omnix_chatbot_default_permissions', sanitize_text_field($_POST['omnix_chatbot_default_permissions']));
    update_option('omnix_chatbot_token_expiry_days', intval($_POST['omnix_chatbot_token_expiry_days']));
    update_option('omnix_chatbot_enable_logging', isset($_POST['omnix_chatbot_enable_logging']));
    update_option('omnix_chatbot_max_requests_per_hour', intval($_POST['omnix_chatbot_max_requests_per_hour']));
    
    // Voice settings
    update_option('omnix_chatbot_voice_language', sanitize_text_field($_POST['omnix_chatbot_voice_language']));
    update_option('omnix_chatbot_voice_rate', floatval($_POST['omnix_chatbot_voice_rate']));
    update_option('omnix_chatbot_voice_pitch', floatval($_POST['omnix_chatbot_voice_pitch']));
    update_option('omnix_chatbot_voice_volume', floatval($_POST['omnix_chatbot_voice_volume']));
    update_option('omnix_chatbot_auto_speak', isset($_POST['omnix_chatbot_auto_speak']));
    
    echo '<div class="notice notice-success"><p>Settings saved successfully!</p></div>';
}

// Get current settings
$api_url = get_option('omnix_chatbot_api_url', '');
$api_key = get_option('omnix_chatbot_api_key', '');
$default_permissions = get_option('omnix_chatbot_default_permissions', 'chat,analytics,conversations');
$token_expiry_days = get_option('omnix_chatbot_token_expiry_days', 365);
$enable_logging = get_option('omnix_chatbot_enable_logging', true);
$max_requests_per_hour = get_option('omnix_chatbot_max_requests_per_hour', 1000);
?>

<div class="wrap">
    <h1><?php _e('OmniX Chatbot Settings', 'omnix-chatbot'); ?></h1>
    
    <form method="post" action="">
        <?php wp_nonce_field('omnix_chatbot_settings'); ?>
        
        <table class="form-table">
            <tr>
                <th scope="row">
                    <label for="omnix_chatbot_api_url"><?php _e('API Base URL', 'omnix-chatbot'); ?></label>
                </th>
                <td>
                    <input type="url" id="omnix_chatbot_api_url" name="omnix_chatbot_api_url" 
                           value="<?php echo esc_attr($api_url); ?>" class="regular-text" required>
                    <p class="description">
                        <?php _e('The base URL of your OmniX Chatbot API (e.g., https://your-domain.com)', 'omnix-chatbot'); ?>
                    </p>
                </td>
            </tr>
            
            <tr>
                <th scope="row">
                    <label for="omnix_chatbot_api_key"><?php _e('API Key', 'omnix-chatbot'); ?></label>
                </th>
                <td>
                    <input type="password" id="omnix_chatbot_api_key" name="omnix_chatbot_api_key" 
                           value="<?php echo esc_attr($api_key); ?>" class="regular-text" required>
                    <p class="description">
                        <?php _e('Your OmniX Chatbot API key for authentication', 'omnix-chatbot'); ?>
                    </p>
                </td>
            </tr>
            
            <tr>
                <th scope="row">
                    <label for="omnix_chatbot_default_permissions"><?php _e('Default Permissions', 'omnix-chatbot'); ?></label>
                </th>
                <td>
                    <input type="text" id="omnix_chatbot_default_permissions" name="omnix_chatbot_default_permissions" 
                           value="<?php echo esc_attr($default_permissions); ?>" class="regular-text">
                    <p class="description">
                        <?php _e('Comma-separated list of default permissions for new tokens (e.g., chat,analytics,conversations)', 'omnix-chatbot'); ?>
                    </p>
                </td>
            </tr>
            
            <tr>
                <th scope="row">
                    <label for="omnix_chatbot_token_expiry_days"><?php _e('Token Expiry (Days)', 'omnix-chatbot'); ?></label>
                </th>
                <td>
                    <input type="number" id="omnix_chatbot_token_expiry_days" name="omnix_chatbot_token_expiry_days" 
                           value="<?php echo esc_attr($token_expiry_days); ?>" min="0" max="3650" class="small-text">
                    <p class="description">
                        <?php _e('Default number of days until tokens expire (0 = never expires)', 'omnix-chatbot'); ?>
                    </p>
                </td>
            </tr>
            
            <tr>
                <th scope="row">
                    <label for="omnix_chatbot_enable_logging"><?php _e('Enable API Logging', 'omnix-chatbot'); ?></label>
                </th>
                <td>
                    <label>
                        <input type="checkbox" id="omnix_chatbot_enable_logging" name="omnix_chatbot_enable_logging" 
                               value="1" <?php checked($enable_logging); ?>>
                        <?php _e('Log all API requests and responses', 'omnix-chatbot'); ?>
                    </label>
                    <p class="description">
                        <?php _e('Enable this to track API usage and debug issues. Logs are stored in the database.', 'omnix-chatbot'); ?>
                    </p>
                </td>
            </tr>
            
            <tr>
                <th scope="row">
                    <label for="omnix_chatbot_max_requests_per_hour"><?php _e('Rate Limit (Requests/Hour)', 'omnix-chatbot'); ?></label>
                </th>
                <td>
                    <input type="number" id="omnix_chatbot_max_requests_per_hour" name="omnix_chatbot_max_requests_per_hour" 
                           value="<?php echo esc_attr($max_requests_per_hour); ?>" min="1" max="10000" class="small-text">
                    <p class="description">
                        <?php _e('Maximum number of API requests allowed per hour per token', 'omnix-chatbot'); ?>
                    </p>
                </td>
            </tr>
        </table>
        
        <h2><?php _e('Security Settings', 'omnix-chatbot'); ?></h2>
        <table class="form-table">
            <tr>
                <th scope="row"><?php _e('Token Security', 'omnix-chatbot'); ?></th>
                <td>
                    <div class="omnix-security-info">
                        <p><strong><?php _e('Access Tokens:', 'omnix-chatbot'); ?></strong> <?php _e('Used for API authentication. Store securely and never expose in client-side code.', 'omnix-chatbot'); ?></p>
                        <p><strong><?php _e('Secret Keys:', 'omnix-chatbot'); ?></strong> <?php _e('Used for additional security validation. Keep confidential and rotate regularly.', 'omnix-chatbot'); ?></p>
                        <p><strong><?php _e('HTTPS Required:', 'omnix-chatbot'); ?></strong> <?php _e('Always use HTTPS when transmitting tokens over the network.', 'omnix-chatbot'); ?></p>
                    </div>
                </td>
            </tr>
            
            <tr>
                <th scope="row"><?php _e('CORS Settings', 'omnix-chatbot'); ?></th>
                <td>
                    <div class="omnix-cors-info">
                        <p><?php _e('The plugin automatically handles CORS headers for API requests. If you need to restrict access to specific domains, modify the CORS headers in the plugin code.', 'omnix-chatbot'); ?></p>
                        <code>Access-Control-Allow-Origin: *</code>
                    </div>
                </td>
            </tr>
        </table>
        
        <h2><?php _e('Voice Settings', 'omnix-chatbot'); ?></h2>
        <table class="form-table">
            <tr>
                <th scope="row"><?php _e('Default Voice Language', 'omnix-chatbot'); ?></th>
                <td>
                    <select id="omnix_chatbot_voice_language" name="omnix_chatbot_voice_language">
                        <option value="en-US" <?php selected(get_option('omnix_chatbot_voice_language', 'en-US'), 'en-US'); ?>>English (US)</option>
                        <option value="en-GB" <?php selected(get_option('omnix_chatbot_voice_language', 'en-US'), 'en-GB'); ?>>English (UK)</option>
                        <option value="es-ES" <?php selected(get_option('omnix_chatbot_voice_language', 'en-US'), 'es-ES'); ?>>Spanish</option>
                        <option value="fr-FR" <?php selected(get_option('omnix_chatbot_voice_language', 'en-US'), 'fr-FR'); ?>>French</option>
                        <option value="de-DE" <?php selected(get_option('omnix_chatbot_voice_language', 'en-US'), 'de-DE'); ?>>German</option>
                        <option value="it-IT" <?php selected(get_option('omnix_chatbot_voice_language', 'en-US'), 'it-IT'); ?>>Italian</option>
                        <option value="pt-BR" <?php selected(get_option('omnix_chatbot_voice_language', 'en-US'), 'pt-BR'); ?>>Portuguese (Brazil)</option>
                        <option value="ja-JP" <?php selected(get_option('omnix_chatbot_voice_language', 'en-US'), 'ja-JP'); ?>>Japanese</option>
                        <option value="ko-KR" <?php selected(get_option('omnix_chatbot_voice_language', 'en-US'), 'ko-KR'); ?>>Korean</option>
                        <option value="zh-CN" <?php selected(get_option('omnix_chatbot_voice_language', 'en-US'), 'zh-CN'); ?>>Chinese (Simplified)</option>
                    </select>
                    <p class="description"><?php _e('Default language for voice recognition and speech synthesis', 'omnix-chatbot'); ?></p>
                </td>
            </tr>
            
            <tr>
                <th scope="row"><?php _e('Default Voice Rate', 'omnix-chatbot'); ?></th>
                <td>
                    <input type="range" id="omnix_chatbot_voice_rate" name="omnix_chatbot_voice_rate" 
                           value="<?php echo esc_attr(get_option('omnix_chatbot_voice_rate', 1.0)); ?>" 
                           min="0.1" max="2.0" step="0.1" class="regular-text">
                    <span id="voice_rate_value"><?php echo esc_attr(get_option('omnix_chatbot_voice_rate', 1.0)); ?></span>
                    <p class="description"><?php _e('Speech rate for text-to-speech (0.1 = very slow, 2.0 = very fast)', 'omnix-chatbot'); ?></p>
                </td>
            </tr>
            
            <tr>
                <th scope="row"><?php _e('Default Voice Pitch', 'omnix-chatbot'); ?></th>
                <td>
                    <input type="range" id="omnix_chatbot_voice_pitch" name="omnix_chatbot_voice_pitch" 
                           value="<?php echo esc_attr(get_option('omnix_chatbot_voice_pitch', 1.0)); ?>" 
                           min="0.1" max="2.0" step="0.1" class="regular-text">
                    <span id="voice_pitch_value"><?php echo esc_attr(get_option('omnix_chatbot_voice_pitch', 1.0)); ?></span>
                    <p class="description"><?php _e('Voice pitch for text-to-speech (0.1 = very low, 2.0 = very high)', 'omnix-chatbot'); ?></p>
                </td>
            </tr>
            
            <tr>
                <th scope="row"><?php _e('Default Voice Volume', 'omnix-chatbot'); ?></th>
                <td>
                    <input type="range" id="omnix_chatbot_voice_volume" name="omnix_chatbot_voice_volume" 
                           value="<?php echo esc_attr(get_option('omnix_chatbot_voice_volume', 1.0)); ?>" 
                           min="0.1" max="1.0" step="0.1" class="regular-text">
                    <span id="voice_volume_value"><?php echo esc_attr(get_option('omnix_chatbot_voice_volume', 1.0)); ?></span>
                    <p class="description"><?php _e('Voice volume for text-to-speech (0.1 = very quiet, 1.0 = maximum)', 'omnix-chatbot'); ?></p>
                </td>
            </tr>
            
            <tr>
                <th scope="row"><?php _e('Enable Auto-Speak', 'omnix-chatbot'); ?></th>
                <td>
                    <label>
                        <input type="checkbox" id="omnix_chatbot_auto_speak" name="omnix_chatbot_auto_speak" 
                               value="1" <?php checked(get_option('omnix_chatbot_auto_speak', false)); ?>>
                        <?php _e('Automatically speak assistant responses', 'omnix-chatbot'); ?>
                    </label>
                    <p class="description"><?php _e('When enabled, the chatbot will automatically speak its responses', 'omnix-chatbot'); ?></p>
                </td>
            </tr>
        </table>
        
        <h2><?php _e('Integration Settings', 'omnix-chatbot'); ?></h2>
        <table class="form-table">
            <tr>
                <th scope="row"><?php _e('Widget Script', 'omnix-chatbot'); ?></th>
                <td>
                    <p><?php _e('The chatbot widget script is automatically loaded on all pages. To disable automatic loading, add this to your theme\'s functions.php:', 'omnix-chatbot'); ?></p>
                    <pre><code>remove_action('wp_enqueue_scripts', array('OmniXChatbotPlugin', 'enqueue_scripts'));</code></pre>
                </td>
            </tr>
            
            <tr>
                <th scope="row"><?php _e('Shortcode Support', 'omnix-chatbot'); ?></th>
                <td>
                    <p><?php _e('Available shortcodes:', 'omnix-chatbot'); ?></p>
                    <ul>
                        <li><code>[omnix_chatbot]</code> - <?php _e('Full chatbot widget', 'omnix-chatbot'); ?></li>
                        <li><code>[omnix_chatbot_widget]</code> - <?php _e('Alias for omnix_chatbot', 'omnix-chatbot'); ?></li>
                    </ul>
                </td>
            </tr>
        </table>
        
        <h2><?php _e('API Endpoints', 'omnix-chatbot'); ?></h2>
        <table class="form-table">
            <tr>
                <th scope="row"><?php _e('Available Endpoints', 'omnix-chatbot'); ?></th>
                <td>
                    <div class="omnix-endpoints">
                        <p><strong><?php _e('Chat:', 'omnix-chatbot'); ?></strong> <code><?php echo home_url('/wp-json/omnix-chatbot/v1/chat'); ?></code></p>
                        <p><strong><?php _e('Bots:', 'omnix-chatbot'); ?></strong> <code><?php echo home_url('/wp-json/omnix-chatbot/v1/bots'); ?></code></p>
                        <p><strong><?php _e('Conversations:', 'omnix-chatbot'); ?></strong> <code><?php echo home_url('/wp-json/omnix-chatbot/v1/conversations'); ?></code></p>
                        <p><strong><?php _e('Analytics:', 'omnix-chatbot'); ?></strong> <code><?php echo home_url('/wp-json/omnix-chatbot/v1/analytics'); ?></code></p>
                    </div>
                </td>
            </tr>
        </table>
        
        <?php submit_button(); ?>
    </form>
    
    <div class="omnix-settings-actions">
        <h3><?php _e('Quick Actions', 'omnix-chatbot'); ?></h3>
        <p>
            <button type="button" class="button" onclick="testConnection()">
                <?php _e('Test API Connection', 'omnix-chatbot'); ?>
            </button>
            <a href="<?php echo admin_url('admin.php?page=omnix-chatbot-tokens'); ?>" class="button">
                <?php _e('Manage Access Tokens', 'omnix-chatbot'); ?>
            </a>
            <a href="<?php echo admin_url('admin.php?page=omnix-chatbot-logs'); ?>" class="button">
                <?php _e('View API Logs', 'omnix-chatbot'); ?>
            </a>
        </p>
    </div>
</div>

<style>
.omnix-security-info,
.omnix-cors-info,
.omnix-endpoints {
    background: #f9f9f9;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 15px;
    margin: 10px 0;
}

.omnix-security-info p,
.omnix-cors-info p,
.omnix-endpoints p {
    margin: 5px 0;
}

.omnix-settings-actions {
    background: #fff;
    border: 1px solid #ccd0d4;
    border-radius: 4px;
    padding: 20px;
    margin-top: 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.omnix-settings-actions h3 {
    margin-top: 0;
}

.omnix-settings-actions .button {
    margin-right: 10px;
    margin-bottom: 10px;
}

pre {
    background: #f1f1f1;
    padding: 10px;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 13px;
}

code {
    background: #f1f1f1;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: monospace;
}
</style>

<script>
function testConnection() {
    const button = event.target;
    const originalText = button.textContent;
    
    button.textContent = 'Testing...';
    button.disabled = true;
    
    jQuery.post(ajaxurl, {
        action: 'omnix_test_connection',
        nonce: '<?php echo wp_create_nonce('omnix_chatbot_nonce'); ?>'
    }, function(response) {
        if (response.success) {
            alert('Connection successful!');
        } else {
            alert('Connection failed: ' + response.data);
        }
        
        button.textContent = originalText;
        button.disabled = false;
    });
}

// Handle range slider updates
document.addEventListener('DOMContentLoaded', function() {
    const voiceRateSlider = document.getElementById('omnix_chatbot_voice_rate');
    const voicePitchSlider = document.getElementById('omnix_chatbot_voice_pitch');
    const voiceVolumeSlider = document.getElementById('omnix_chatbot_voice_volume');
    
    if (voiceRateSlider) {
        voiceRateSlider.addEventListener('input', function() {
            document.getElementById('voice_rate_value').textContent = this.value;
        });
    }
    
    if (voicePitchSlider) {
        voicePitchSlider.addEventListener('input', function() {
            document.getElementById('voice_pitch_value').textContent = this.value;
        });
    }
    
    if (voiceVolumeSlider) {
        voiceVolumeSlider.addEventListener('input', function() {
            document.getElementById('voice_volume_value').textContent = this.value;
        });
    }
});
</script>
