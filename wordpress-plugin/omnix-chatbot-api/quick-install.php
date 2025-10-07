<?php
/**
 * OmniX Chatbot API - Quick Install Script
 * 
 * This script provides a one-click installation process
 * Run this script to automatically install and configure the plugin
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

// Handle installation
if ($_POST['action'] === 'install') {
    $api_url = sanitize_url($_POST['api_url']);
    $bot_id = sanitize_text_field($_POST['bot_id']);
    $auto_sync = isset($_POST['auto_sync']);
    $sync_enabled = isset($_POST['sync_enabled']);
    
    if (empty($api_url) || empty($bot_id)) {
        $error = 'Please fill in all required fields.';
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
        
        $success = 'Installation completed successfully!';
    }
}

?>
<!DOCTYPE html>
<html>
<head>
    <title>OmniX Chatbot API - Quick Install</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f1f1f1; }
        .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 800px; margin: 0 auto; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .button { background: #0073aa; color: white; padding: 15px 30px; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; font-size: 16px; margin: 10px 5px; }
        .button:hover { background: #005a87; }
        .button.secondary { background: #6c757d; }
        .button.secondary:hover { background: #545b62; }
        h1 { color: #333; border-bottom: 2px solid #0073aa; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        .form-group { margin: 20px 0; }
        .form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
        .form-group input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px; }
        .form-group textarea { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; height: 100px; font-size: 16px; }
        .checkbox-group { display: flex; align-items: center; margin: 10px 0; }
        .checkbox-group input[type="checkbox"] { width: auto; margin-right: 10px; }
        .step { background: #e7f3ff; border-left: 4px solid #0073aa; padding: 15px; margin: 15px 0; }
        .credentials { background: #f8f9fa; border: 1px solid #e9ecef; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .credentials pre { background: #fff; border: 1px solid #ddd; padding: 10px; border-radius: 4px; word-break: break-all; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 OmniX Chatbot API - Quick Install</h1>
        
        <?php if (isset($success)): ?>
            <div class="success">✅ <?php echo $success; ?></div>
            
            <h2>🔑 Generated API Credentials</h2>
            <div class="credentials">
                <p><strong>Access Token:</strong></p>
                <pre><?php echo esc_html(get_option('omnix_chatbot_api_token')); ?></pre>
                
                <p><strong>Secret Key:</strong></p>
                <pre><?php echo esc_html(get_option('omnix_chatbot_secret_key')); ?></pre>
                
                <p><strong>Webhook Secret:</strong></p>
                <pre><?php echo esc_html(get_option('omnix_chatbot_webhook_secret')); ?></pre>
            </div>
            
            <div class="info">
                <strong>⚠️ Important:</strong> Save these credentials securely. You will need them to configure your OmniX chatbot platform.
            </div>
            
            <h2>🔗 API Endpoints</h2>
            <div class="step">
                <strong>Base URL:</strong> <?php echo get_site_url(); ?>/wp-json/omnix-chatbot/v1/<br><br>
                <strong>Available endpoints:</strong><br>
                • GET /info - Site information<br>
                • POST /search - Search content<br>
                • GET /export/posts - Export posts<br>
                • GET /export/pages - Export pages<br>
                • GET /export/categories - Export categories<br>
                • GET /export/tags - Export tags<br>
                • POST /export/full - Export all content<br>
                • POST /webhook/sync - Webhook endpoint
            </div>
            
            <h2>📋 Next Steps</h2>
            <div class="step">
                <strong>1. Configure OmniX Platform:</strong><br>
                Use the generated credentials to configure your OmniX chatbot platform.
            </div>
            
            <div class="step">
                <strong>2. Test API Connection:</strong><br>
                Test the API endpoints to ensure everything is working correctly.
            </div>
            
            <div class="step">
                <strong>3. Enable Auto-Sync:</strong><br>
                If enabled, content will automatically sync when published.
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="<?php echo admin_url('options-general.php?page=omnix-chatbot-api'); ?>" class="button">⚙️ Go to Plugin Settings</a>
                <a href="<?php echo get_site_url(); ?>/wp-content/plugins/omnix-chatbot-api/test-api.php" class="button secondary">🧪 Test API</a>
            </div>
            
        <?php else: ?>
            
            <?php if (isset($error)): ?>
                <div class="error">❌ <?php echo $error; ?></div>
            <?php endif; ?>
            
            <div class="info">
                <strong>Welcome to OmniX Chatbot API!</strong><br>
                This quick install will set up the plugin and generate API credentials for your OmniX chatbot platform.
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
                
                <div class="checkbox-group">
                    <input type="checkbox" id="auto_sync" name="auto_sync" <?php checked(get_option('omnix_chatbot_auto_sync', false)); ?>>
                    <label for="auto_sync">Enable Auto-Sync</label>
                </div>
                <small>Automatically sync content when posts are published</small>
                
                <div class="checkbox-group">
                    <input type="checkbox" id="sync_enabled" name="sync_enabled" <?php checked(get_option('omnix_chatbot_sync_enabled', false)); ?>>
                    <label for="sync_enabled">Enable Data Sync</label>
                </div>
                <small>Enable data synchronization with OmniX platform</small>
                
                <h2>🔒 Security Information</h2>
                <div class="info">
                    <strong>Security Features:</strong><br>
                    • Bearer token authentication<br>
                    • Rate limiting (100 requests/hour)<br>
                    • Webhook secret validation<br>
                    • Data sanitization and filtering<br>
                    • Admin-only configuration
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <button type="submit" class="button">🚀 Install & Configure Plugin</button>
                </div>
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
        <div class="step">
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
