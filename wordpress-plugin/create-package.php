<?php
/**
 * OmniX Chatbot WordPress Plugin Package Creator
 * Creates a complete WordPress plugin package for distribution
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    // If not in WordPress, define ABSPATH for standalone execution
    if (!defined('ABSPATH')) {
        define('ABSPATH', dirname(__FILE__) . '/');
    }
}

class OmniXPluginPackager {
    
    private $plugin_dir;
    private $package_dir;
    private $version;
    
    public function __construct() {
        $this->plugin_dir = dirname(__FILE__);
        $this->package_dir = $this->plugin_dir . '/package';
        $this->version = '1.0.0';
    }
    
    public function createPackage() {
        echo "Creating OmniX Chatbot WordPress Plugin Package...\n";
        
        // Create package directory
        $this->createPackageDirectory();
        
        // Copy plugin files
        $this->copyPluginFiles();
        
        // Create ZIP package
        $this->createZipPackage();
        
        // Clean up
        $this->cleanup();
        
        echo "Package created successfully!\n";
        echo "Download: " . $this->package_dir . ".zip\n";
    }
    
    private function createPackageDirectory() {
        if (is_dir($this->package_dir)) {
            $this->removeDirectory($this->package_dir);
        }
        mkdir($this->package_dir, 0755, true);
        echo "Created package directory: " . $this->package_dir . "\n";
    }
    
    private function copyPluginFiles() {
        $files_to_copy = [
            'omnix-chatbot-plugin.php' => 'omnix-chatbot-plugin.php',
            'admin/dashboard.php' => 'admin/dashboard.php',
            'admin/tokens.php' => 'admin/tokens.php',
            'admin/settings.php' => 'admin/settings.php',
            'admin/logs.php' => 'admin/logs.php',
            'assets/chatbot-widget.js' => 'assets/chatbot-widget.js',
            'assets/chatbot-widget.css' => 'assets/chatbot-widget.css',
            'README.md' => 'README.md',
            'INSTALLATION_INSTRUCTIONS.md' => 'INSTALLATION_INSTRUCTIONS.md'
        ];
        
        foreach ($files_to_copy as $source => $dest) {
            $source_path = $this->plugin_dir . '/' . $source;
            $dest_path = $this->package_dir . '/' . $dest;
            
            if (file_exists($source_path)) {
                // Create destination directory if needed
                $dest_dir = dirname($dest_path);
                if (!is_dir($dest_dir)) {
                    mkdir($dest_dir, 0755, true);
                }
                
                if (copy($source_path, $dest_path)) {
                    echo "Copied: " . $source . " -> " . $dest . "\n";
                } else {
                    echo "Failed to copy: " . $source . "\n";
                }
            } else {
                echo "Source file not found: " . $source . "\n";
            }
        }
        
        // Create additional required files
        $this->createAdditionalFiles();
    }
    
    private function createAdditionalFiles() {
        // Create uninstall.php
        $uninstall_content = '<?php
/**
 * Uninstall script for OmniX Chatbot Plugin
 */

// Prevent direct access
if (!defined(\'WP_UNINSTALL_PLUGIN\')) {
    exit;
}

// Remove database tables
global $wpdb;

$tables = [
    $wpdb->prefix . \'omnix_chatbot_tokens\',
    $wpdb->prefix . \'omnix_chatbot_logs\'
];

foreach ($tables as $table) {
    $wpdb->query("DROP TABLE IF EXISTS $table");
}

// Remove options
$options = [
    \'omnix_chatbot_api_url\',
    \'omnix_chatbot_api_key\',
    \'omnix_chatbot_default_permissions\',
    \'omnix_chatbot_token_expiry_days\',
    \'omnix_chatbot_enable_logging\',
    \'omnix_chatbot_max_requests_per_hour\'
];

foreach ($options as $option) {
    delete_option($option);
}
?>';
        
        file_put_contents($this->package_dir . '/uninstall.php', $uninstall_content);
        echo "Created: uninstall.php\n";
        
        // Create index.php for security
        $index_content = '<?php
// Silence is golden.
?>';
        
        $directories = ['admin', 'assets'];
        foreach ($directories as $dir) {
            file_put_contents($this->package_dir . '/' . $dir . '/index.php', $index_content);
        }
        file_put_contents($this->package_dir . '/index.php', $index_content);
        echo "Created: index.php files\n";
        
        // Create plugin header file
        $header_content = '<?php
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
if (!defined(\'ABSPATH\')) {
    exit;
}

// Load the main plugin file
require_once plugin_dir_path(__FILE__) . \'omnix-chatbot-plugin.php\';
?>';
        
        file_put_contents($this->package_dir . '/omnix-chatbot.php', $header_content);
        echo "Created: omnix-chatbot.php\n";
    }
    
    private function createZipPackage() {
        $zip_file = $this->package_dir . '.zip';
        
        if (file_exists($zip_file)) {
            unlink($zip_file);
        }
        
        $zip = new ZipArchive();
        if ($zip->open($zip_file, ZipArchive::CREATE) === TRUE) {
            $this->addDirectoryToZip($zip, $this->package_dir, 'omnix-chatbot');
            $zip->close();
            echo "Created ZIP package: " . $zip_file . "\n";
        } else {
            echo "Failed to create ZIP package\n";
        }
    }
    
    private function addDirectoryToZip($zip, $dir, $zip_dir = '') {
        $files = scandir($dir);
        
        foreach ($files as $file) {
            if ($file == '.' || $file == '..') {
                continue;
            }
            
            $file_path = $dir . '/' . $file;
            $zip_path = $zip_dir . '/' . $file;
            
            if (is_dir($file_path)) {
                $zip->addEmptyDir($zip_path);
                $this->addDirectoryToZip($zip, $file_path, $zip_path);
            } else {
                $zip->addFile($file_path, $zip_path);
            }
        }
    }
    
    private function cleanup() {
        $this->removeDirectory($this->package_dir);
        echo "Cleaned up temporary files\n";
    }
    
    private function removeDirectory($dir) {
        if (!is_dir($dir)) {
            return;
        }
        
        $files = array_diff(scandir($dir), array('.', '..'));
        foreach ($files as $file) {
            $path = $dir . '/' . $file;
            if (is_dir($path)) {
                $this->removeDirectory($path);
            } else {
                unlink($path);
            }
        }
        rmdir($dir);
    }
}

// Run the packager if called directly
if (basename(__FILE__) == basename($_SERVER['SCRIPT_NAME'])) {
    $packager = new OmniXPluginPackager();
    $packager->createPackage();
}
?>