<?php
/**
 * OmniX Chatbot API - Installation Script
 * 
 * This script helps with the initial setup of the OmniX Chatbot API plugin
 * Run this script once after uploading the plugin to generate initial configuration
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    // If not in WordPress context, try to load WordPress
    if (file_exists('../../../wp-config.php')) {
        require_once('../../../wp-config.php');
    } else {
        die('This script must be run from within WordPress or with proper WordPress context.');
    }
}

// Check if we're in WordPress admin
if (!is_admin()) {
    die('This script must be run from WordPress admin area.');
}

// Check user capabilities
if (!current_user_can('manage_options')) {
    die('You do not have permission to run this script.');
}

?>
<!DOCTYPE html>
<html>
<head>
    <title>OmniX Chatbot API - Installation</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f1f1f1; }
        .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 800px; margin: 0 auto; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .code { background: #f8f9fa; border: 1px solid #e9ecef; padding: 15px; border-radius: 4px; font-family: monospace; margin: 10px 0; }
        .button { background: #0073aa; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; }
        .button:hover { background: #005a87; }
        .form-group { margin: 20px 0; }
        .form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
        .form-group input { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        .form-group textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; height: 100px; }
        h1 { color: #333; border-bottom: 2px solid #0073aa; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        .step { background: #e7f3ff; border-left: 4px solid #0073aa; padding: 15px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 OmniX Chatbot API - Installation</h1>
        
        <?php
        // Handle form submission
        if ($_POST['action'] === 'install') {
            $api_url = sanitize_url($_POST['api_url']);
            $bot_id = sanitize_text_field($_POST['bot_id']);
            $auto_sync = isset($_POST['auto_sync']);
            $sync_enabled = isset($_POST['sync_enabled']);
            
            if (empty($api_url) || empty($bot_id)) {
                echo '<div class="error">Please fill in all required fields.</div>';
            } else {
                // Update options
                update_option('omnix_chatbot_api_url', $api_url);
                update_option('omnix_chatbot_bot_id', $bot_id);
                update_option('omnix_chatbot_auto_sync', $auto_sync);
                update_option('omnix_chatbot_sync_enabled', $sync_enabled);
                
                // Generate tokens if they don't exist
                if (!get_option('omnix_chatbot_api_token')) {
                    update_option('omnix_chatbot_api_token', 'ox_' . wp_generate_password(32, false, false));
                }
                if (!get_option('omnix_chatbot_secret_key')) {
                    update_option('omnix_chatbot_secret_key', 'ox_sk_' . wp_generate_password(32, false, false));
                }
                if (!get_option('omnix_chatbot_webhook_secret')) {
                    update_option('omnix_chatbot_webhook_secret', 'ox_wh_' . wp_generate_password(32, false, false));
                }
                
                echo '<div class="success">✅ Installation completed successfully!</div>';
                echo '<div class="info">You can now configure additional settings in <strong>Settings → OmniX Chatbot API</strong></div>';
                
                // Show generated credentials
                $token = get_option('omnix_chatbot_api_token');
                $secret = get_option('omnix_chatbot_secret_key');
                $webhook_secret = get_option('omnix_chatbot_webhook_secret');
                
                echo '<h2>🔑 Generated API Credentials</h2>';
                echo '<div class="code">';
                echo '<strong>Access Token:</strong><br>';
                echo $token . '<br><br>';
                echo '<strong>Secret Key:</strong><br>';
                echo $secret . '<br><br>';
                echo '<strong>Webhook Secret:</strong><br>';
                echo $webhook_secret;
                echo '</div>';
                
                echo '<div class="info">';
                echo '<strong>⚠️ Important:</strong> Save these credentials securely. You will need them to configure your OmniX chatbot platform.';
                echo '</div>';
                
                echo '<h2>🔗 API Endpoints</h2>';
                echo '<div class="code">';
                echo 'Base URL: ' . get_site_url() . '/wp-json/omnix-chatbot/v1/<br><br>';
                echo 'Available endpoints:<br>';
                echo '• GET /info - Site information<br>';
                echo '• POST /search - Search content<br>';
                echo '• GET /export/posts - Export posts<br>';
                echo '• GET /export/pages - Export pages<br>';
                echo '• GET /export/categories - Export categories<br>';
                echo '• GET /export/tags - Export tags<br>';
                echo '• POST /export/full - Export all content<br>';
                echo '• POST /webhook/sync - Webhook endpoint';
                echo '</div>';
                
                echo '<h2>📋 Next Steps</h2>';
                echo '<div class="step">';
                echo '<strong>1. Configure OmniX Platform:</strong><br>';
                echo 'Use the generated credentials to configure your OmniX chatbot platform.';
                echo '</div>';
                
                echo '<div class="step">';
                echo '<strong>2. Test API Connection:</strong><br>';
                echo 'Test the API endpoints to ensure everything is working correctly.';
                echo '</div>';
                
                echo '<div class="step">';
                echo '<strong>3. Enable Auto-Sync:</strong><br>';
                echo 'If enabled, content will automatically sync when published.';
                echo '</div>';
                
                echo '<p><a href="' . admin_url('options-general.php?page=omnix-chatbot-api') . '" class="button">Go to Plugin Settings</a></p>';
                
                // Don't show the form again
                $show_form = false;
            }
        } else {
            $show_form = true;
        }
        
        if ($show_form):
        ?>
        
        <div class="info">
            <strong>Welcome to OmniX Chatbot API!</strong><br>
            This installation wizard will help you set up the plugin and generate API credentials for your OmniX chatbot platform.
        </div>
        
        <form method="post">
            <input type="hidden" name="action" value="install">
            
            <h2>🔧 Basic Configuration</h2>
            
            <div class="form-group">
                <label for="api_url">OmniX Platform URL *</label>
                <input type="url" id="api_url" name="api_url" required 
                       placeholder="https://your-omnix-platform.com" 
                       value="<?php echo esc_attr(get_option('omnix_chatbot_api_url', '')); ?>">
                <small>Enter the URL of your OmniX chatbot platform</small>
            </div>
            
            <div class="form-group">
                <label for="bot_id">Bot ID *</label>
                <input type="text" id="bot_id" name="bot_id" required 
                       placeholder="123" 
                       value="<?php echo esc_attr(get_option('omnix_chatbot_bot_id', '')); ?>">
                <small>Enter the ID of your bot in the OmniX platform</small>
            </div>
            
            <h2>⚙️ Sync Settings</h2>
            
            <div class="form-group">
                <label>
                    <input type="checkbox" name="auto_sync" <?php checked(get_option('omnix_chatbot_auto_sync', false)); ?>>
                    Enable Auto-Sync
                </label>
                <small>Automatically sync content when posts are published</small>
            </div>
            
            <div class="form-group">
                <label>
                    <input type="checkbox" name="sync_enabled" <?php checked(get_option('omnix_chatbot_sync_enabled', false)); ?>>
                    Enable Data Sync
                </label>
                <small>Enable data synchronization with OmniX platform</small>
            </div>
            
            <h2>🔒 Security Information</h2>
            <div class="info">
                <strong>Security Features:</strong><br>
                • Bearer token authentication<br>
                • Rate limiting (100 requests/hour)<br>
                • Webhook secret validation<br>
                • Data sanitization and filtering<br>
                • Admin-only configuration
            </div>
            
            <p>
                <button type="submit" class="button">Install & Configure Plugin</button>
            </p>
        </form>
        
        <?php endif; ?>
        
        <h2>📚 Documentation</h2>
        <div class="info">
            <strong>Need help?</strong><br>
            • Check the README.md file for detailed documentation<br>
            • Review the API endpoints and examples<br>
            • Contact support if you encounter any issues
        </div>
        
        <h2>🔄 Plugin Status</h2>
        <div class="code">
            <?php
            $plugin_active = is_plugin_active('omnix-chatbot-api/omnix-chatbot-api.php');
            echo 'Plugin Status: ' . ($plugin_active ? '✅ Active' : '❌ Inactive') . '<br>';
            
            $token_exists = get_option('omnix_chatbot_api_token');
            echo 'API Token: ' . ($token_exists ? '✅ Generated' : '❌ Not Generated') . '<br>';
            
            $api_url = get_option('omnix_chatbot_api_url');
            echo 'API URL: ' . ($api_url ? '✅ ' . $api_url : '❌ Not Set') . '<br>';
            
            $bot_id = get_option('omnix_chatbot_bot_id');
            echo 'Bot ID: ' . ($bot_id ? '✅ ' . $bot_id : '❌ Not Set') . '<br>';
            
            $sync_enabled = get_option('omnix_chatbot_sync_enabled');
            echo 'Sync Enabled: ' . ($sync_enabled ? '✅ Yes' : '❌ No');
            ?>
        </div>
    </div>
</body>
</html>
