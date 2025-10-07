<?php
/**
 * Plugin Name: OmniX Chatbot Integration
 * Plugin URI: https://omnix-chatbot.com
 * Description: Integrate AI chatbots with access token authentication for external websites
 * Version: 1.0.0
 * Author: OmniX Team
 * License: GPL v2 or later
 * Text Domain: omnix-chatbot
 * Requires at least: 5.0
 * Tested up to: 6.4
 * Requires PHP: 7.4
 * Network: false
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('OMNIX_CHATBOT_VERSION', '1.0.0');
define('OMNIX_CHATBOT_PLUGIN_URL', plugin_dir_url(__FILE__));
define('OMNIX_CHATBOT_PLUGIN_PATH', plugin_dir_path(__FILE__));

class OmniXChatbotPlugin {
    
    private $api_base_url;
    private $database;
    
    public function __construct() {
        $this->api_base_url = get_option('omnix_chatbot_api_url', 'https://your-domain.com');
        add_action('init', array($this, 'init'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'admin_init'));
        add_action('wp_ajax_omnix_generate_token', array($this, 'ajax_generate_token'));
        add_action('wp_ajax_omnix_revoke_token', array($this, 'ajax_revoke_token'));
        add_action('wp_ajax_omnix_test_connection', array($this, 'ajax_test_connection'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_shortcode('omnix_chatbot', array($this, 'chatbot_shortcode'));
        add_shortcode('omnix_chatbot_widget', array($this, 'chatbot_widget_shortcode'));
        
        // Create database tables on activation
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
    }
    
    public function init() {
        // Initialize plugin
        load_plugin_textdomain('omnix-chatbot', false, dirname(plugin_basename(__FILE__)) . '/languages');
    }
    
    public function activate() {
        $this->create_database_tables();
        $this->create_default_options();
    }
    
    public function deactivate() {
        // Cleanup if needed
    }
    
    private function create_database_tables() {
        global $wpdb;
        
        $charset_collate = $wpdb->get_charset_collate();
        
        // Create access tokens table
        $table_name = $wpdb->prefix . 'omnix_chatbot_tokens';
        $sql = "CREATE TABLE $table_name (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            token_name varchar(255) NOT NULL,
            access_token varchar(255) NOT NULL,
            secret_key varchar(255) NOT NULL,
            bot_id int(11) NOT NULL,
            user_id bigint(20) NOT NULL,
            permissions text,
            is_active tinyint(1) DEFAULT 1,
            expires_at datetime DEFAULT NULL,
            last_used datetime DEFAULT NULL,
            usage_count int(11) DEFAULT 0,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY access_token (access_token),
            KEY bot_id (bot_id),
            KEY user_id (user_id),
            KEY is_active (is_active)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
        
        // Create API logs table
        $table_name = $wpdb->prefix . 'omnix_chatbot_logs';
        $sql = "CREATE TABLE $table_name (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            token_id mediumint(9) NOT NULL,
            endpoint varchar(255) NOT NULL,
            method varchar(10) NOT NULL,
            status_code int(11) NOT NULL,
            response_time_ms int(11) DEFAULT NULL,
            ip_address varchar(45) NOT NULL,
            user_agent text,
            request_data text,
            response_data text,
            error_message text,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY token_id (token_id),
            KEY endpoint (endpoint),
            KEY status_code (status_code),
            KEY created_at (created_at)
        ) $charset_collate;";
        
        dbDelta($sql);
    }
    
    private function create_default_options() {
        add_option('omnix_chatbot_api_url', 'https://your-domain.com');
        add_option('omnix_chatbot_api_key', '');
        add_option('omnix_chatbot_default_permissions', 'chat,analytics,conversations');
        add_option('omnix_chatbot_token_expiry_days', 365);
        add_option('omnix_chatbot_enable_logging', true);
        add_option('omnix_chatbot_max_requests_per_hour', 1000);
    }
    
    public function add_admin_menu() {
        add_menu_page(
            'OmniX Chatbot',
            'OmniX Chatbot',
            'manage_options',
            'omnix-chatbot',
            array($this, 'admin_page'),
            'dashicons-format-chat',
            30
        );
        
        add_submenu_page(
            'omnix-chatbot',
            'Access Tokens',
            'Access Tokens',
            'manage_options',
            'omnix-chatbot-tokens',
            array($this, 'tokens_page')
        );
        
        add_submenu_page(
            'omnix-chatbot',
            'API Logs',
            'API Logs',
            'manage_options',
            'omnix-chatbot-logs',
            array($this, 'logs_page')
        );
        
        add_submenu_page(
            'omnix-chatbot',
            'Settings',
            'Settings',
            'manage_options',
            'omnix-chatbot-settings',
            array($this, 'settings_page')
        );
    }
    
    public function admin_init() {
        register_setting('omnix_chatbot_settings', 'omnix_chatbot_api_url');
        register_setting('omnix_chatbot_settings', 'omnix_chatbot_api_key');
        register_setting('omnix_chatbot_settings', 'omnix_chatbot_default_permissions');
        register_setting('omnix_chatbot_settings', 'omnix_chatbot_token_expiry_days');
        register_setting('omnix_chatbot_settings', 'omnix_chatbot_enable_logging');
        register_setting('omnix_chatbot_settings', 'omnix_chatbot_max_requests_per_hour');
    }
    
    public function admin_page() {
        include OMNIX_CHATBOT_PLUGIN_PATH . 'admin/dashboard.php';
    }
    
    public function tokens_page() {
        include OMNIX_CHATBOT_PLUGIN_PATH . 'admin/tokens.php';
    }
    
    public function logs_page() {
        include OMNIX_CHATBOT_PLUGIN_PATH . 'admin/logs.php';
    }
    
    public function settings_page() {
        include OMNIX_CHATBOT_PLUGIN_PATH . 'admin/settings.php';
    }
    
    public function ajax_generate_token() {
        check_ajax_referer('omnix_chatbot_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized');
        }
        
        $token_name = sanitize_text_field($_POST['token_name']);
        $bot_id = intval($_POST['bot_id']);
        $permissions = sanitize_text_field($_POST['permissions']);
        $expiry_days = intval($_POST['expiry_days']);
        
        if (empty($token_name) || empty($bot_id)) {
            wp_send_json_error('Token name and Bot ID are required');
        }
        
        $access_token = $this->generate_access_token();
        $secret_key = $this->generate_secret_key();
        
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
            wp_send_json_success(array(
                'message' => 'Token generated successfully',
                'access_token' => $access_token,
                'secret_key' => $secret_key,
                'token_id' => $wpdb->insert_id
            ));
        } else {
            wp_send_json_error('Failed to generate token');
        }
    }
    
    public function ajax_revoke_token() {
        check_ajax_referer('omnix_chatbot_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized');
        }
        
        $token_id = intval($_POST['token_id']);
        
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
            wp_send_json_success('Token revoked successfully');
        } else {
            wp_send_json_error('Failed to revoke token');
        }
    }
    
    public function ajax_test_connection() {
        check_ajax_referer('omnix_chatbot_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized');
        }
        
        $api_url = get_option('omnix_chatbot_api_url');
        $api_key = get_option('omnix_chatbot_api_key');
        
        $response = wp_remote_get($api_url . '/api/bots', array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $api_key,
                'Content-Type' => 'application/json'
            ),
            'timeout' => 10
        ));
        
        if (is_wp_error($response)) {
            wp_send_json_error('Connection failed: ' . $response->get_error_message());
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        if ($status_code === 200) {
            wp_send_json_success('Connection successful');
        } else {
            wp_send_json_error('Connection failed with status: ' . $status_code);
        }
    }
    
    private function generate_access_token() {
        return 'ox_' . bin2hex(random_bytes(32));
    }
    
    private function generate_secret_key() {
        return 'ox_sk_' . bin2hex(random_bytes(32));
    }
    
    public function enqueue_scripts() {
        wp_enqueue_script('omnix-chatbot', OMNIX_CHATBOT_PLUGIN_URL . 'assets/chatbot-widget.js', array('jquery'), OMNIX_CHATBOT_VERSION, true);
        wp_enqueue_style('omnix-chatbot', OMNIX_CHATBOT_PLUGIN_URL . 'assets/chatbot-widget.css', array(), OMNIX_CHATBOT_VERSION);
        
        wp_localize_script('omnix-chatbot', 'omnixChatbot', array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('omnix_chatbot_nonce'),
            'apiUrl' => $this->api_base_url
        ));
    }
    
    public function chatbot_shortcode($atts) {
        $atts = shortcode_atts(array(
            'bot_id' => '',
            'access_token' => '',
            'theme' => 'default',
            'position' => 'bottom-right',
            'auto_open' => 'false',
            'show_avatar' => 'true',
            'show_title' => 'true',
            'enable_voice' => 'true',
            'voice_language' => 'en-US',
            'auto_speak' => 'false'
        ), $atts);
        
        if (empty($atts['bot_id']) || empty($atts['access_token'])) {
            return '<div class="omnix-chatbot-error">Bot ID and Access Token are required</div>';
        }
        
        $widget_id = 'omnix-chatbot-' . uniqid();
        
        ob_start();
        ?>
        <div id="<?php echo esc_attr($widget_id); ?>" 
             class="omnix-chatbot-widget" 
             data-bot-id="<?php echo esc_attr($atts['bot_id']); ?>"
             data-access-token="<?php echo esc_attr($atts['access_token']); ?>"
             data-theme="<?php echo esc_attr($atts['theme']); ?>"
             data-position="<?php echo esc_attr($atts['position']); ?>"
             data-auto-open="<?php echo esc_attr($atts['auto_open']); ?>"
             data-show-avatar="<?php echo esc_attr($atts['show_avatar']); ?>"
             data-show-title="<?php echo esc_attr($atts['show_title']); ?>"
             data-enable-voice="<?php echo esc_attr($atts['enable_voice']); ?>"
             data-voice-language="<?php echo esc_attr($atts['voice_language']); ?>"
             data-auto-speak="<?php echo esc_attr($atts['auto_speak']); ?>">
        </div>
        <?php
        return ob_get_clean();
    }
    
    public function chatbot_widget_shortcode($atts) {
        return $this->chatbot_shortcode($atts);
    }
    
    public function get_tokens($user_id = null) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'omnix_chatbot_tokens';
        
        $where = "is_active = 1";
        if ($user_id) {
            $where .= $wpdb->prepare(" AND user_id = %d", $user_id);
        }
        
        return $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table_name WHERE $where ORDER BY created_at DESC"
        ));
    }
    
    public function get_token_by_access_token($access_token) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'omnix_chatbot_tokens';
        
        return $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM $table_name WHERE access_token = %s AND is_active = 1",
            $access_token
        ));
    }
    
    public function log_api_request($token_id, $endpoint, $method, $status_code, $response_time_ms = null, $ip_address = null, $user_agent = null, $request_data = null, $response_data = null, $error_message = null) {
        if (!get_option('omnix_chatbot_enable_logging', true)) {
            return;
        }
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'omnix_chatbot_logs';
        
        $wpdb->insert(
            $table_name,
            array(
                'token_id' => $token_id,
                'endpoint' => $endpoint,
                'method' => $method,
                'status_code' => $status_code,
                'response_time_ms' => $response_time_ms,
                'ip_address' => $ip_address ?: $_SERVER['REMOTE_ADDR'],
                'user_agent' => $user_agent ?: $_SERVER['HTTP_USER_AGENT'],
                'request_data' => $request_data,
                'response_data' => $response_data,
                'error_message' => $error_message
            ),
            array('%d', '%s', '%s', '%d', '%d', '%s', '%s', '%s', '%s', '%s')
        );
        
        // Update token usage
        $token_table = $wpdb->prefix . 'omnix_chatbot_tokens';
        $wpdb->query($wpdb->prepare(
            "UPDATE $token_table SET usage_count = usage_count + 1, last_used = NOW() WHERE id = %d",
            $token_id
        ));
    }
}

// Initialize the plugin
new OmniXChatbotPlugin();

// Add REST API endpoints for external access
add_action('rest_api_init', function() {
    register_rest_route('omnix-chatbot/v1', '/chat', array(
        'methods' => 'POST',
        'callback' => 'omnix_handle_chat_request',
        'permission_callback' => 'omnix_verify_token_permission'
    ));
    
    register_rest_route('omnix-chatbot/v1', '/bots', array(
        'methods' => 'GET',
        'callback' => 'omnix_get_bots',
        'permission_callback' => 'omnix_verify_token_permission'
    ));
    
    register_rest_route('omnix-chatbot/v1', '/conversations', array(
        'methods' => 'GET',
        'callback' => 'omnix_get_conversations',
        'permission_callback' => 'omnix_verify_token_permission'
    ));
    
    register_rest_route('omnix-chatbot/v1', '/analytics', array(
        'methods' => 'GET',
        'callback' => 'omnix_get_analytics',
        'permission_callback' => 'omnix_verify_token_permission'
    ));
    
    // NEW: Data export endpoints for WordPress content
    register_rest_route('omnix-chatbot/v1', '/export/posts', array(
        'methods' => 'GET',
        'callback' => 'omnix_export_posts',
        'permission_callback' => 'omnix_verify_token_permission'
    ));
    
    register_rest_route('omnix-chatbot/v1', '/export/pages', array(
        'methods' => 'GET',
        'callback' => 'omnix_export_pages',
        'permission_callback' => 'omnix_verify_token_permission'
    ));
    
    register_rest_route('omnix-chatbot/v1', '/export/categories', array(
        'methods' => 'GET',
        'callback' => 'omnix_export_categories',
        'permission_callback' => 'omnix_verify_token_permission'
    ));
    
    register_rest_route('omnix-chatbot/v1', '/export/tags', array(
        'methods' => 'GET',
        'callback' => 'omnix_export_tags',
        'permission_callback' => 'omnix_verify_token_permission'
    ));
    
    register_rest_route('omnix-chatbot/v1', '/export/media', array(
        'methods' => 'GET',
        'callback' => 'omnix_export_media',
        'permission_callback' => 'omnix_verify_token_permission'
    ));
    
    register_rest_route('omnix-chatbot/v1', '/export/site-info', array(
        'methods' => 'GET',
        'callback' => 'omnix_export_site_info',
        'permission_callback' => 'omnix_verify_token_permission'
    ));
    
    register_rest_route('omnix-chatbot/v1', '/export/full', array(
        'methods' => 'POST',
        'callback' => 'omnix_export_full_site',
        'permission_callback' => 'omnix_verify_token_permission'
    ));
});

function omnix_verify_token_permission($request) {
    $access_token = $request->get_header('authorization');
    
    if (!$access_token) {
        return new WP_Error('no_token', 'Access token required', array('status' => 401));
    }
    
    // Remove 'Bearer ' prefix if present
    $access_token = str_replace('Bearer ', '', $access_token);
    
    $plugin = new OmniXChatbotPlugin();
    $token = $plugin->get_token_by_access_token($access_token);
    
    if (!$token) {
        return new WP_Error('invalid_token', 'Invalid access token', array('status' => 401));
    }
    
    // Check if token is expired
    if ($token->expires_at && strtotime($token->expires_at) < time()) {
        return new WP_Error('expired_token', 'Access token has expired', array('status' => 401));
    }
    
    // Store token info for use in callbacks
    $request->set_param('token_info', $token);
    
    return true;
}

function omnix_handle_chat_request($request) {
    $token_info = $request->get_param('token_info');
    $body = $request->get_json_params();
    
    $start_time = microtime(true);
    
    // Forward request to your chatbot API
    $api_url = get_option('omnix_chatbot_api_url');
    $api_key = get_option('omnix_chatbot_api_key');
    
    $response = wp_remote_post($api_url . '/api/chat', array(
        'headers' => array(
            'Authorization' => 'Bearer ' . $api_key,
            'Content-Type' => 'application/json'
        ),
        'body' => json_encode(array_merge($body, array(
            'botId' => $token_info->bot_id,
            'accessToken' => $token_info->access_token
        ))),
        'timeout' => 30
    ));
    
    $response_time_ms = round((microtime(true) - $start_time) * 1000);
    
    if (is_wp_error($response)) {
        $plugin = new OmniXChatbotPlugin();
        $plugin->log_api_request(
            $token_info->id,
            '/api/chat',
            'POST',
            500,
            $response_time_ms,
            $_SERVER['REMOTE_ADDR'],
            $_SERVER['HTTP_USER_AGENT'],
            json_encode($body),
            null,
            $response->get_error_message()
        );
        
        return new WP_Error('api_error', 'Failed to connect to chatbot API', array('status' => 500));
    }
    
    $status_code = wp_remote_retrieve_response_code($response);
    $response_body = wp_remote_retrieve_body($response);
    
    $plugin = new OmniXChatbotPlugin();
    $plugin->log_api_request(
        $token_info->id,
        '/api/chat',
        'POST',
        $status_code,
        $response_time_ms,
        $_SERVER['REMOTE_ADDR'],
        $_SERVER['HTTP_USER_AGENT'],
        json_encode($body),
        $response_body
    );
    
    return json_decode($response_body, true);
}

function omnix_get_bots($request) {
    $token_info = $request->get_param('token_info');
    
    // Check if token has permission to access bots
    $permissions = explode(',', $token_info->permissions);
    if (!in_array('bots', $permissions)) {
        return new WP_Error('insufficient_permissions', 'Insufficient permissions', array('status' => 403));
    }
    
    $api_url = get_option('omnix_chatbot_api_url');
    $api_key = get_option('omnix_chatbot_api_key');
    
    $response = wp_remote_get($api_url . '/api/bots', array(
        'headers' => array(
            'Authorization' => 'Bearer ' . $api_key,
            'Content-Type' => 'application/json'
        ),
        'timeout' => 10
    ));
    
    if (is_wp_error($response)) {
        return new WP_Error('api_error', 'Failed to fetch bots', array('status' => 500));
    }
    
    return json_decode(wp_remote_retrieve_body($response), true);
}

function omnix_get_conversations($request) {
    $token_info = $request->get_param('token_info');
    
    $permissions = explode(',', $token_info->permissions);
    if (!in_array('conversations', $permissions)) {
        return new WP_Error('insufficient_permissions', 'Insufficient permissions', array('status' => 403));
    }
    
    $api_url = get_option('omnix_chatbot_api_url');
    $api_key = get_option('omnix_chatbot_api_key');
    
    $response = wp_remote_get($api_url . '/api/conversations?bot_id=' . $token_info->bot_id, array(
        'headers' => array(
            'Authorization' => 'Bearer ' . $api_key,
            'Content-Type' => 'application/json'
        ),
        'timeout' => 10
    ));
    
    if (is_wp_error($response)) {
        return new WP_Error('api_error', 'Failed to fetch conversations', array('status' => 500));
    }
    
    return json_decode(wp_remote_retrieve_body($response), true);
}

function omnix_get_analytics($request) {
    $token_info = $request->get_param('token_info');
    
    $permissions = explode(',', $token_info->permissions);
    if (!in_array('analytics', $permissions)) {
        return new WP_Error('insufficient_permissions', 'Insufficient permissions', array('status' => 403));
    }
    
    $api_url = get_option('omnix_chatbot_api_url');
    $api_key = get_option('omnix_chatbot_api_key');
    
    $response = wp_remote_get($api_url . '/api/analytics?bot_id=' . $token_info->bot_id, array(
        'headers' => array(
            'Authorization' => 'Bearer ' . $api_key,
            'Content-Type' => 'application/json'
        ),
        'timeout' => 10
    ));
    
    if (is_wp_error($response)) {
        return new WP_Error('api_error', 'Failed to fetch analytics', array('status' => 500));
    }
    
    return json_decode(wp_remote_retrieve_body($response), true);
}

// NEW: Export WordPress posts
function omnix_export_posts($request) {
    $token_info = $request->get_param('token_info');
    
    // Check permissions
    $permissions = explode(',', $token_info->permissions);
    if (!in_array('export', $permissions) && !in_array('all', $permissions)) {
        return new WP_Error('insufficient_permissions', 'Insufficient permissions for data export', array('status' => 403));
    }
    
    $params = $request->get_params();
    $limit = isset($params['limit']) ? intval($params['limit']) : 100;
    $offset = isset($params['offset']) ? intval($params['offset']) : 0;
    $post_type = isset($params['post_type']) ? sanitize_text_field($params['post_type']) : 'post';
    $status = isset($params['status']) ? sanitize_text_field($params['status']) : 'publish';
    
    $args = array(
        'post_type' => $post_type,
        'post_status' => $status,
        'posts_per_page' => $limit,
        'offset' => $offset,
        'orderby' => 'date',
        'order' => 'DESC'
    );
    
    $posts = get_posts($args);
    $exported_posts = array();
    
    foreach ($posts as $post) {
        $exported_posts[] = array(
            'id' => $post->ID,
            'title' => $post->post_title,
            'content' => $post->post_content,
            'excerpt' => $post->post_excerpt,
            'slug' => $post->post_name,
            'status' => $post->post_status,
            'type' => $post->post_type,
            'date' => $post->post_date,
            'modified' => $post->post_modified,
            'author' => get_the_author_meta('display_name', $post->post_author),
            'url' => get_permalink($post->ID),
            'featured_image' => get_the_post_thumbnail_url($post->ID, 'full'),
            'categories' => wp_get_post_categories($post->ID, array('fields' => 'names')),
            'tags' => wp_get_post_tags($post->ID, array('fields' => 'names')),
            'meta' => get_post_meta($post->ID)
        );
    }
    
    return array(
        'success' => true,
        'data' => $exported_posts,
        'total' => wp_count_posts($post_type)->$status,
        'limit' => $limit,
        'offset' => $offset
    );
}

// NEW: Export WordPress pages
function omnix_export_pages($request) {
    $token_info = $request->get_param('token_info');
    
    $permissions = explode(',', $token_info->permissions);
    if (!in_array('export', $permissions) && !in_array('all', $permissions)) {
        return new WP_Error('insufficient_permissions', 'Insufficient permissions for data export', array('status' => 403));
    }
    
    $params = $request->get_params();
    $limit = isset($params['limit']) ? intval($params['limit']) : 100;
    $offset = isset($params['offset']) ? intval($params['offset']) : 0;
    
    $args = array(
        'post_type' => 'page',
        'post_status' => 'publish',
        'posts_per_page' => $limit,
        'offset' => $offset,
        'orderby' => 'menu_order',
        'order' => 'ASC'
    );
    
    $pages = get_posts($args);
    $exported_pages = array();
    
    foreach ($pages as $page) {
        $exported_pages[] = array(
            'id' => $page->ID,
            'title' => $page->post_title,
            'content' => $page->post_content,
            'excerpt' => $page->post_excerpt,
            'slug' => $page->post_name,
            'status' => $page->post_status,
            'type' => $page->post_type,
            'date' => $page->post_date,
            'modified' => $page->post_modified,
            'author' => get_the_author_meta('display_name', $page->post_author),
            'url' => get_permalink($page->ID),
            'featured_image' => get_the_post_thumbnail_url($page->ID, 'full'),
            'parent' => $page->post_parent,
            'menu_order' => $page->menu_order,
            'meta' => get_post_meta($page->ID)
        );
    }
    
    return array(
        'success' => true,
        'data' => $exported_pages,
        'total' => wp_count_posts('page')->publish,
        'limit' => $limit,
        'offset' => $offset
    );
}

// NEW: Export categories
function omnix_export_categories($request) {
    $token_info = $request->get_param('token_info');
    
    $permissions = explode(',', $token_info->permissions);
    if (!in_array('export', $permissions) && !in_array('all', $permissions)) {
        return new WP_Error('insufficient_permissions', 'Insufficient permissions for data export', array('status' => 403));
    }
    
    $categories = get_categories(array(
        'hide_empty' => false,
        'orderby' => 'name',
        'order' => 'ASC'
    ));
    
    $exported_categories = array();
    
    foreach ($categories as $category) {
        $exported_categories[] = array(
            'id' => $category->term_id,
            'name' => $category->name,
            'slug' => $category->slug,
            'description' => $category->description,
            'count' => $category->count,
            'parent' => $category->parent,
            'url' => get_category_link($category->term_id)
        );
    }
    
    return array(
        'success' => true,
        'data' => $exported_categories,
        'total' => count($exported_categories)
    );
}

// NEW: Export tags
function omnix_export_tags($request) {
    $token_info = $request->get_param('token_info');
    
    $permissions = explode(',', $token_info->permissions);
    if (!in_array('export', $permissions) && !in_array('all', $permissions)) {
        return new WP_Error('insufficient_permissions', 'Insufficient permissions for data export', array('status' => 403));
    }
    
    $tags = get_tags(array(
        'hide_empty' => false,
        'orderby' => 'name',
        'order' => 'ASC'
    ));
    
    $exported_tags = array();
    
    foreach ($tags as $tag) {
        $exported_tags[] = array(
            'id' => $tag->term_id,
            'name' => $tag->name,
            'slug' => $tag->slug,
            'description' => $tag->description,
            'count' => $tag->count,
            'url' => get_tag_link($tag->term_id)
        );
    }
    
    return array(
        'success' => true,
        'data' => $exported_tags,
        'total' => count($exported_tags)
    );
}

// NEW: Export media
function omnix_export_media($request) {
    $token_info = $request->get_param('token_info');
    
    $permissions = explode(',', $token_info->permissions);
    if (!in_array('export', $permissions) && !in_array('all', $permissions)) {
        return new WP_Error('insufficient_permissions', 'Insufficient permissions for data export', array('status' => 403));
    }
    
    $params = $request->get_params();
    $limit = isset($params['limit']) ? intval($params['limit']) : 100;
    $offset = isset($params['offset']) ? intval($params['offset']) : 0;
    
    $args = array(
        'post_type' => 'attachment',
        'post_status' => 'inherit',
        'posts_per_page' => $limit,
        'offset' => $offset,
        'orderby' => 'date',
        'order' => 'DESC'
    );
    
    $media = get_posts($args);
    $exported_media = array();
    
    foreach ($media as $item) {
        $exported_media[] = array(
            'id' => $item->ID,
            'title' => $item->post_title,
            'description' => $item->post_content,
            'caption' => $item->post_excerpt,
            'alt_text' => get_post_meta($item->ID, '_wp_attachment_image_alt', true),
            'url' => wp_get_attachment_url($item->ID),
            'mime_type' => $item->post_mime_type,
            'file_size' => filesize(get_attached_file($item->ID)),
            'date' => $item->post_date,
            'modified' => $item->post_modified
        );
    }
    
    return array(
        'success' => true,
        'data' => $exported_media,
        'total' => wp_count_posts('attachment')->inherit,
        'limit' => $limit,
        'offset' => $offset
    );
}

// NEW: Export site information
function omnix_export_site_info($request) {
    $token_info = $request->get_param('token_info');
    
    $permissions = explode(',', $token_info->permissions);
    if (!in_array('export', $permissions) && !in_array('all', $permissions)) {
        return new WP_Error('insufficient_permissions', 'Insufficient permissions for data export', array('status' => 403));
    }
    
    $site_info = array(
        'name' => get_bloginfo('name'),
        'description' => get_bloginfo('description'),
        'url' => get_site_url(),
        'admin_email' => get_option('admin_email'),
        'timezone' => get_option('timezone_string'),
        'language' => get_locale(),
        'version' => get_bloginfo('version'),
        'theme' => get_option('stylesheet'),
        'active_plugins' => get_option('active_plugins'),
        'total_posts' => wp_count_posts('post')->publish,
        'total_pages' => wp_count_posts('page')->publish,
        'total_users' => count_users()['total_users'],
        'total_categories' => wp_count_terms('category'),
        'total_tags' => wp_count_terms('post_tag'),
        'total_media' => wp_count_posts('attachment')->inherit
    );
    
    return array(
        'success' => true,
        'data' => $site_info
    );
}

// NEW: Export full site data
function omnix_export_full_site($request) {
    $token_info = $request->get_param('token_info');
    
    $permissions = explode(',', $token_info->permissions);
    if (!in_array('export', $permissions) && !in_array('all', $permissions)) {
        return new WP_Error('insufficient_permissions', 'Insufficient permissions for data export', array('status' => 403));
    }
    
    $body = $request->get_json_params();
    $include_posts = isset($body['include_posts']) ? $body['include_posts'] : true;
    $include_pages = isset($body['include_pages']) ? $body['include_pages'] : true;
    $include_categories = isset($body['include_categories']) ? $body['include_categories'] : true;
    $include_tags = isset($body['include_tags']) ? $body['include_tags'] : true;
    $include_media = isset($body['include_media']) ? $body['include_media'] : false;
    $limit = isset($body['limit']) ? intval($body['limit']) : 100;
    
    $export_data = array(
        'site_info' => array(),
        'posts' => array(),
        'pages' => array(),
        'categories' => array(),
        'tags' => array(),
        'media' => array(),
        'exported_at' => current_time('mysql'),
        'exported_by' => $token_info->token_name
    );
    
    // Get site info
    $export_data['site_info'] = array(
        'name' => get_bloginfo('name'),
        'description' => get_bloginfo('description'),
        'url' => get_site_url(),
        'admin_email' => get_option('admin_email'),
        'timezone' => get_option('timezone_string'),
        'language' => get_locale(),
        'version' => get_bloginfo('version'),
        'theme' => get_option('stylesheet')
    );
    
    // Get posts
    if ($include_posts) {
        $posts = get_posts(array(
            'post_type' => 'post',
            'post_status' => 'publish',
            'posts_per_page' => $limit,
            'orderby' => 'date',
            'order' => 'DESC'
        ));
        
        foreach ($posts as $post) {
            $export_data['posts'][] = array(
                'id' => $post->ID,
                'title' => $post->post_title,
                'content' => $post->post_content,
                'excerpt' => $post->post_excerpt,
                'slug' => $post->post_name,
                'date' => $post->post_date,
                'modified' => $post->post_modified,
                'author' => get_the_author_meta('display_name', $post->post_author),
                'url' => get_permalink($post->ID),
                'featured_image' => get_the_post_thumbnail_url($post->ID, 'full'),
                'categories' => wp_get_post_categories($post->ID, array('fields' => 'names')),
                'tags' => wp_get_post_tags($post->ID, array('fields' => 'names'))
            );
        }
    }
    
    // Get pages
    if ($include_pages) {
        $pages = get_posts(array(
            'post_type' => 'page',
            'post_status' => 'publish',
            'posts_per_page' => $limit,
            'orderby' => 'menu_order',
            'order' => 'ASC'
        ));
        
        foreach ($pages as $page) {
            $export_data['pages'][] = array(
                'id' => $page->ID,
                'title' => $page->post_title,
                'content' => $page->post_content,
                'excerpt' => $page->post_excerpt,
                'slug' => $page->post_name,
                'date' => $page->post_date,
                'modified' => $page->post_modified,
                'author' => get_the_author_meta('display_name', $page->post_author),
                'url' => get_permalink($page->ID),
                'featured_image' => get_the_post_thumbnail_url($page->ID, 'full'),
                'parent' => $page->post_parent,
                'menu_order' => $page->menu_order
            );
        }
    }
    
    // Get categories
    if ($include_categories) {
        $categories = get_categories(array('hide_empty' => false));
        foreach ($categories as $category) {
            $export_data['categories'][] = array(
                'id' => $category->term_id,
                'name' => $category->name,
                'slug' => $category->slug,
                'description' => $category->description,
                'count' => $category->count,
                'parent' => $category->parent
            );
        }
    }
    
    // Get tags
    if ($include_tags) {
        $tags = get_tags(array('hide_empty' => false));
        foreach ($tags as $tag) {
            $export_data['tags'][] = array(
                'id' => $tag->term_id,
                'name' => $tag->name,
                'slug' => $tag->slug,
                'description' => $tag->description,
                'count' => $tag->count
            );
        }
    }
    
    // Get media
    if ($include_media) {
        $media = get_posts(array(
            'post_type' => 'attachment',
            'post_status' => 'inherit',
            'posts_per_page' => $limit,
            'orderby' => 'date',
            'order' => 'DESC'
        ));
        
        foreach ($media as $item) {
            $export_data['media'][] = array(
                'id' => $item->ID,
                'title' => $item->post_title,
                'description' => $item->post_content,
                'caption' => $item->post_excerpt,
                'alt_text' => get_post_meta($item->ID, '_wp_attachment_image_alt', true),
                'url' => wp_get_attachment_url($item->ID),
                'mime_type' => $item->post_mime_type,
                'date' => $item->post_date
            );
        }
    }
    
    return array(
        'success' => true,
        'data' => $export_data,
        'summary' => array(
            'posts_count' => count($export_data['posts']),
            'pages_count' => count($export_data['pages']),
            'categories_count' => count($export_data['categories']),
            'tags_count' => count($export_data['tags']),
            'media_count' => count($export_data['media'])
        )
    );
}
?>
