<?php
/**
 * Plugin Name: OmniX Smart Sync
 * Description: Automatically syncs WordPress content to OmniX chatbot platform and embeds the chatbot widget. No manual setup required!
 * Version: 2.0.0
 * Author: OmniX Team
 * License: GPL v2 or later
 * Text Domain: omnix-smart-sync
 * Requires at least: 5.0
 * Tested up to: 6.4
 * Requires PHP: 7.4
 */

if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('OMNIX_SMART_SYNC_VERSION', '2.0.0');
define('OMNIX_SMART_SYNC_PLUGIN_URL', plugin_dir_url(__FILE__));
define('OMNIX_SMART_SYNC_PLUGIN_PATH', plugin_dir_path(__FILE__));

class OmniX_Smart_Sync {
    
    private $api_base_url;
    private $bot_id;
    private $access_token;
    private $sync_enabled;
    
    public function __construct() {
        $this->api_base_url = get_option('omnix_smart_sync_api_url', 'https://68904f022ec3.ngrok-free.app');
        $this->bot_id = get_option('omnix_smart_sync_bot_id', '');
        $this->access_token = get_option('omnix_smart_sync_access_token', '');
        $this->sync_enabled = get_option('omnix_smart_sync_enabled', false);
        
        add_action('init', array($this, 'init'));
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'admin_init'));
        add_action('wp_footer', array($this, 'inject_chatbot_script'));
        
        // Auto-sync hooks
        add_action('save_post', array($this, 'auto_sync_content'), 10, 3);
        add_action('wp_ajax_omnix_register_site', array($this, 'ajax_register_site'));
        add_action('wp_ajax_omnix_manual_sync', array($this, 'ajax_manual_sync'));
        add_action('wp_ajax_omnix_test_connection', array($this, 'ajax_test_connection'));
        
        // Activation/Deactivation hooks
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
    }
    
    public function init() {
        load_plugin_textdomain('omnix-smart-sync', false, dirname(plugin_basename(__FILE__)) . '/languages');
        
        // Auto-register site if not already registered
        if (!$this->access_token && $this->sync_enabled) {
            $this->register_site();
        }
    }
    
    public function activate() {
        // Set default options
        add_option('omnix_smart_sync_api_url', 'https://68904f022ec3.ngrok-free.app');
        add_option('omnix_smart_sync_bot_id', '');
        add_option('omnix_smart_sync_access_token', '');
        add_option('omnix_smart_sync_enabled', false);
        add_option('omnix_smart_sync_auto_sync', true);
        add_option('omnix_smart_sync_last_sync', '');
        
        // Try to register site automatically
        $this->register_site();
    }
    
    public function deactivate() {
        // Cleanup if needed
    }
    
    public function add_admin_menu() {
        add_menu_page(
            'OmniX Smart Sync',
            'OmniX Smart Sync',
            'manage_options',
            'omnix-smart-sync',
            array($this, 'admin_page'),
            'dashicons-update',
            30
        );
        
        add_submenu_page(
            'omnix-smart-sync',
            'Settings',
            'Settings',
            'manage_options',
            'omnix-smart-sync-settings',
            array($this, 'settings_page')
        );
    }
    
    public function admin_init() {
        register_setting('omnix_smart_sync_settings', 'omnix_smart_sync_api_url');
        register_setting('omnix_smart_sync_settings', 'omnix_smart_sync_bot_id');
        register_setting('omnix_smart_sync_settings', 'omnix_smart_sync_enabled');
        register_setting('omnix_smart_sync_settings', 'omnix_smart_sync_auto_sync');
    }
    
    public function admin_page() {
        $sync_status = get_option('omnix_smart_sync_last_sync', 'Never');
        $total_posts = wp_count_posts('post')->publish;
        $total_pages = wp_count_posts('page')->publish;
        $total_categories = wp_count_terms('category');
        $total_tags = wp_count_terms('post_tag');
        
        ?>
        <div class="wrap">
            <h1>OmniX Smart Sync Dashboard</h1>
            
            <div class="card" style="max-width: 1000px;">
                <h2>📊 Sync Status</h2>
                <table class="form-table">
                    <tr>
                        <th>Connection Status</th>
                        <td>
                            <?php if ($this->access_token): ?>
                                <span style="color: green;">✅ Connected</span>
                            <?php else: ?>
                                <span style="color: red;">❌ Not Connected</span>
                            <?php endif; ?>
                        </td>
                    </tr>
                    <tr>
                        <th>Last Sync</th>
                        <td><?php echo esc_html($sync_status); ?></td>
                    </tr>
                    <tr>
                        <th>Content Ready for Sync</th>
                        <td>
                            <strong><?php echo $total_posts; ?></strong> Posts • 
                            <strong><?php echo $total_pages; ?></strong> Pages • 
                            <strong><?php echo $total_categories; ?></strong> Categories • 
                            <strong><?php echo $total_tags; ?></strong> Tags
                        </td>
                    </tr>
                </table>
                
                <p class="submit">
                    <button id="manual-sync" class="button button-primary" <?php echo !$this->access_token ? 'disabled' : ''; ?>>
                        🔄 Sync Now
                    </button>
                    <button id="test-connection" class="button button-secondary">
                        🔍 Test Connection
                    </button>
                </p>
                
                <div id="sync-status" style="margin-top: 15px;"></div>
            </div>
            
            <div class="card" style="max-width: 1000px;">
                <h2>🚀 Quick Setup</h2>
                <?php if (!$this->access_token): ?>
                    <p>Click the button below to automatically connect your WordPress site to OmniX:</p>
                    <button id="register-site" class="button button-primary button-large">
                        Connect to OmniX Platform
                    </button>
                <?php else: ?>
                    <p style="color: green;">✅ Your site is connected to OmniX! The chatbot will appear on your website automatically.</p>
                    <p><strong>Access Token:</strong> <code><?php echo esc_html(substr($this->access_token, 0, 20) . '...'); ?></code></p>
                <?php endif; ?>
            </div>
            
            <div class="card" style="max-width: 1000px;">
                <h2>📝 How It Works</h2>
                <ol>
                    <li><strong>Auto-Connect:</strong> The plugin automatically registers your site with OmniX</li>
                    <li><strong>Content Sync:</strong> Your pages, posts, and content are synced to Pinecone database</li>
                    <li><strong>Smart Chatbot:</strong> AI chatbot appears on your site with your content knowledge</li>
                    <li><strong>Auto-Updates:</strong> New content is automatically synced when you publish</li>
                </ol>
            </div>
        </div>
        
        <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Register site
            document.getElementById('register-site')?.addEventListener('click', function() {
                const button = this;
                button.disabled = true;
                button.textContent = 'Connecting...';
                
                fetch(ajaxurl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: 'action=omnix_register_site&nonce=<?php echo wp_create_nonce('omnix_register_site'); ?>'
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        location.reload();
                    } else {
                        alert('Connection failed: ' + (data.data || 'Unknown error'));
                        button.disabled = false;
                        button.textContent = 'Connect to OmniX Platform';
                    }
                })
                .catch(error => {
                    alert('Connection failed: ' + error.message);
                    button.disabled = false;
                    button.textContent = 'Connect to OmniX Platform';
                });
            });
            
            // Manual sync
            document.getElementById('manual-sync')?.addEventListener('click', function() {
                const button = this;
                const status = document.getElementById('sync-status');
                
                button.disabled = true;
                button.textContent = 'Syncing...';
                status.innerHTML = '<p>🔄 Syncing content to OmniX platform...</p>';
                
                fetch(ajaxurl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: 'action=omnix_manual_sync&nonce=<?php echo wp_create_nonce('omnix_manual_sync'); ?>'
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        status.innerHTML = '<p style="color: green;">✅ Sync completed successfully!</p>';
                        location.reload();
                    } else {
                        status.innerHTML = '<p style="color: red;">❌ Sync failed: ' + (data.data || 'Unknown error') + '</p>';
                    }
                })
                .catch(error => {
                    status.innerHTML = '<p style="color: red;">❌ Sync failed: ' + error.message + '</p>';
                })
                .finally(() => {
                    button.disabled = false;
                    button.textContent = '🔄 Sync Now';
                });
            });
            
            // Test connection
            document.getElementById('test-connection')?.addEventListener('click', function() {
                const button = this;
                const status = document.getElementById('sync-status');
                
                button.disabled = true;
                button.textContent = 'Testing...';
                status.innerHTML = '<p>🔍 Testing connection...</p>';
                
                fetch(ajaxurl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: 'action=omnix_test_connection&nonce=<?php echo wp_create_nonce('omnix_test_connection'); ?>'
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        status.innerHTML = '<p style="color: green;">✅ Connection successful!</p>';
                    } else {
                        status.innerHTML = '<p style="color: red;">❌ Connection failed: ' + (data.data || 'Unknown error') + '</p>';
                    }
                })
                .catch(error => {
                    status.innerHTML = '<p style="color: red;">❌ Connection failed: ' + error.message + '</p>';
                })
                .finally(() => {
                    button.disabled = false;
                    button.textContent = '🔍 Test Connection';
                });
            });
        });
        </script>
        <?php
    }
    
    public function settings_page() {
        if (isset($_POST['save_settings']) && check_admin_referer('omnix_smart_sync_save')) {
            update_option('omnix_smart_sync_api_url', sanitize_url($_POST['api_url']));
            update_option('omnix_smart_sync_bot_id', sanitize_text_field($_POST['bot_id']));
            update_option('omnix_smart_sync_enabled', isset($_POST['enabled']));
            update_option('omnix_smart_sync_auto_sync', isset($_POST['auto_sync']));
            echo '<div class="updated"><p>Settings saved successfully!</p></div>';
        }
        
        $api_url = get_option('omnix_smart_sync_api_url', 'https://68904f022ec3.ngrok-free.app');
        $bot_id = get_option('omnix_smart_sync_bot_id', '');
        $enabled = get_option('omnix_smart_sync_enabled', false);
        $auto_sync = get_option('omnix_smart_sync_auto_sync', true);
        
        ?>
        <div class="wrap">
            <h1>OmniX Smart Sync Settings</h1>
            
            <form method="post">
                <?php wp_nonce_field('omnix_smart_sync_save'); ?>
                <table class="form-table">
                    <tr>
                        <th scope="row">OmniX Platform URL</th>
                        <td>
                            <input type="url" name="api_url" value="<?php echo esc_attr($api_url); ?>" class="regular-text" required>
                            <p class="description">The URL of your OmniX chatbot platform</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Bot ID</th>
                        <td>
                            <input type="text" name="bot_id" value="<?php echo esc_attr($bot_id); ?>" class="regular-text" placeholder="e.g., 48">
                            <p class="description">The ID of your bot in the OmniX platform (optional - will be auto-generated)</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Enable Sync</th>
                        <td>
                            <label>
                                <input type="checkbox" name="enabled" <?php checked($enabled); ?>>
                                Enable content sync with OmniX platform
                            </label>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Auto Sync</th>
                        <td>
                            <label>
                                <input type="checkbox" name="auto_sync" <?php checked($auto_sync); ?>>
                                Automatically sync content when posts are published
                            </label>
                        </td>
                    </tr>
                </table>
                
                <p class="submit">
                    <input type="submit" name="save_settings" class="button button-primary" value="Save Settings">
                </p>
            </form>
        </div>
        <?php
    }
    
    public function ajax_register_site() {
        check_ajax_referer('omnix_register_site', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized');
        }
        
        $result = $this->register_site();
        
        if ($result) {
            wp_send_json_success('Site registered successfully!');
        } else {
            wp_send_json_error('Failed to register site. Please check your API URL.');
        }
    }
    
    public function ajax_manual_sync() {
        check_ajax_referer('omnix_manual_sync', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized');
        }
        
        $result = $this->sync_all_content();
        
        if ($result) {
            wp_send_json_success('Content synced successfully!');
        } else {
            wp_send_json_error('Failed to sync content. Please check your connection.');
        }
    }
    
    public function ajax_test_connection() {
        check_ajax_referer('omnix_test_connection', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized');
        }
        
        $response = wp_remote_get($this->api_base_url . '/api/health', array(
            'timeout' => 10,
            'headers' => array(
                'ngrok-skip-browser-warning' => 'true'
            )
        ));
        
        if (is_wp_error($response)) {
            wp_send_json_error('Connection failed: ' . $response->get_error_message());
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        if ($status_code === 200) {
            wp_send_json_success('Connection successful!');
        } else {
            wp_send_json_error('Connection failed with status: ' . $status_code);
        }
    }
    
    private function register_site() {
        $site_url = get_site_url();
        $site_name = get_bloginfo('name');
        
        $response = wp_remote_post($this->api_base_url . '/api/wordpress/register', array(
            'headers' => array(
                'Content-Type' => 'application/json',
                'ngrok-skip-browser-warning' => 'true'
            ),
            'body' => json_encode(array(
                'site_url' => $site_url,
                'site_name' => $site_name,
                'admin_email' => get_option('admin_email'),
                'wordpress_version' => get_bloginfo('version')
            )),
            'timeout' => 30
        ));
        
        if (is_wp_error($response)) {
            return false;
        }
        
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if ($data && isset($data['access_token'])) {
            update_option('omnix_smart_sync_access_token', $data['access_token']);
            update_option('omnix_smart_sync_bot_id', $data['bot_id'] ?? '');
            update_option('omnix_smart_sync_enabled', true);
            
            // Trigger initial sync
            $this->sync_all_content();
            
            return true;
        }
        
        return false;
    }
    
    private function sync_all_content() {
        if (!$this->access_token) {
            return false;
        }
        
        $content_data = array(
            'site_info' => array(
                'name' => get_bloginfo('name'),
                'description' => get_bloginfo('description'),
                'url' => get_site_url(),
                'admin_email' => get_option('admin_email'),
                'timezone' => get_option('timezone_string'),
                'language' => get_locale(),
                'version' => get_bloginfo('version')
            ),
            'posts' => $this->get_posts_data(),
            'pages' => $this->get_pages_data(),
            'categories' => $this->get_categories_data(),
            'tags' => $this->get_tags_data()
        );
        
        $response = wp_remote_post($this->api_base_url . '/api/wordpress/sync', array(
            'headers' => array(
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . $this->access_token,
                'ngrok-skip-browser-warning' => 'true'
            ),
            'body' => json_encode($content_data),
            'timeout' => 60
        ));
        
        if (is_wp_error($response)) {
            return false;
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        if ($status_code === 200) {
            update_option('omnix_smart_sync_last_sync', current_time('mysql'));
            return true;
        }
        
        return false;
    }
    
    private function get_posts_data() {
        $posts = get_posts(array(
            'post_type' => 'post',
            'post_status' => 'publish',
            'posts_per_page' => -1,
            'orderby' => 'date',
            'order' => 'DESC'
        ));
        
        $data = array();
        foreach ($posts as $post) {
            $data[] = array(
                'id' => $post->ID,
                'title' => $post->post_title,
                'content' => wp_strip_all_tags($post->post_content),
                'excerpt' => $post->post_excerpt,
                'url' => get_permalink($post->ID),
                'date' => $post->post_date,
                'modified' => $post->post_modified,
                'author' => get_the_author_meta('display_name', $post->post_author),
                'categories' => wp_get_post_categories($post->ID, array('fields' => 'names')),
                'tags' => wp_get_post_tags($post->ID, array('fields' => 'names'))
            );
        }
        
        return $data;
    }
    
    private function get_pages_data() {
        $pages = get_posts(array(
            'post_type' => 'page',
            'post_status' => 'publish',
            'posts_per_page' => -1,
            'orderby' => 'menu_order',
            'order' => 'ASC'
        ));
        
        $data = array();
        foreach ($pages as $page) {
            $data[] = array(
                'id' => $page->ID,
                'title' => $page->post_title,
                'content' => wp_strip_all_tags($page->post_content),
                'excerpt' => $page->post_excerpt,
                'url' => get_permalink($page->ID),
                'date' => $page->post_date,
                'modified' => $page->post_modified,
                'author' => get_the_author_meta('display_name', $page->post_author),
                'parent' => $page->post_parent,
                'menu_order' => $page->menu_order
            );
        }
        
        return $data;
    }
    
    private function get_categories_data() {
        $categories = get_categories(array('hide_empty' => false));
        $data = array();
        
        foreach ($categories as $category) {
            $data[] = array(
                'id' => $category->term_id,
                'name' => $category->name,
                'slug' => $category->slug,
                'description' => $category->description,
                'count' => $category->count,
                'parent' => $category->parent,
                'url' => get_category_link($category->term_id)
            );
        }
        
        return $data;
    }
    
    private function get_tags_data() {
        $tags = get_tags(array('hide_empty' => false));
        $data = array();
        
        foreach ($tags as $tag) {
            $data[] = array(
                'id' => $tag->term_id,
                'name' => $tag->name,
                'slug' => $tag->slug,
                'description' => $tag->description,
                'count' => $tag->count,
                'url' => get_tag_link($tag->term_id)
            );
        }
        
        return $data;
    }
    
    public function auto_sync_content($post_id, $post, $update) {
        if (!$this->sync_enabled || !get_option('omnix_smart_sync_auto_sync', true)) {
            return;
        }
        
        if ($post->post_status !== 'publish') {
            return;
        }
        
        // Skip if this is an autosave or revision
        if (wp_is_post_autosave($post_id) || wp_is_post_revision($post_id)) {
            return;
        }
        
        // Sync the specific post/page
        $this->sync_single_content($post);
    }
    
    private function sync_single_content($post) {
        if (!$this->access_token) {
            return;
        }
        
        $content_data = array(
            'action' => 'update',
            'content' => array(
                'id' => $post->ID,
                'title' => $post->post_title,
                'content' => wp_strip_all_tags($post->post_content),
                'excerpt' => $post->post_excerpt,
                'url' => get_permalink($post->ID),
                'date' => $post->post_date,
                'modified' => $post->post_modified,
                'author' => get_the_author_meta('display_name', $post->post_author),
                'type' => $post->post_type
            )
        );
        
        if ($post->post_type === 'post') {
            $content_data['content']['categories'] = wp_get_post_categories($post->ID, array('fields' => 'names'));
            $content_data['content']['tags'] = wp_get_post_tags($post->ID, array('fields' => 'names'));
        }
        
        wp_remote_post($this->api_base_url . '/api/wordpress/sync', array(
            'headers' => array(
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . $this->access_token,
                'ngrok-skip-browser-warning' => 'true'
            ),
            'body' => json_encode($content_data),
            'timeout' => 30
        ));
    }
    
    public function inject_chatbot_script() {
        if (!$this->access_token || !$this->sync_enabled) {
            return;
        }
        
        $bot_id = $this->bot_id ?: 'auto';
        
        ?>
        <script>
        window.omnixChatbot = {
            apiUrl: "<?php echo esc_js($this->api_base_url); ?>",
            botId: "<?php echo esc_js($bot_id); ?>",
            accessToken: "<?php echo esc_js($this->access_token); ?>",
            autoOpen: false,
            position: "bottom-right",
            theme: "modern"
        };
        </script>
        <script src="<?php echo esc_url($this->api_base_url); ?>/public/chatbot-widget.js" defer></script>
        <?php
    }
}

// Initialize the plugin
new OmniX_Smart_Sync();
