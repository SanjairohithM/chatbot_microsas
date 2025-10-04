<?php
if (!defined('ABSPATH')) {
    exit;
}

$plugin = new OmniXChatbotPlugin();
$tokens = $plugin->get_tokens();

// Handle form submissions
if (isset($_POST['action']) && $_POST['action'] === 'generate_token') {
    check_admin_referer('omnix_generate_token');
    
    $token_name = sanitize_text_field($_POST['token_name']);
    $bot_id = intval($_POST['bot_id']);
    $permissions = sanitize_text_field($_POST['permissions']);
    $expiry_days = intval($_POST['expiry_days']);
    
    if (!empty($token_name) && !empty($bot_id)) {
        $access_token = $plugin->generate_access_token();
        $secret_key = $plugin->generate_secret_key();
        
        $expires_at = null;
        if ($expiry_days > 0) {
            $expires_at = date('Y-m-d H:i:s', strtotime("+{$expiry_days} days"));
        }
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'omnix_chatbot_tokens';
        
        $result = $wpdb->insert(
            $table_name,
            array(
                'token_name' => $token_name,
                'access_token' => $access_token,
                'secret_key' => $secret_key,
                'bot_id' => $bot_id,
                'user_id' => get_current_user_id(),
                'permissions' => $permissions,
                'expires_at' => $expires_at
            ),
            array('%s', '%s', '%s', '%d', '%d', '%s', '%s')
        );
        
        if ($result) {
            echo '<div class="notice notice-success"><p>Token generated successfully!</p></div>';
            $tokens = $plugin->get_tokens(); // Refresh the list
        } else {
            echo '<div class="notice notice-error"><p>Failed to generate token.</p></div>';
        }
    }
}

if (isset($_GET['action']) && $_GET['action'] === 'revoke' && isset($_GET['token_id'])) {
    check_admin_referer('omnix_revoke_token');
    
    $token_id = intval($_GET['token_id']);
    global $wpdb;
    $table_name = $wpdb->prefix . 'omnix_chatbot_tokens';
    
    $result = $wpdb->update(
        $table_name,
        array('is_active' => 0),
        array('id' => $token_id),
        array('%d'),
        array('%d')
    );
    
    if ($result !== false) {
        echo '<div class="notice notice-success"><p>Token revoked successfully!</p></div>';
        $tokens = $plugin->get_tokens(); // Refresh the list
    } else {
        echo '<div class="notice notice-error"><p>Failed to revoke token.</p></div>';
    }
}

// Get available bots (you might want to fetch this from your API)
$available_bots = array(
    array('id' => 1, 'name' => 'Customer Support Bot'),
    array('id' => 2, 'name' => 'Sales Assistant Bot'),
    array('id' => 3, 'name' => 'FAQ Bot')
);
?>

<div class="wrap">
    <h1><?php _e('Access Tokens', 'omnix-chatbot'); ?></h1>
    
    <div class="omnix-tokens-page">
        <div class="omnix-tokens-section">
            <h2><?php _e('Generate New Token', 'omnix-chatbot'); ?></h2>
            <form method="post" class="omnix-token-form">
                <?php wp_nonce_field('omnix_generate_token'); ?>
                <input type="hidden" name="action" value="generate_token">
                
                <table class="form-table">
                    <tr>
                        <th scope="row">
                            <label for="token_name"><?php _e('Token Name', 'omnix-chatbot'); ?></label>
                        </th>
                        <td>
                            <input type="text" id="token_name" name="token_name" class="regular-text" required>
                            <p class="description"><?php _e('A descriptive name for this token (e.g., "Website Integration", "Mobile App")', 'omnix-chatbot'); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="bot_id"><?php _e('Bot ID', 'omnix-chatbot'); ?></label>
                        </th>
                        <td>
                            <select id="bot_id" name="bot_id" required>
                                <option value=""><?php _e('Select a bot', 'omnix-chatbot'); ?></option>
                                <?php foreach ($available_bots as $bot): ?>
                                    <option value="<?php echo $bot['id']; ?>"><?php echo esc_html($bot['name']); ?></option>
                                <?php endforeach; ?>
                            </select>
                            <p class="description"><?php _e('The chatbot this token will have access to', 'omnix-chatbot'); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="permissions"><?php _e('Permissions', 'omnix-chatbot'); ?></label>
                        </th>
                        <td>
                            <fieldset>
                                <label>
                                    <input type="checkbox" name="permissions[]" value="chat" checked>
                                    <?php _e('Chat', 'omnix-chatbot'); ?>
                                </label><br>
                                <label>
                                    <input type="checkbox" name="permissions[]" value="conversations">
                                    <?php _e('Conversations', 'omnix-chatbot'); ?>
                                </label><br>
                                <label>
                                    <input type="checkbox" name="permissions[]" value="analytics">
                                    <?php _e('Analytics', 'omnix-chatbot'); ?>
                                </label><br>
                                <label>
                                    <input type="checkbox" name="permissions[]" value="bots">
                                    <?php _e('Bot Management', 'omnix-chatbot'); ?>
                                </label>
                            </fieldset>
                            <p class="description"><?php _e('Select the permissions this token should have', 'omnix-chatbot'); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="expiry_days"><?php _e('Expiry (Days)', 'omnix-chatbot'); ?></label>
                        </th>
                        <td>
                            <input type="number" id="expiry_days" name="expiry_days" value="365" min="0" max="3650">
                            <p class="description"><?php _e('Number of days until token expires (0 = never expires)', 'omnix-chatbot'); ?></p>
                        </td>
                    </tr>
                </table>
                
                <?php submit_button(__('Generate Token', 'omnix-chatbot')); ?>
            </form>
        </div>
        
        <div class="omnix-tokens-section">
            <h2><?php _e('Existing Tokens', 'omnix-chatbot'); ?></h2>
            
            <?php if (empty($tokens)): ?>
                <p><?php _e('No tokens generated yet.', 'omnix-chatbot'); ?></p>
            <?php else: ?>
                <table class="wp-list-table widefat fixed striped">
                    <thead>
                        <tr>
                            <th><?php _e('Token Name', 'omnix-chatbot'); ?></th>
                            <th><?php _e('Bot ID', 'omnix-chatbot'); ?></th>
                            <th><?php _e('Access Token', 'omnix-chatbot'); ?></th>
                            <th><?php _e('Secret Key', 'omnix-chatbot'); ?></th>
                            <th><?php _e('Permissions', 'omnix-chatbot'); ?></th>
                            <th><?php _e('Status', 'omnix-chatbot'); ?></th>
                            <th><?php _e('Last Used', 'omnix-chatbot'); ?></th>
                            <th><?php _e('Usage Count', 'omnix-chatbot'); ?></th>
                            <th><?php _e('Actions', 'omnix-chatbot'); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($tokens as $token): ?>
                            <tr>
                                <td><strong><?php echo esc_html($token->token_name); ?></strong></td>
                                <td><?php echo $token->bot_id; ?></td>
                                <td>
                                    <code class="token-display"><?php echo esc_html(substr($token->access_token, 0, 20)); ?>...</code>
                                    <button type="button" class="button button-small copy-token" data-token="<?php echo esc_attr($token->access_token); ?>">
                                        <?php _e('Copy', 'omnix-chatbot'); ?>
                                    </button>
                                </td>
                                <td>
                                    <code class="token-display"><?php echo esc_html(substr($token->secret_key, 0, 20)); ?>...</code>
                                    <button type="button" class="button button-small copy-token" data-token="<?php echo esc_attr($token->secret_key); ?>">
                                        <?php _e('Copy', 'omnix-chatbot'); ?>
                                    </button>
                                </td>
                                <td><?php echo esc_html($token->permissions); ?></td>
                                <td>
                                    <?php if ($token->is_active): ?>
                                        <span class="status-active"><?php _e('Active', 'omnix-chatbot'); ?></span>
                                    <?php else: ?>
                                        <span class="status-inactive"><?php _e('Inactive', 'omnix-chatbot'); ?></span>
                                    <?php endif; ?>
                                    
                                    <?php if ($token->expires_at): ?>
                                        <br><small><?php _e('Expires:', 'omnix-chatbot'); ?> <?php echo date('Y-m-d', strtotime($token->expires_at)); ?></small>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <?php if ($token->last_used): ?>
                                        <?php echo date('Y-m-d H:i', strtotime($token->last_used)); ?>
                                    <?php else: ?>
                                        <?php _e('Never', 'omnix-chatbot'); ?>
                                    <?php endif; ?>
                                </td>
                                <td><?php echo number_format($token->usage_count); ?></td>
                                <td>
                                    <?php if ($token->is_active): ?>
                                        <a href="<?php echo wp_nonce_url(admin_url('admin.php?page=omnix-chatbot-tokens&action=revoke&token_id=' . $token->id), 'omnix_revoke_token'); ?>" 
                                           class="button button-small" 
                                           onclick="return confirm('<?php _e('Are you sure you want to revoke this token?', 'omnix-chatbot'); ?>')">
                                            <?php _e('Revoke', 'omnix-chatbot'); ?>
                                        </a>
                                    <?php else: ?>
                                        <span class="button button-small disabled"><?php _e('Revoked', 'omnix-chatbot'); ?></span>
                                    <?php endif; ?>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>
        
        <div class="omnix-tokens-section">
            <h2><?php _e('Integration Examples', 'omnix-chatbot'); ?></h2>
            
            <h3><?php _e('Shortcode Usage', 'omnix-chatbot'); ?></h3>
            <p><?php _e('Use this shortcode in your posts, pages, or widgets:', 'omnix-chatbot'); ?></p>
            <code>[omnix_chatbot bot_id="1" access_token="YOUR_ACCESS_TOKEN"]</code>
            
            <h3><?php _e('REST API Usage', 'omnix-chatbot'); ?></h3>
            <p><?php _e('Send a chat message via REST API:', 'omnix-chatbot'); ?></p>
            <pre><code>curl -X POST "<?php echo home_url('/wp-json/omnix-chatbot/v1/chat'); ?>" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, how can you help me?",
    "conversationId": null
  }'</code></pre>
            
            <h3><?php _e('JavaScript Widget', 'omnix-chatbot'); ?></h3>
            <p><?php _e('Include this script in your HTML:', 'omnix-chatbot'); ?></p>
            <pre><code>&lt;script src="<?php echo home_url('/wp-content/plugins/omnix-chatbot/assets/chatbot-widget.js'); ?>" 
        data-bot-id="YOUR_BOT_ID"
        data-access-token="YOUR_ACCESS_TOKEN"&gt;&lt;/script&gt;</code></pre>
        </div>
    </div>
</div>

<style>
.omnix-tokens-page {
    max-width: 1200px;
}

.omnix-tokens-section {
    background: #fff;
    border: 1px solid #ccd0d4;
    border-radius: 4px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.omnix-tokens-section h2 {
    margin-top: 0;
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
}

.omnix-token-form .form-table th {
    width: 200px;
}

.token-display {
    background: #f1f1f1;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: monospace;
    font-size: 12px;
    margin-right: 10px;
}

.copy-token {
    font-size: 11px;
    padding: 2px 8px;
    height: auto;
    line-height: 1.4;
}

.status-active {
    color: #155724;
    background: #d4edda;
    padding: 2px 8px;
    border-radius: 3px;
    font-size: 12px;
    font-weight: bold;
}

.status-inactive {
    color: #721c24;
    background: #f8d7da;
    padding: 2px 8px;
    border-radius: 3px;
    font-size: 12px;
    font-weight: bold;
}

.omnix-tokens-section pre {
    background: #f1f1f1;
    padding: 15px;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 13px;
}

.omnix-tokens-section code {
    background: #f1f1f1;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: monospace;
}

.omnix-tokens-section fieldset {
    border: none;
    padding: 0;
    margin: 0;
}

.omnix-tokens-section fieldset label {
    display: block;
    margin-bottom: 5px;
}
</style>

<script>
jQuery(document).ready(function($) {
    // Handle copy token buttons
    $('.copy-token').click(function() {
        const token = $(this).data('token');
        navigator.clipboard.writeText(token).then(function() {
            alert('Token copied to clipboard!');
        }).catch(function() {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = token;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('Token copied to clipboard!');
        });
    });
    
    // Handle permissions checkboxes
    $('input[name="permissions[]"]').change(function() {
        const permissions = $('input[name="permissions[]"]:checked').map(function() {
            return this.value;
        }).get().join(',');
        
        // Update hidden field for form submission
        if ($('input[name="permissions"]').length === 0) {
            $('<input>').attr({
                type: 'hidden',
                name: 'permissions',
                value: permissions
            }).appendTo('.omnix-token-form');
        } else {
            $('input[name="permissions"]').val(permissions);
        }
    });
    
    // Initialize permissions field
    $('input[name="permissions[]"]').trigger('change');
});
</script>
