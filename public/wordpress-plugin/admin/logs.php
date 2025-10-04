<?php
if (!defined('ABSPATH')) {
    exit;
}

global $wpdb;
$logs_table = $wpdb->prefix . 'omnix_chatbot_logs';
$tokens_table = $wpdb->prefix . 'omnix_chatbot_tokens';

// Handle pagination
$per_page = 50;
$current_page = isset($_GET['paged']) ? max(1, intval($_GET['paged'])) : 1;
$offset = ($current_page - 1) * $per_page;

// Handle filtering
$where_conditions = array();
$where_values = array();

if (isset($_GET['token_id']) && !empty($_GET['token_id'])) {
    $where_conditions[] = 'l.token_id = %d';
    $where_values[] = intval($_GET['token_id']);
}

if (isset($_GET['status_code']) && !empty($_GET['status_code'])) {
    $where_conditions[] = 'l.status_code = %d';
    $where_values[] = intval($_GET['status_code']);
}

if (isset($_GET['endpoint']) && !empty($_GET['endpoint'])) {
    $where_conditions[] = 'l.endpoint LIKE %s';
    $where_values[] = '%' . $wpdb->esc_like($_GET['endpoint']) . '%';
}

if (isset($_GET['date_from']) && !empty($_GET['date_from'])) {
    $where_conditions[] = 'DATE(l.created_at) >= %s';
    $where_values[] = sanitize_text_field($_GET['date_from']);
}

if (isset($_GET['date_to']) && !empty($_GET['date_to'])) {
    $where_conditions[] = 'DATE(l.created_at) <= %s';
    $where_values[] = sanitize_text_field($_GET['date_to']);
}

$where_clause = '';
if (!empty($where_conditions)) {
    $where_clause = 'WHERE ' . implode(' AND ', $where_conditions);
}

// Get total count
$count_query = "SELECT COUNT(*) FROM $logs_table l $where_clause";
if (!empty($where_values)) {
    $count_query = $wpdb->prepare($count_query, $where_values);
}
$total_items = $wpdb->get_var($count_query);
$total_pages = ceil($total_items / $per_page);

// Get logs
$query = "SELECT l.*, t.token_name, t.bot_id 
          FROM $logs_table l 
          LEFT JOIN $tokens_table t ON l.token_id = t.id 
          $where_clause
          ORDER BY l.created_at DESC 
          LIMIT %d OFFSET %d";

$query_values = array_merge($where_values, array($per_page, $offset));
$logs = $wpdb->get_results($wpdb->prepare($query, $query_values));

// Get available tokens for filter
$tokens = $wpdb->get_results("SELECT id, token_name, bot_id FROM $tokens_table ORDER BY token_name");

// Get statistics
$stats_query = "SELECT 
    COUNT(*) as total_requests,
    COUNT(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 END) as successful_requests,
    COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_requests,
    AVG(response_time_ms) as avg_response_time,
    COUNT(DISTINCT token_id) as unique_tokens
    FROM $logs_table l $where_clause";

if (!empty($where_values)) {
    $stats = $wpdb->get_row($wpdb->prepare($stats_query, $where_values));
} else {
    $stats = $wpdb->get_row($stats_query);
}

$success_rate = $stats->total_requests > 0 ? round(($stats->successful_requests / $stats->total_requests) * 100, 2) : 0;
$error_rate = $stats->total_requests > 0 ? round(($stats->error_requests / $stats->total_requests) * 100, 2) : 0;
?>

<div class="wrap">
    <h1><?php _e('API Logs', 'omnix-chatbot'); ?></h1>
    
    <div class="omnix-logs-stats">
        <div class="omnix-stat-card">
            <h3><?php echo number_format($stats->total_requests); ?></h3>
            <p><?php _e('Total Requests', 'omnix-chatbot'); ?></p>
        </div>
        <div class="omnix-stat-card">
            <h3><?php echo $success_rate; ?>%</h3>
            <p><?php _e('Success Rate', 'omnix-chatbot'); ?></p>
        </div>
        <div class="omnix-stat-card">
            <h3><?php echo $error_rate; ?>%</h3>
            <p><?php _e('Error Rate', 'omnix-chatbot'); ?></p>
        </div>
        <div class="omnix-stat-card">
            <h3><?php echo $stats->avg_response_time ? round($stats->avg_response_time) . 'ms' : '-'; ?></h3>
            <p><?php _e('Avg Response Time', 'omnix-chatbot'); ?></p>
        </div>
        <div class="omnix-stat-card">
            <h3><?php echo $stats->unique_tokens; ?></h3>
            <p><?php _e('Active Tokens', 'omnix-chatbot'); ?></p>
        </div>
    </div>
    
    <div class="omnix-logs-filters">
        <form method="get" action="">
            <input type="hidden" name="page" value="omnix-chatbot-logs">
            
            <div class="omnix-filter-row">
                <div class="omnix-filter-group">
                    <label for="token_id"><?php _e('Token:', 'omnix-chatbot'); ?></label>
                    <select id="token_id" name="token_id">
                        <option value=""><?php _e('All Tokens', 'omnix-chatbot'); ?></option>
                        <?php foreach ($tokens as $token): ?>
                            <option value="<?php echo $token->id; ?>" <?php selected(isset($_GET['token_id']) ? $_GET['token_id'] : '', $token->id); ?>>
                                <?php echo esc_html($token->token_name . ' (Bot ' . $token->bot_id . ')'); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>
                
                <div class="omnix-filter-group">
                    <label for="status_code"><?php _e('Status Code:', 'omnix-chatbot'); ?></label>
                    <select id="status_code" name="status_code">
                        <option value=""><?php _e('All Status Codes', 'omnix-chatbot'); ?></option>
                        <option value="200" <?php selected(isset($_GET['status_code']) ? $_GET['status_code'] : '', '200'); ?>>200 - OK</option>
                        <option value="400" <?php selected(isset($_GET['status_code']) ? $_GET['status_code'] : '', '400'); ?>>400 - Bad Request</option>
                        <option value="401" <?php selected(isset($_GET['status_code']) ? $_GET['status_code'] : '', '401'); ?>>401 - Unauthorized</option>
                        <option value="403" <?php selected(isset($_GET['status_code']) ? $_GET['status_code'] : '', '403'); ?>>403 - Forbidden</option>
                        <option value="404" <?php selected(isset($_GET['status_code']) ? $_GET['status_code'] : '', '404'); ?>>404 - Not Found</option>
                        <option value="500" <?php selected(isset($_GET['status_code']) ? $_GET['status_code'] : '', '500'); ?>>500 - Server Error</option>
                    </select>
                </div>
                
                <div class="omnix-filter-group">
                    <label for="endpoint"><?php _e('Endpoint:', 'omnix-chatbot'); ?></label>
                    <input type="text" id="endpoint" name="endpoint" value="<?php echo esc_attr(isset($_GET['endpoint']) ? $_GET['endpoint'] : ''); ?>" placeholder="e.g., /api/chat">
                </div>
            </div>
            
            <div class="omnix-filter-row">
                <div class="omnix-filter-group">
                    <label for="date_from"><?php _e('From Date:', 'omnix-chatbot'); ?></label>
                    <input type="date" id="date_from" name="date_from" value="<?php echo esc_attr(isset($_GET['date_from']) ? $_GET['date_from'] : ''); ?>">
                </div>
                
                <div class="omnix-filter-group">
                    <label for="date_to"><?php _e('To Date:', 'omnix-chatbot'); ?></label>
                    <input type="date" id="date_to" name="date_to" value="<?php echo esc_attr(isset($_GET['date_to']) ? $_GET['date_to'] : ''); ?>">
                </div>
                
                <div class="omnix-filter-group">
                    <input type="submit" class="button" value="<?php _e('Filter', 'omnix-chatbot'); ?>">
                    <a href="<?php echo admin_url('admin.php?page=omnix-chatbot-logs'); ?>" class="button"><?php _e('Clear', 'omnix-chatbot'); ?></a>
                </div>
            </div>
        </form>
    </div>
    
    <div class="omnix-logs-content">
        <?php if (empty($logs)): ?>
            <p><?php _e('No logs found matching your criteria.', 'omnix-chatbot'); ?></p>
        <?php else: ?>
            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th><?php _e('Time', 'omnix-chatbot'); ?></th>
                        <th><?php _e('Token', 'omnix-chatbot'); ?></th>
                        <th><?php _e('Bot ID', 'omnix-chatbot'); ?></th>
                        <th><?php _e('Method', 'omnix-chatbot'); ?></th>
                        <th><?php _e('Endpoint', 'omnix-chatbot'); ?></th>
                        <th><?php _e('Status', 'omnix-chatbot'); ?></th>
                        <th><?php _e('Response Time', 'omnix-chatbot'); ?></th>
                        <th><?php _e('IP Address', 'omnix-chatbot'); ?></th>
                        <th><?php _e('Actions', 'omnix-chatbot'); ?></th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($logs as $log): ?>
                        <tr>
                            <td><?php echo date('Y-m-d H:i:s', strtotime($log->created_at)); ?></td>
                            <td><?php echo esc_html($log->token_name ?: 'Unknown'); ?></td>
                            <td><?php echo $log->bot_id ?: '-'; ?></td>
                            <td><code><?php echo esc_html($log->method); ?></code></td>
                            <td><?php echo esc_html($log->endpoint); ?></td>
                            <td>
                                <span class="status-code status-<?php echo $log->status_code >= 200 && $log->status_code < 300 ? 'success' : 'error'; ?>">
                                    <?php echo $log->status_code; ?>
                                </span>
                            </td>
                            <td><?php echo $log->response_time_ms ? $log->response_time_ms . 'ms' : '-'; ?></td>
                            <td><?php echo esc_html($log->ip_address); ?></td>
                            <td>
                                <button type="button" class="button button-small view-log-details" 
                                        data-log-id="<?php echo $log->id; ?>">
                                    <?php _e('Details', 'omnix-chatbot'); ?>
                                </button>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
            
            <?php if ($total_pages > 1): ?>
                <div class="tablenav">
                    <div class="tablenav-pages">
                        <?php
                        $pagination_args = array(
                            'base' => add_query_arg('paged', '%#%'),
                            'format' => '',
                            'prev_text' => __('&laquo;'),
                            'next_text' => __('&raquo;'),
                            'total' => $total_pages,
                            'current' => $current_page
                        );
                        echo paginate_links($pagination_args);
                        ?>
                    </div>
                </div>
            <?php endif; ?>
        <?php endif; ?>
    </div>
</div>

<!-- Log Details Modal -->
<div id="log-details-modal" class="omnix-modal" style="display: none;">
    <div class="omnix-modal-content">
        <div class="omnix-modal-header">
            <h3><?php _e('Log Details', 'omnix-chatbot'); ?></h3>
            <span class="omnix-modal-close">&times;</span>
        </div>
        <div class="omnix-modal-body">
            <div id="log-details-content"></div>
        </div>
    </div>
</div>

<style>
.omnix-logs-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
    margin: 20px 0;
}

.omnix-stat-card {
    background: #fff;
    border: 1px solid #ccd0d4;
    border-radius: 4px;
    padding: 15px;
    text-align: center;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.omnix-stat-card h3 {
    font-size: 1.5em;
    margin: 0 0 5px 0;
    color: #0073aa;
}

.omnix-stat-card p {
    margin: 0;
    color: #666;
    font-weight: 500;
    font-size: 12px;
}

.omnix-logs-filters {
    background: #fff;
    border: 1px solid #ccd0d4;
    border-radius: 4px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.omnix-filter-row {
    display: flex;
    gap: 20px;
    margin-bottom: 15px;
    flex-wrap: wrap;
}

.omnix-filter-group {
    display: flex;
    flex-direction: column;
    min-width: 150px;
}

.omnix-filter-group label {
    font-weight: 600;
    margin-bottom: 5px;
    font-size: 12px;
    text-transform: uppercase;
    color: #666;
}

.omnix-filter-group input,
.omnix-filter-group select {
    padding: 5px 8px;
    border: 1px solid #ddd;
    border-radius: 3px;
}

.omnix-logs-content {
    background: #fff;
    border: 1px solid #ccd0d4;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
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

.omnix-modal {
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.5);
}

.omnix-modal-content {
    background-color: #fff;
    margin: 5% auto;
    padding: 0;
    border-radius: 4px;
    width: 80%;
    max-width: 800px;
    max-height: 80vh;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.omnix-modal-header {
    background: #f1f1f1;
    padding: 15px 20px;
    border-bottom: 1px solid #ddd;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.omnix-modal-header h3 {
    margin: 0;
}

.omnix-modal-close {
    font-size: 24px;
    font-weight: bold;
    cursor: pointer;
    color: #666;
}

.omnix-modal-close:hover {
    color: #000;
}

.omnix-modal-body {
    padding: 20px;
    max-height: 60vh;
    overflow-y: auto;
}

.log-detail-section {
    margin-bottom: 20px;
}

.log-detail-section h4 {
    margin: 0 0 10px 0;
    color: #0073aa;
    border-bottom: 1px solid #eee;
    padding-bottom: 5px;
}

.log-detail-section pre {
    background: #f8f8f8;
    padding: 10px;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 12px;
    max-height: 200px;
    overflow-y: auto;
}

@media (max-width: 768px) {
    .omnix-filter-row {
        flex-direction: column;
    }
    
    .omnix-modal-content {
        width: 95%;
        margin: 10% auto;
    }
}
</style>

<script>
jQuery(document).ready(function($) {
    // Handle log details modal
    $('.view-log-details').click(function() {
        const logId = $(this).data('log-id');
        
        // Show loading
        $('#log-details-content').html('<p>Loading...</p>');
        $('#log-details-modal').show();
        
        // Fetch log details via AJAX
        $.post(ajaxurl, {
            action: 'omnix_get_log_details',
            log_id: logId,
            nonce: '<?php echo wp_create_nonce('omnix_chatbot_nonce'); ?>'
        }, function(response) {
            if (response.success) {
                $('#log-details-content').html(response.data);
            } else {
                $('#log-details-content').html('<p>Error loading log details.</p>');
            }
        });
    });
    
    // Close modal
    $('.omnix-modal-close, .omnix-modal').click(function(e) {
        if (e.target === this) {
            $('#log-details-modal').hide();
        }
    });
    
    // Prevent modal close when clicking inside
    $('.omnix-modal-content').click(function(e) {
        e.stopPropagation();
    });
});
</script>

<?php
// AJAX handler for log details
add_action('wp_ajax_omnix_get_log_details', function() {
    check_ajax_referer('omnix_chatbot_nonce', 'nonce');
    
    if (!current_user_can('manage_options')) {
        wp_die('Unauthorized');
    }
    
    $log_id = intval($_POST['log_id']);
    global $wpdb;
    $logs_table = $wpdb->prefix . 'omnix_chatbot_logs';
    $tokens_table = $wpdb->prefix . 'omnix_chatbot_tokens';
    
    $log = $wpdb->get_row($wpdb->prepare(
        "SELECT l.*, t.token_name, t.bot_id 
         FROM $logs_table l 
         LEFT JOIN $tokens_table t ON l.token_id = t.id 
         WHERE l.id = %d",
        $log_id
    ));
    
    if (!$log) {
        wp_send_json_error('Log not found');
    }
    
    $html = '<div class="log-detail-section">';
    $html .= '<h4>Basic Information</h4>';
    $html .= '<p><strong>Time:</strong> ' . date('Y-m-d H:i:s', strtotime($log->created_at)) . '</p>';
    $html .= '<p><strong>Token:</strong> ' . esc_html($log->token_name ?: 'Unknown') . '</p>';
    $html .= '<p><strong>Bot ID:</strong> ' . ($log->bot_id ?: '-') . '</p>';
    $html .= '<p><strong>Method:</strong> ' . esc_html($log->method) . '</p>';
    $html .= '<p><strong>Endpoint:</strong> ' . esc_html($log->endpoint) . '</p>';
    $html .= '<p><strong>Status Code:</strong> ' . $log->status_code . '</p>';
    $html .= '<p><strong>Response Time:</strong> ' . ($log->response_time_ms ? $log->response_time_ms . 'ms' : '-') . '</p>';
    $html .= '<p><strong>IP Address:</strong> ' . esc_html($log->ip_address) . '</p>';
    $html .= '</div>';
    
    if ($log->user_agent) {
        $html .= '<div class="log-detail-section">';
        $html .= '<h4>User Agent</h4>';
        $html .= '<p>' . esc_html($log->user_agent) . '</p>';
        $html .= '</div>';
    }
    
    if ($log->request_data) {
        $html .= '<div class="log-detail-section">';
        $html .= '<h4>Request Data</h4>';
        $html .= '<pre>' . esc_html($log->request_data) . '</pre>';
        $html .= '</div>';
    }
    
    if ($log->response_data) {
        $html .= '<div class="log-detail-section">';
        $html .= '<h4>Response Data</h4>';
        $html .= '<pre>' . esc_html($log->response_data) . '</pre>';
        $html .= '</div>';
    }
    
    if ($log->error_message) {
        $html .= '<div class="log-detail-section">';
        $html .= '<h4>Error Message</h4>';
        $html .= '<pre>' . esc_html($log->error_message) . '</pre>';
        $html .= '</div>';
    }
    
    wp_send_json_success($html);
});
?>
