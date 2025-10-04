<?php
if (!defined('ABSPATH')) {
    exit;
}

$plugin = new OmniXChatbotPlugin();
$tokens = $plugin->get_tokens();
$total_tokens = count($tokens);
$active_tokens = count(array_filter($tokens, function($token) { return $token->is_active; }));

// Get recent API logs
global $wpdb;
$logs_table = $wpdb->prefix . 'omnix_chatbot_logs';
$recent_logs = $wpdb->get_results(
    "SELECT l.*, t.token_name, t.bot_id 
     FROM $logs_table l 
     LEFT JOIN {$wpdb->prefix}omnix_chatbot_tokens t ON l.token_id = t.id 
     ORDER BY l.created_at DESC 
     LIMIT 10"
);

$total_requests = $wpdb->get_var("SELECT COUNT(*) FROM $logs_table");
$successful_requests = $wpdb->get_var("SELECT COUNT(*) FROM $logs_table WHERE status_code >= 200 AND status_code < 300");
$error_rate = $total_requests > 0 ? round((($total_requests - $successful_requests) / $total_requests) * 100, 2) : 0;
?>

<div class="wrap">
    <h1><?php _e('OmniX Chatbot Dashboard', 'omnix-chatbot'); ?></h1>
    
    <div class="omnix-dashboard-stats">
        <div class="omnix-stat-card">
            <h3><?php echo $total_tokens; ?></h3>
            <p><?php _e('Total Tokens', 'omnix-chatbot'); ?></p>
        </div>
        <div class="omnix-stat-card">
            <h3><?php echo $active_tokens; ?></h3>
            <p><?php _e('Active Tokens', 'omnix-chatbot'); ?></p>
        </div>
        <div class="omnix-stat-card">
            <h3><?php echo number_format($total_requests); ?></h3>
            <p><?php _e('Total API Requests', 'omnix-chatbot'); ?></p>
        </div>
        <div class="omnix-stat-card">
            <h3><?php echo $error_rate; ?>%</h3>
            <p><?php _e('Error Rate', 'omnix-chatbot'); ?></p>
        </div>
    </div>
    
    <div class="omnix-dashboard-content">
        <div class="omnix-dashboard-section">
            <h2><?php _e('Quick Actions', 'omnix-chatbot'); ?></h2>
            <div class="omnix-quick-actions">
                <a href="<?php echo admin_url('admin.php?page=omnix-chatbot-tokens'); ?>" class="button button-primary">
                    <?php _e('Generate New Token', 'omnix-chatbot'); ?>
                </a>
                <a href="<?php echo admin_url('admin.php?page=omnix-chatbot-settings'); ?>" class="button">
                    <?php _e('Plugin Settings', 'omnix-chatbot'); ?>
                </a>
                <button type="button" class="button" onclick="testConnection()">
                    <?php _e('Test API Connection', 'omnix-chatbot'); ?>
                </button>
            </div>
        </div>
        
        <div class="omnix-dashboard-section">
            <h2><?php _e('Recent API Activity', 'omnix-chatbot'); ?></h2>
            <?php if (empty($recent_logs)): ?>
                <p><?php _e('No API activity yet.', 'omnix-chatbot'); ?></p>
            <?php else: ?>
                <table class="wp-list-table widefat fixed striped">
                    <thead>
                        <tr>
                            <th><?php _e('Time', 'omnix-chatbot'); ?></th>
                            <th><?php _e('Token', 'omnix-chatbot'); ?></th>
                            <th><?php _e('Endpoint', 'omnix-chatbot'); ?></th>
                            <th><?php _e('Status', 'omnix-chatbot'); ?></th>
                            <th><?php _e('Response Time', 'omnix-chatbot'); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($recent_logs as $log): ?>
                            <tr>
                                <td><?php echo date('Y-m-d H:i:s', strtotime($log->created_at)); ?></td>
                                <td><?php echo esc_html($log->token_name); ?></td>
                                <td><?php echo esc_html($log->endpoint); ?></td>
                                <td>
                                    <span class="status-code status-<?php echo $log->status_code >= 200 && $log->status_code < 300 ? 'success' : 'error'; ?>">
                                        <?php echo $log->status_code; ?>
                                    </span>
                                </td>
                                <td><?php echo $log->response_time_ms ? $log->response_time_ms . 'ms' : '-'; ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
                <p><a href="<?php echo admin_url('admin.php?page=omnix-chatbot-logs'); ?>"><?php _e('View all logs', 'omnix-chatbot'); ?></a></p>
            <?php endif; ?>
        </div>
        
        <div class="omnix-dashboard-section">
            <h2><?php _e('Integration Guide', 'omnix-chatbot'); ?></h2>
            <div class="omnix-integration-guide">
                <h3><?php _e('Shortcode Usage', 'omnix-chatbot'); ?></h3>
                <p><?php _e('Use the following shortcode to embed a chatbot on any page or post:', 'omnix-chatbot'); ?></p>
                <code>[omnix_chatbot bot_id="YOUR_BOT_ID" access_token="YOUR_ACCESS_TOKEN"]</code>
                
                <h3><?php _e('Available Parameters', 'omnix-chatbot'); ?></h3>
                <ul>
                    <li><strong>bot_id</strong> - <?php _e('Your chatbot ID (required)', 'omnix-chatbot'); ?></li>
                    <li><strong>access_token</strong> - <?php _e('Generated access token (required)', 'omnix-chatbot'); ?></li>
                    <li><strong>theme</strong> - <?php _e('Widget theme (default, dark, light)', 'omnix-chatbot'); ?></li>
                    <li><strong>position</strong> - <?php _e('Widget position (bottom-right, bottom-left, top-right, top-left)', 'omnix-chatbot'); ?></li>
                    <li><strong>auto_open</strong> - <?php _e('Auto-open widget (true/false)', 'omnix-chatbot'); ?></li>
                    <li><strong>show_avatar</strong> - <?php _e('Show bot avatar (true/false)', 'omnix-chatbot'); ?></li>
                    <li><strong>show_title</strong> - <?php _e('Show bot title (true/false)', 'omnix-chatbot'); ?></li>
                    <li><strong>enable_voice</strong> - <?php _e('Enable voice features (true/false)', 'omnix-chatbot'); ?></li>
                    <li><strong>voice_language</strong> - <?php _e('Voice language (en-US, en-GB, etc.)', 'omnix-chatbot'); ?></li>
                    <li><strong>auto_speak</strong> - <?php _e('Auto-speak responses (true/false)', 'omnix-chatbot'); ?></li>
                </ul>
                
                <h3><?php _e('REST API Usage', 'omnix-chatbot'); ?></h3>
                <p><?php _e('Use the REST API for custom integrations:', 'omnix-chatbot'); ?></p>
                <code><?php echo home_url('/wp-json/omnix-chatbot/v1/chat'); ?></code>
                <p><?php _e('Include your access token in the Authorization header:', 'omnix-chatbot'); ?></p>
                <code>Authorization: Bearer YOUR_ACCESS_TOKEN</code>
            </div>
        </div>
    </div>
</div>

<style>
.omnix-dashboard-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin: 20px 0;
}

.omnix-stat-card {
    background: #fff;
    border: 1px solid #ccd0d4;
    border-radius: 4px;
    padding: 20px;
    text-align: center;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.omnix-stat-card h3 {
    font-size: 2em;
    margin: 0 0 10px 0;
    color: #0073aa;
}

.omnix-stat-card p {
    margin: 0;
    color: #666;
    font-weight: 500;
}

.omnix-dashboard-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    margin-top: 30px;
}

.omnix-dashboard-section {
    background: #fff;
    border: 1px solid #ccd0d4;
    border-radius: 4px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.omnix-dashboard-section h2 {
    margin-top: 0;
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
}

.omnix-quick-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.status-code {
    padding: 2px 8px;
    border-radius: 3px;
    font-weight: bold;
    font-size: 12px;
}

.status-success {
    background: #d4edda;
    color: #155724;
}

.status-error {
    background: #f8d7da;
    color: #721c24;
}

.omnix-integration-guide code {
    background: #f1f1f1;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: monospace;
}

.omnix-integration-guide ul {
    margin-left: 20px;
}

.omnix-integration-guide li {
    margin-bottom: 5px;
}

@media (max-width: 768px) {
    .omnix-dashboard-content {
        grid-template-columns: 1fr;
    }
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
</script>
