<?php
/**
 * Plugin Name: OmniX Chatbot API
 * Description: REST API endpoints to let OmniX Chatbot query WordPress site content with automatic data sync capabilities.
 * Version: 1.0.0
 * Author: OmniX Team
 * Text Domain: omnix-chatbot-api
 * Requires at least: 5.0
 * Tested up to: 6.4
 * Requires PHP: 7.4
 * License: GPL v2 or later
 */

if (!defined('ABSPATH')) exit;

class OmniX_Chatbot_API {
    const OPTION_TOKEN_KEY = 'omnix_chatbot_api_token';
    const OPTION_SECRET_KEY = 'omnix_chatbot_secret_key';
    const OPTION_WEBHOOK_SECRET = 'omnix_chatbot_webhook_secret';
    const OPTION_API_URL = 'omnix_chatbot_api_url';
    const OPTION_BOT_ID = 'omnix_chatbot_bot_id';
    const ROUTE_NAMESPACE = 'omnix-chatbot/v1';
    const RATE_LIMIT_REQUESTS = 100; // requests per hour
    const RATE_LIMIT_WINDOW = 3600; // 1 hour in seconds

    public function __construct(){
        register_activation_hook(__FILE__, array($this, 'activate'));
        add_action('rest_api_init', array($this, 'register_routes'));
        add_action('admin_menu', array($this, 'add_admin_page'));
        add_action('admin_init', array($this, 'register_settings'));
        add_action('init', array($this, 'init'));
        
        // Auto-sync hooks
        add_action('save_post', array($this, 'auto_sync_on_save'), 10, 3);
        add_action('wp_ajax_omnix_manual_sync', array($this, 'handle_manual_sync'));
        add_action('wp_ajax_nopriv_omnix_manual_sync', array($this, 'handle_manual_sync'));
        
        // Chatbot widget hooks
        add_shortcode('omnix_chatbot', array($this, 'chatbot_shortcode'));
        add_shortcode('omnix_chatbot_debug', array($this, 'chatbot_debug_shortcode'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_chatbot_assets'));
        add_action('wp_ajax_omnix_chat', array($this, 'handle_chat_request'));
        add_action('wp_ajax_nopriv_omnix_chat', array($this, 'handle_chat_request'));
    }

    public function init(){
        load_plugin_textdomain('omnix-chatbot-api', false, dirname(plugin_basename(__FILE__)) . '/languages');
    }

    public function activate(){
        // Generate tokens if not exist
        if (!get_option(self::OPTION_TOKEN_KEY)) {
            $token = 'ox_' . wp_generate_password(32, false, false);
            update_option(self::OPTION_TOKEN_KEY, $token);
        }
        
        if (!get_option(self::OPTION_SECRET_KEY)) {
            $secret = 'ox_sk_' . wp_generate_password(32, false, false);
            update_option(self::OPTION_SECRET_KEY, $secret);
        }
        
        if (!get_option(self::OPTION_WEBHOOK_SECRET)) {
            $webhook = 'ox_wh_' . wp_generate_password(32, false, false);
            update_option(self::OPTION_WEBHOOK_SECRET, $webhook);
        }

        // Set default API URL if not set
        if (!get_option(self::OPTION_API_URL)) {
            update_option(self::OPTION_API_URL, 'https://your-domain.com');
        }
    }

    public function register_routes(){
        // Search endpoint
        register_rest_route(self::ROUTE_NAMESPACE, '/search', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_search'),
            'permission_callback' => array($this, 'permission_check'),
        ));

        // Site info endpoint
        register_rest_route(self::ROUTE_NAMESPACE, '/info', array(
            'methods' => 'GET',
            'callback' => array($this, 'handle_info'),
            'permission_callback' => array($this, 'permission_check'),
        ));

        // Export posts endpoint
        register_rest_route(self::ROUTE_NAMESPACE, '/export/posts', array(
            'methods' => 'GET',
            'callback' => array($this, 'export_posts'),
            'permission_callback' => array($this, 'permission_check'),
        ));

        // Export pages endpoint
        register_rest_route(self::ROUTE_NAMESPACE, '/export/pages', array(
            'methods' => 'GET',
            'callback' => array($this, 'export_pages'),
            'permission_callback' => array($this, 'permission_check'),
        ));

        // Export categories endpoint
        register_rest_route(self::ROUTE_NAMESPACE, '/export/categories', array(
            'methods' => 'GET',
            'callback' => array($this, 'export_categories'),
            'permission_callback' => array($this, 'permission_check'),
        ));

        // Export tags endpoint
        register_rest_route(self::ROUTE_NAMESPACE, '/export/tags', array(
            'methods' => 'GET',
            'callback' => array($this, 'export_tags'),
            'permission_callback' => array($this, 'permission_check'),
        ));

        // Export full site data
        register_rest_route(self::ROUTE_NAMESPACE, '/export/full', array(
            'methods' => 'POST',
            'callback' => array($this, 'export_full_site'),
            'permission_callback' => array($this, 'permission_check'),
        ));

        // Webhook endpoint for receiving data from OmniX platform
        register_rest_route(self::ROUTE_NAMESPACE, '/webhook/sync', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_webhook_sync'),
            'permission_callback' => array($this, 'webhook_permission_check'),
        ));
    }

    // Enhanced permission check with rate limiting
    public function permission_check(WP_REST_Request $request){
        $provided = $this->get_bearer_token_from_request($request);
        $stored = get_option(self::OPTION_TOKEN_KEY, '');
        
        if (!$stored || !hash_equals($stored, $provided)) {
            return new WP_Error('invalid_token', 'Invalid or missing authentication token', array('status' => 401));
        }

        // Rate limiting
        if (!$this->check_rate_limit($provided)) {
            return new WP_Error('rate_limit_exceeded', 'Rate limit exceeded. Please try again later.', array('status' => 429));
        }

        return true;
    }

    // Webhook permission check
    public function webhook_permission_check(WP_REST_Request $request){
        $webhook_secret = $request->get_header('x-webhook-secret');
        $stored_secret = get_option(self::OPTION_WEBHOOK_SECRET, '');
        
        if (!$stored_secret || !hash_equals($stored_secret, $webhook_secret)) {
            return new WP_Error('invalid_webhook', 'Invalid webhook secret', array('status' => 401));
        }

        return true;
    }

    private function get_bearer_token_from_request($request){
        $auth = $request->get_header('authorization');
        if (!$auth) $auth = $request->get_header('Authorization');
        if (!$auth) return '';
        if (stripos($auth, 'Bearer ') === 0){
            return trim(substr($auth, 7));
        }
        return '';
    }

    private function check_rate_limit($token){
        $key = 'omnix_rl_' . md5($token);
        $data = get_transient($key);
        
        if (!$data) {
            $data = array('count' => 0, 'start' => time());
        }
        
        // Reset if window expired
        if ($data['start'] + self::RATE_LIMIT_WINDOW < time()) {
            $data = array('count' => 0, 'start' => time());
        }
        
        $data['count']++;
        
        if ($data['count'] > self::RATE_LIMIT_REQUESTS) {
            return false;
        }
        
        set_transient($key, $data, self::RATE_LIMIT_WINDOW);
        return true;
    }

    // Site info endpoint
    public function handle_info(WP_REST_Request $request){
        return rest_ensure_response(array(
            'site' => array(
                'name' => get_bloginfo('name'),
                'description' => get_bloginfo('description'),
                'url' => get_site_url(),
                'version' => get_bloginfo('version'),
                'language' => get_locale(),
                'timezone' => get_option('timezone_string'),
                'admin_email' => get_option('admin_email')
            ),
            'content_stats' => array(
                'posts' => wp_count_posts('post')->publish,
                'pages' => wp_count_posts('page')->publish,
                'categories' => wp_count_terms('category'),
                'tags' => wp_count_terms('post_tag'),
                'media' => wp_count_posts('attachment')->inherit
            ),
            'endpoints' => array(
                '/wp-json/' . self::ROUTE_NAMESPACE . '/search' => 'POST {query, post_types, limit}',
                '/wp-json/' . self::ROUTE_NAMESPACE . '/export/posts' => 'GET posts with pagination',
                '/wp-json/' . self::ROUTE_NAMESPACE . '/export/pages' => 'GET pages with pagination',
                '/wp-json/' . self::ROUTE_NAMESPACE . '/export/categories' => 'GET all categories',
                '/wp-json/' . self::ROUTE_NAMESPACE . '/export/tags' => 'GET all tags',
                '/wp-json/' . self::ROUTE_NAMESPACE . '/export/full' => 'POST export all content'
            ),
            'bot_id' => get_option(self::OPTION_BOT_ID, ''),
            'sync_enabled' => get_option('omnix_chatbot_sync_enabled', false)
        ));
    }

    // Enhanced search endpoint
    public function handle_search(WP_REST_Request $request){
        $body = json_decode($request->get_body(), true);
        if (!is_array($body)) $body = $request->get_params();

        $query = isset($body['query']) ? sanitize_text_field($body['query']) : '';
        $limit = isset($body['limit']) ? intval($body['limit']) : 10;
        $post_types = isset($body['post_types']) && is_array($body['post_types']) ? 
            array_map('sanitize_key', $body['post_types']) : array('post', 'page');
        $include_meta = isset($body['include_meta']) ? (bool)$body['include_meta'] : false;
        $search_fields = isset($body['search_fields']) ? $body['search_fields'] : array('title', 'content', 'excerpt');

        if (empty($query)) {
            return new WP_Error('missing_query', 'Please provide a "query" in the POST body.', array('status' => 400));
        }

        $args = array(
            's' => $query,
            'post_type' => $post_types,
            'posts_per_page' => max(1, min(50, $limit)),
            'post_status' => 'publish',
            'meta_query' => array(
                'relation' => 'OR',
                array(
                    'key' => '_omnix_exclude_from_search',
                    'value' => '1',
                    'compare' => '!='
                ),
                array(
                    'key' => '_omnix_exclude_from_search',
                    'compare' => 'NOT EXISTS'
                )
            )
        );

        $wp_query = new WP_Query($args);
        $results = array();

        foreach ($wp_query->posts as $post) {
            $result = array(
                'id' => $post->ID,
                'title' => get_the_title($post),
                'slug' => $post->post_name,
                'excerpt' => $this->get_safe_excerpt($post),
                'content' => $this->get_safe_content($post),
                'url' => get_permalink($post),
                'post_type' => $post->post_type,
                'date' => $post->post_date,
                'modified' => $post->post_modified,
                'author' => get_the_author_meta('display_name', $post->post_author),
                'featured_image' => get_the_post_thumbnail_url($post->ID, 'full'),
                'categories' => wp_get_post_categories($post->ID, array('fields' => 'names')),
                'tags' => wp_get_post_tags($post->ID, array('fields' => 'names')),
                'word_count' => str_word_count(strip_tags($post->post_content))
            );

            if ($include_meta) {
                $result['meta'] = $this->get_safe_meta($post->ID);
            }

            $results[] = $result;
        }

        return rest_ensure_response(array(
            'query' => $query,
            'count' => count($results),
            'total_found' => $wp_query->found_posts,
            'results' => $results,
            'search_fields' => $search_fields,
            'execution_time' => timer_stop()
        ));
    }

    // Export posts
    public function export_posts(WP_REST_Request $request){
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
                'meta' => $this->get_safe_meta($post->ID)
            );
        }

        return rest_ensure_response(array(
            'success' => true,
            'data' => $exported_posts,
            'total' => wp_count_posts($post_type)->$status,
            'limit' => $limit,
            'offset' => $offset,
            'exported_at' => current_time('mysql')
        ));
    }

    // Export pages
    public function export_pages(WP_REST_Request $request){
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
                'meta' => $this->get_safe_meta($page->ID)
            );
        }

        return rest_ensure_response(array(
            'success' => true,
            'data' => $exported_pages,
            'total' => wp_count_posts('page')->publish,
            'limit' => $limit,
            'offset' => $offset,
            'exported_at' => current_time('mysql')
        ));
    }

    // Export categories
    public function export_categories(WP_REST_Request $request){
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

        return rest_ensure_response(array(
            'success' => true,
            'data' => $exported_categories,
            'total' => count($exported_categories),
            'exported_at' => current_time('mysql')
        ));
    }

    // Export tags
    public function export_tags(WP_REST_Request $request){
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

        return rest_ensure_response(array(
            'success' => true,
            'data' => $exported_tags,
            'total' => count($exported_tags),
            'exported_at' => current_time('mysql')
        ));
    }

    // Export full site data
    public function export_full_site(WP_REST_Request $request){
        $body = $request->get_json_params();
        $include_posts = isset($body['include_posts']) ? $body['include_posts'] : true;
        $include_pages = isset($body['include_pages']) ? $body['include_pages'] : true;
        $include_categories = isset($body['include_categories']) ? $body['include_categories'] : true;
        $include_tags = isset($body['include_tags']) ? $body['include_tags'] : true;
        $include_media = isset($body['include_media']) ? $body['include_media'] : false;
        $limit = isset($body['limit']) ? intval($body['limit']) : 100;

        $export_data = array(
            'site_info' => array(
                'name' => get_bloginfo('name'),
                'description' => get_bloginfo('description'),
                'url' => get_site_url(),
                'admin_email' => get_option('admin_email'),
                'timezone' => get_option('timezone_string'),
                'language' => get_locale(),
                'version' => get_bloginfo('version'),
                'theme' => get_option('stylesheet')
            ),
            'posts' => array(),
            'pages' => array(),
            'categories' => array(),
            'tags' => array(),
            'media' => array(),
            'exported_at' => current_time('mysql'),
            'exported_by' => 'omnix_chatbot_api'
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

        return rest_ensure_response(array(
            'success' => true,
            'data' => $export_data,
            'summary' => array(
                'posts_count' => count($export_data['posts']),
                'pages_count' => count($export_data['pages']),
                'categories_count' => count($export_data['categories']),
                'tags_count' => count($export_data['tags']),
                'media_count' => count($export_data['media'])
            )
        ));
    }

    // Webhook handler for receiving data from OmniX platform
    public function handle_webhook_sync(WP_REST_Request $request){
        $body = $request->get_json_params();
        $action = $body['action'] ?? 'sync';

        error_log('OmniX Webhook received: ' . $action);

        switch ($action) {
            case 'sync':
                return rest_ensure_response(array(
                    'success' => true,
                    'message' => 'Sync webhook received',
                    'action' => $action,
                    'timestamp' => current_time('mysql')
                ));

            case 'update_settings':
                $settings = $body['settings'] ?? array();
                foreach ($settings as $key => $value) {
                    update_option('omnix_chatbot_' . $key, $value);
                }
                return rest_ensure_response(array(
                    'success' => true,
                    'message' => 'Settings updated',
                    'action' => $action
                ));

            default:
                return new WP_Error('unknown_action', 'Unknown webhook action', array('status' => 400));
        }
    }

    // Auto-sync on post save
    public function auto_sync_on_save($post_id, $post, $update){
        if (get_option('omnix_chatbot_auto_sync', false) && $post->post_status === 'publish') {
            $this->trigger_sync_to_platform($post);
        }
    }

    // Manual sync handler
    public function handle_manual_sync(){
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized');
        }

        $this->trigger_full_sync_to_platform();
        wp_send_json_success('Manual sync triggered');
    }

    // Trigger sync to OmniX platform
    private function trigger_sync_to_platform($post = null){
        $api_url = get_option(self::OPTION_API_URL);
        $bot_id = get_option(self::OPTION_BOT_ID);
        $webhook_secret = get_option(self::OPTION_WEBHOOK_SECRET);

        if (!$api_url || !$bot_id || !$webhook_secret) {
            return false;
        }

        $data = array(
            'bot_id' => $bot_id,
            'site_url' => get_site_url(),
            'action' => 'sync',
            'timestamp' => current_time('mysql')
        );

        if ($post) {
            $data['post'] = array(
                'id' => $post->ID,
                'title' => $post->post_title,
                'content' => $post->post_content,
                'url' => get_permalink($post)
            );
        }

        $response = wp_remote_post($api_url . '/api/webhooks/wordpress', array(
            'headers' => array(
                'Content-Type' => 'application/json',
                'X-Webhook-Secret' => $webhook_secret
            ),
            'body' => json_encode($data),
            'timeout' => 30
        ));

        return !is_wp_error($response);
    }

    private function trigger_full_sync_to_platform(){
        // Implementation for full sync
        return $this->trigger_sync_to_platform();
    }

    // Helper methods
    private function get_safe_excerpt($post){
        if ($post->post_excerpt) {
            return wp_trim_words(wp_strip_all_tags($post->post_excerpt), 40, '...');
        }
        return wp_trim_words(wp_strip_all_tags($post->post_content), 40, '...');
    }

    private function get_safe_content($post){
        return wp_kses_post(wp_trim_words(wp_strip_all_tags($post->post_content), 200, '...'));
    }

    private function get_safe_meta($post_id){
        $meta = get_post_meta($post_id);
        $filtered_meta = array();
        
        foreach ($meta as $key => $value) {
            // Skip sensitive meta keys
            if (preg_match('/(password|secret|token|api|key|credit|card|ssn|_edit|_edit_lock)/i', $key)) {
                continue;
            }
            $filtered_meta[$key] = maybe_unserialize($value[0]);
        }
        
        return $filtered_meta;
    }

    // Admin page
    public function add_admin_page(){
        add_options_page(
            'OmniX Chatbot API',
            'OmniX Chatbot API',
            'manage_options',
            'omnix-chatbot-api',
            array($this, 'render_admin_page')
        );
    }

    public function register_settings(){
        register_setting('omnix_chatbot_api_options', self::OPTION_TOKEN_KEY);
        register_setting('omnix_chatbot_api_options', self::OPTION_SECRET_KEY);
        register_setting('omnix_chatbot_api_options', self::OPTION_WEBHOOK_SECRET);
        register_setting('omnix_chatbot_api_options', self::OPTION_API_URL);
        register_setting('omnix_chatbot_api_options', self::OPTION_BOT_ID);
        register_setting('omnix_chatbot_api_options', 'omnix_chatbot_auto_sync');
        register_setting('omnix_chatbot_api_options', 'omnix_chatbot_sync_enabled');
    }

    public function render_admin_page(){
        if (!current_user_can('manage_options')) wp_die('Access denied');

        $token = get_option(self::OPTION_TOKEN_KEY, '');
        $secret = get_option(self::OPTION_SECRET_KEY, '');
        $webhook_secret = get_option(self::OPTION_WEBHOOK_SECRET, '');
        $api_url = get_option(self::OPTION_API_URL, '');
        $bot_id = get_option(self::OPTION_BOT_ID, '');
        $auto_sync = get_option('omnix_chatbot_auto_sync', false);
        $sync_enabled = get_option('omnix_chatbot_sync_enabled', false);

        if (isset($_POST['save_settings']) && check_admin_referer('omnix_chatbot_api_save')) {
            update_option(self::OPTION_API_URL, sanitize_url($_POST['api_url']));
            update_option(self::OPTION_BOT_ID, sanitize_text_field($_POST['bot_id']));
            update_option('omnix_chatbot_auto_sync', isset($_POST['auto_sync']));
            update_option('omnix_chatbot_sync_enabled', isset($_POST['sync_enabled']));
            
            // Voice settings
            update_option('omnix_chatbot_voice_language', sanitize_text_field($_POST['voice_language']));
            update_option('omnix_chatbot_voice_rate', floatval($_POST['voice_rate']));
            update_option('omnix_chatbot_voice_pitch', floatval($_POST['voice_pitch']));
            update_option('omnix_chatbot_voice_volume', floatval($_POST['voice_volume']));
            update_option('omnix_chatbot_auto_speak', isset($_POST['auto_speak']));
            update_option('omnix_chatbot_voice_continuous', isset($_POST['voice_continuous']));
            update_option('omnix_chatbot_voice_interim_results', isset($_POST['voice_interim_results']));
            
            echo '<div class="updated"><p>Settings saved.</p></div>';
        }

        if (isset($_POST['regen_tokens']) && check_admin_referer('omnix_chatbot_api_regen')) {
            $token = 'ox_' . wp_generate_password(32, false, false);
            $secret = 'ox_sk_' . wp_generate_password(32, false, false);
            $webhook_secret = 'ox_wh_' . wp_generate_password(32, false, false);
            update_option(self::OPTION_TOKEN_KEY, $token);
            update_option(self::OPTION_SECRET_KEY, $secret);
            update_option(self::OPTION_WEBHOOK_SECRET, $webhook_secret);
            echo '<div class="updated"><p>Tokens regenerated.</p></div>';
        }
        ?>
        <div class="wrap">
            <h1>OmniX Chatbot API</h1>
            
            <div class="card" style="max-width: 800px;">
                <h2>API Configuration</h2>
                <form method="post">
                    <?php wp_nonce_field('omnix_chatbot_api_save'); ?>
                    <table class="form-table">
                        <tr>
                            <th scope="row">OmniX Platform URL</th>
                            <td>
                                <input type="url" name="api_url" value="<?php echo esc_attr($api_url); ?>" class="regular-text" placeholder="https://your-domain.com">
                                <p class="description">The URL of your OmniX chatbot platform</p>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">Bot ID</th>
                            <td>
                                <input type="text" name="bot_id" value="<?php echo esc_attr($bot_id); ?>" class="regular-text" placeholder="123">
                                <p class="description">The ID of your bot in the OmniX platform</p>
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
                        <tr>
                            <th scope="row">Sync Enabled</th>
                            <td>
                                <label>
                                    <input type="checkbox" name="sync_enabled" <?php checked($sync_enabled); ?>>
                                    Enable data sync with OmniX platform
                                </label>
                            </td>
                        </tr>
                    </table>
                    <p class="submit">
                        <input type="submit" name="save_settings" class="button button-primary" value="Save Settings">
                    </p>
                </form>
            </div>

            <div class="card" style="max-width: 800px;">
                <h2>Voice Settings</h2>
                <form method="post">
                    <?php wp_nonce_field('omnix_chatbot_api_save'); ?>
                    <table class="form-table">
                        <tr>
                            <th scope="row">Voice Language</th>
                            <td>
                                <select name="voice_language">
                                    <option value="en-US" <?php selected(get_option('omnix_chatbot_voice_language', 'en-US'), 'en-US'); ?>>English (US)</option>
                                    <option value="en-GB" <?php selected(get_option('omnix_chatbot_voice_language', 'en-US'), 'en-GB'); ?>>English (UK)</option>
                                    <option value="es-ES" <?php selected(get_option('omnix_chatbot_voice_language', 'en-US'), 'es-ES'); ?>>Spanish</option>
                                    <option value="fr-FR" <?php selected(get_option('omnix_chatbot_voice_language', 'en-US'), 'fr-FR'); ?>>French</option>
                                    <option value="de-DE" <?php selected(get_option('omnix_chatbot_voice_language', 'en-US'), 'de-DE'); ?>>German</option>
                                    <option value="it-IT" <?php selected(get_option('omnix_chatbot_voice_language', 'en-US'), 'it-IT'); ?>>Italian</option>
                                    <option value="pt-BR" <?php selected(get_option('omnix_chatbot_voice_language', 'en-US'), 'pt-BR'); ?>>Portuguese (Brazil)</option>
                                    <option value="ru-RU" <?php selected(get_option('omnix_chatbot_voice_language', 'en-US'), 'ru-RU'); ?>>Russian</option>
                                    <option value="ja-JP" <?php selected(get_option('omnix_chatbot_voice_language', 'en-US'), 'ja-JP'); ?>>Japanese</option>
                                    <option value="ko-KR" <?php selected(get_option('omnix_chatbot_voice_language', 'en-US'), 'ko-KR'); ?>>Korean</option>
                                    <option value="zh-CN" <?php selected(get_option('omnix_chatbot_voice_language', 'en-US'), 'zh-CN'); ?>>Chinese (Simplified)</option>
                                </select>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">Voice Rate</th>
                            <td>
                                <input type="range" name="voice_rate" min="0.1" max="2.0" step="0.1" 
                                       value="<?php echo esc_attr(get_option('omnix_chatbot_voice_rate', '1.0')); ?>" 
                                       oninput="document.getElementById('voice_rate_value').textContent = this.value">
                                <span id="voice_rate_value"><?php echo esc_html(get_option('omnix_chatbot_voice_rate', '1.0')); ?></span>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">Voice Pitch</th>
                            <td>
                                <input type="range" name="voice_pitch" min="0.1" max="2.0" step="0.1" 
                                       value="<?php echo esc_attr(get_option('omnix_chatbot_voice_pitch', '1.0')); ?>" 
                                       oninput="document.getElementById('voice_pitch_value').textContent = this.value">
                                <span id="voice_pitch_value"><?php echo esc_html(get_option('omnix_chatbot_voice_pitch', '1.0')); ?></span>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">Voice Volume</th>
                            <td>
                                <input type="range" name="voice_volume" min="0.1" max="1.0" step="0.1" 
                                       value="<?php echo esc_attr(get_option('omnix_chatbot_voice_volume', '1.0')); ?>" 
                                       oninput="document.getElementById('voice_volume_value').textContent = this.value">
                                <span id="voice_volume_value"><?php echo esc_html(get_option('omnix_chatbot_voice_volume', '1.0')); ?></span>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">Auto Speak</th>
                            <td>
                                <label>
                                    <input type="checkbox" name="auto_speak" <?php checked(get_option('omnix_chatbot_auto_speak', false)); ?>>
                                    Automatically speak bot responses
                                </label>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">Continuous Recognition</th>
                            <td>
                                <label>
                                    <input type="checkbox" name="voice_continuous" <?php checked(get_option('omnix_chatbot_voice_continuous', false)); ?>>
                                    Enable continuous speech recognition
                                </label>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">Interim Results</th>
                            <td>
                                <label>
                                    <input type="checkbox" name="voice_interim_results" <?php checked(get_option('omnix_chatbot_voice_interim_results', false)); ?>>
                                    Show interim speech recognition results
                                </label>
                            </td>
                        </tr>
                    </table>
                    <p class="submit">
                        <input type="submit" name="save_settings" class="button button-primary" value="Save Voice Settings">
                    </p>
                </form>
            </div>

            <div class="card" style="max-width: 800px;">
                <h2>API Credentials</h2>
                <p><strong>Access Token:</strong></p>
                <pre style="background:#fff;border:1px solid #ddd;padding:10px;word-break:break-all;"><?php echo esc_html($token); ?></pre>
                
                <p><strong>Secret Key:</strong></p>
                <pre style="background:#fff;border:1px solid #ddd;padding:10px;word-break:break-all;"><?php echo esc_html($secret); ?></pre>
                
                <p><strong>Webhook Secret:</strong></p>
                <pre style="background:#fff;border:1px solid #ddd;padding:10px;word-break:break-all;"><?php echo esc_html($webhook_secret); ?></pre>

                <form method="post" style="margin-top: 20px;">
                    <?php wp_nonce_field('omnix_chatbot_api_regen'); ?>
                    <input type="submit" name="regen_tokens" class="button button-secondary" value="Regenerate Tokens" onclick="return confirm('Are you sure? This will invalidate existing tokens.');">
                </form>
            </div>

            <div class="card" style="max-width: 800px;">
                <h2>API Endpoints</h2>
                <p>Use these endpoints with your access token:</p>
                <ul>
                    <li><code>GET /wp-json/<?php echo self::ROUTE_NAMESPACE; ?>/info</code> - Site information</li>
                    <li><code>POST /wp-json/<?php echo self::ROUTE_NAMESPACE; ?>/search</code> - Search content</li>
                    <li><code>GET /wp-json/<?php echo self::ROUTE_NAMESPACE; ?>/export/posts</code> - Export posts</li>
                    <li><code>GET /wp-json/<?php echo self::ROUTE_NAMESPACE; ?>/export/pages</code> - Export pages</li>
                    <li><code>GET /wp-json/<?php echo self::ROUTE_NAMESPACE; ?>/export/categories</code> - Export categories</li>
                    <li><code>GET /wp-json/<?php echo self::ROUTE_NAMESPACE; ?>/export/tags</code> - Export tags</li>
                    <li><code>POST /wp-json/<?php echo self::ROUTE_NAMESPACE; ?>/export/full</code> - Export all content</li>
                </ul>
            </div>

            <div class="card" style="max-width: 800px;">
                <h2>Manual Sync</h2>
                <button id="manual-sync" class="button button-primary">Trigger Manual Sync</button>
                <div id="sync-status" style="margin-top: 10px;"></div>
            </div>
        </div>

        <script>
        document.getElementById('manual-sync').addEventListener('click', function() {
            const button = this;
            const status = document.getElementById('sync-status');
            
            button.disabled = true;
            button.textContent = 'Syncing...';
            status.innerHTML = '<p>Syncing content to OmniX platform...</p>';
            
            fetch(ajaxurl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: 'action=omnix_manual_sync&nonce=<?php echo wp_create_nonce('omnix_manual_sync'); ?>'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    status.innerHTML = '<p style="color: green;">✓ Sync completed successfully!</p>';
                } else {
                    status.innerHTML = '<p style="color: red;">✗ Sync failed: ' + (data.data || 'Unknown error') + '</p>';
                }
            })
            .catch(error => {
                status.innerHTML = '<p style="color: red;">✗ Sync failed: ' + error.message + '</p>';
            })
            .finally(() => {
                button.disabled = false;
                button.textContent = 'Trigger Manual Sync';
            });
        });
        </script>
        <?php
    }

    // Chatbot shortcode handler
    public function chatbot_shortcode($atts) {
        $atts = shortcode_atts(array(
            'bot_id' => get_option(self::OPTION_BOT_ID, ''),
            'access_token' => get_option(self::OPTION_TOKEN_KEY, ''),
            'theme' => 'default',
            'position' => 'bottom-right',
            'auto_open' => 'false',
            'show_avatar' => 'true',
            'show_title' => 'true',
            'enable_voice' => 'true',
            'voice_language' => get_option('omnix_chatbot_voice_language', 'en-US'),
            'auto_speak' => get_option('omnix_chatbot_auto_speak', 'false'),
            'voice_rate' => get_option('omnix_chatbot_voice_rate', '1.0'),
            'voice_pitch' => get_option('omnix_chatbot_voice_pitch', '1.0'),
            'voice_volume' => get_option('omnix_chatbot_voice_volume', '1.0'),
            'voice_continuous' => get_option('omnix_chatbot_voice_continuous', 'false'),
            'voice_interim_results' => get_option('omnix_chatbot_voice_interim_results', 'false')
        ), $atts);

        // Debug logging
        error_log('OmniX Chatbot Shortcode - Bot ID: ' . $atts['bot_id']);
        error_log('OmniX Chatbot Shortcode - Enable Voice: ' . $atts['enable_voice']);
        error_log('OmniX Chatbot Shortcode - Voice Language: ' . $atts['voice_language']);

        if (empty($atts['bot_id']) || empty($atts['access_token'])) {
            return '<p>OmniX Chatbot: Please configure bot_id and access_token.</p>';
        }

        $api_url = get_option(self::OPTION_API_URL, '');
        if (empty($api_url)) {
            return '<p>OmniX Chatbot: Please configure API URL in settings.</p>';
        }

        $widget_id = 'omnix-chatbot-' . uniqid();
        
        $widget_html = '
        <div id="' . esc_attr($widget_id) . '" class="omnix-chatbot-widget" 
             data-bot-id="' . esc_attr($atts['bot_id']) . '"
             data-access-token="' . esc_attr($atts['access_token']) . '"
             data-api-url="' . esc_attr($api_url) . '"
             data-theme="' . esc_attr($atts['theme']) . '"
             data-position="' . esc_attr($atts['position']) . '"
             data-auto-open="' . esc_attr($atts['auto_open']) . '"
             data-show-avatar="' . esc_attr($atts['show_avatar']) . '"
             data-show-title="' . esc_attr($atts['show_title']) . '"
             data-enable-voice="' . esc_attr($atts['enable_voice']) . '"
             data-voice-language="' . esc_attr($atts['voice_language']) . '"
             data-auto-speak="' . esc_attr($atts['auto_speak']) . '"
             data-voice-rate="' . esc_attr($atts['voice_rate']) . '"
             data-voice-pitch="' . esc_attr($atts['voice_pitch']) . '"
             data-voice-volume="' . esc_attr($atts['voice_volume']) . '"
             data-voice-continuous="' . esc_attr($atts['voice_continuous']) . '"
             data-voice-interim-results="' . esc_attr($atts['voice_interim_results']) . '">
        </div>';

        // Debug logging
        error_log('OmniX Chatbot Widget HTML: ' . $widget_html);
        
        return $widget_html;
    }

    // Debug shortcode handler - forces voice to be enabled
    public function chatbot_debug_shortcode($atts) {
        $atts = shortcode_atts(array(
            'bot_id' => '7',
            'access_token' => 'debug_token',
            'theme' => 'default',
            'position' => 'bottom-right',
            'auto_open' => 'false',
            'show_avatar' => 'true',
            'show_title' => 'true',
            'enable_voice' => 'true',
            'voice_language' => 'en-US',
            'auto_speak' => 'false',
            'voice_rate' => '1.0',
            'voice_pitch' => '1.0',
            'voice_volume' => '1.0',
            'voice_continuous' => 'false',
            'voice_interim_results' => 'false'
        ), $atts);

        $api_url = get_option(self::OPTION_API_URL, 'https://your-api-url.com');
        $widget_id = 'omnix-chatbot-debug-' . uniqid();
        
        $widget_html = '
        <div id="' . esc_attr($widget_id) . '" class="omnix-chatbot-widget" 
             data-bot-id="' . esc_attr($atts['bot_id']) . '"
             data-access-token="' . esc_attr($atts['access_token']) . '"
             data-api-url="' . esc_attr($api_url) . '"
             data-theme="' . esc_attr($atts['theme']) . '"
             data-position="' . esc_attr($atts['position']) . '"
             data-auto-open="' . esc_attr($atts['auto_open']) . '"
             data-show-avatar="' . esc_attr($atts['show_avatar']) . '"
             data-show-title="' . esc_attr($atts['show_title']) . '"
             data-enable-voice="' . esc_attr($atts['enable_voice']) . '"
             data-voice-language="' . esc_attr($atts['voice_language']) . '"
             data-auto-speak="' . esc_attr($atts['auto_speak']) . '"
             data-voice-rate="' . esc_attr($atts['voice_rate']) . '"
             data-voice-pitch="' . esc_attr($atts['voice_pitch']) . '"
             data-voice-volume="' . esc_attr($atts['voice_volume']) . '"
             data-voice-continuous="' . esc_attr($atts['voice_continuous']) . '"
             data-voice-interim-results="' . esc_attr($atts['voice_interim_results']) . '">
        </div>';

        return $widget_html;
    }

    // Enqueue chatbot assets
    public function enqueue_chatbot_assets() {
        if (is_admin()) return;
        
        // Enqueue chatbot widget script
        wp_enqueue_script(
            'omnix-chatbot-widget',
            plugin_dir_url(__FILE__) . 'assets/chatbot-widget.js',
            array('jquery'),
            '1.0.0',
            true
        );
        
        // Enqueue chatbot styles
        wp_enqueue_style(
            'omnix-chatbot-styles',
            plugin_dir_url(__FILE__) . 'assets/chatbot-styles.css',
            array(),
            '1.0.0'
        );
        
        // Localize script with API URL
        wp_localize_script('omnix-chatbot-widget', 'omnixChatbot', array(
            'apiUrl' => get_option(self::OPTION_API_URL, ''),
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('omnix_chatbot_nonce')
        ));
    }

    // Handle chat requests with conversation context
    public function handle_chat_request() {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'], 'omnix_chatbot_nonce')) {
            wp_die('Security check failed');
        }

        $message = sanitize_text_field($_POST['message']);
        $conversation_id = intval($_POST['conversation_id']);
        $bot_id = sanitize_text_field($_POST['bot_id']);
        $access_token = sanitize_text_field($_POST['access_token']);

        if (empty($message) || empty($bot_id) || empty($access_token)) {
            wp_send_json_error('Missing required parameters');
        }

        // Get conversation history for context
        $conversation_history = $this->get_conversation_history($conversation_id);
        
        // Prepare request to your chatbot API
        $api_url = get_option(self::OPTION_API_URL, '');
        $request_data = array(
            'message' => $message,
            'bot_id' => $bot_id,
            'conversation_id' => $conversation_id,
            'conversation_history' => $conversation_history,
            'access_token' => $access_token
        );

        $response = wp_remote_post($api_url . '/api/chat', array(
            'headers' => array(
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . $access_token
            ),
            'body' => json_encode($request_data),
            'timeout' => 30
        ));

        if (is_wp_error($response)) {
            wp_send_json_error('Failed to connect to chatbot API');
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if (!$data || isset($data['error'])) {
            wp_send_json_error('Chatbot API error: ' . ($data['error'] ?? 'Unknown error'));
        }

        // Store the conversation
        $this->store_conversation($conversation_id, $message, $data['response'] ?? 'No response');

        wp_send_json_success($data);
    }

    // Get conversation history for context
    private function get_conversation_history($conversation_id) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'omnix_chatbot_conversations';
        
        // Create table if it doesn't exist
        $this->create_conversations_table();
        
        $results = $wpdb->get_results($wpdb->prepare(
            "SELECT user_message, bot_response, created_at 
             FROM $table_name 
             WHERE conversation_id = %d 
             ORDER BY created_at DESC 
             LIMIT 10",
            $conversation_id
        ));

        $history = array();
        foreach ($results as $row) {
            $history[] = array(
                'user' => $row->user_message,
                'bot' => $row->bot_response,
                'timestamp' => $row->created_at
            );
        }

        return array_reverse($history); // Return in chronological order
    }

    // Store conversation in database
    private function store_conversation($conversation_id, $user_message, $bot_response) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'omnix_chatbot_conversations';
        
        $wpdb->insert(
            $table_name,
            array(
                'conversation_id' => $conversation_id,
                'user_message' => $user_message,
                'bot_response' => $bot_response,
                'created_at' => current_time('mysql')
            ),
            array('%d', '%s', '%s', '%s')
        );
    }

    // Create conversations table
    private function create_conversations_table() {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'omnix_chatbot_conversations';
        
        $charset_collate = $wpdb->get_charset_collate();
        
        $sql = "CREATE TABLE IF NOT EXISTS $table_name (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            conversation_id bigint(20) NOT NULL,
            user_message text NOT NULL,
            bot_response text NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY conversation_id (conversation_id)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }
}

new OmniX_Chatbot_API();
