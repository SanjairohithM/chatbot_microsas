<?php
/**
 * OmniX Chatbot API - Download Package
 * 
 * This script creates a downloadable zip package of the complete plugin
 * Run this script to download the entire plugin package
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

// Create zip file
function create_plugin_zip() {
    $plugin_dir = plugin_dir_path(__FILE__);
    $zip_file = $plugin_dir . 'omnix-chatbot-api.zip';
    
    // Remove existing zip if it exists
    if (file_exists($zip_file)) {
        unlink($zip_file);
    }
    
    // Create new zip
    $zip = new ZipArchive();
    if ($zip->open($zip_file, ZipArchive::CREATE) !== TRUE) {
        die("Cannot create zip file");
    }
    
    // Add files to zip
    $files_to_zip = [
        'omnix-chatbot-api.php',
        'install.php',
        'test-api.php',
        'README.md',
        'INTEGRATION_GUIDE.md',
        'INSTALLATION_GUIDE.md'
    ];
    
    foreach ($files_to_zip as $file) {
        if (file_exists($plugin_dir . $file)) {
            $zip->addFile($plugin_dir . $file, $file);
        }
    }
    
    $zip->close();
    
    return $zip_file;
}

// Handle download request
if (isset($_GET['download']) && $_GET['download'] === 'zip') {
    $zip_file = create_plugin_zip();
    
    if (file_exists($zip_file)) {
        header('Content-Type: application/zip');
        header('Content-Disposition: attachment; filename="omnix-chatbot-api.zip"');
        header('Content-Length: ' . filesize($zip_file));
        readfile($zip_file);
        unlink($zip_file); // Delete zip after download
        exit;
    } else {
        die('Failed to create zip file');
    }
}

?>
<!DOCTYPE html>
<html>
<head>
    <title>OmniX Chatbot API - Download Package</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f1f1f1; }
        .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 800px; margin: 0 auto; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .button { background: #0073aa; color: white; padding: 15px 30px; border: none; border-radius: 4px; cursor: pointer; text-decoration: none; display: inline-block; font-size: 16px; margin: 10px 5px; }
        .button:hover { background: #005a87; }
        .button.secondary { background: #6c757d; }
        .button.secondary:hover { background: #545b62; }
        h1 { color: #333; border-bottom: 2px solid #0073aa; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        .file-list { background: #f8f9fa; border: 1px solid #e9ecef; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .file-list ul { margin: 0; padding-left: 20px; }
        .file-list li { margin: 5px 0; }
        .step { background: #e7f3ff; border-left: 4px solid #0073aa; padding: 15px; margin: 15px 0; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 4px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📦 OmniX Chatbot API - Download Package</h1>
        
        <div class="info">
            <strong>Complete Plugin Package</strong><br>
            Download the entire OmniX Chatbot API plugin package including all files, documentation, and installation tools.
        </div>
        
        <h2>📁 Package Contents</h2>
        <div class="file-list">
            <ul>
                <li><strong>omnix-chatbot-api.php</strong> - Main plugin file with all API endpoints</li>
                <li><strong>install.php</strong> - Installation wizard for easy setup</li>
                <li><strong>test-api.php</strong> - API testing tool to verify functionality</li>
                <li><strong>README.md</strong> - Complete plugin documentation</li>
                <li><strong>INTEGRATION_GUIDE.md</strong> - Developer integration examples</li>
                <li><strong>INSTALLATION_GUIDE.md</strong> - Step-by-step installation guide</li>
            </ul>
        </div>
        
        <h2>🚀 Quick Installation</h2>
        <div class="step">
            <strong>Step 1:</strong> Download the zip package below<br>
            <strong>Step 2:</strong> Upload to WordPress → Plugins → Add New → Upload Plugin<br>
            <strong>Step 3:</strong> Activate the plugin<br>
            <strong>Step 4:</strong> Go to Settings → OmniX Chatbot API to configure<br>
            <strong>Step 5:</strong> Copy the generated API credentials to your OmniX platform
        </div>
        
        <h2>🔧 Features Included</h2>
        <div class="info">
            ✅ <strong>Secure API Endpoints</strong> - Search, export, and sync WordPress content<br>
            ✅ <strong>Automatic Authentication</strong> - Bearer token with rate limiting<br>
            ✅ <strong>Real-time Sync</strong> - Automatic content synchronization<br>
            ✅ <strong>Admin Interface</strong> - Easy configuration and management<br>
            ✅ <strong>Complete Documentation</strong> - Guides and examples included<br>
            ✅ <strong>Testing Tools</strong> - Verify everything works correctly<br>
            ✅ <strong>Webhook Support</strong> - Integration with OmniX platform
        </div>
        
        <h2>📥 Download Options</h2>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="?download=zip" class="button">📦 Download Complete Package (ZIP)</a>
        </div>
        
        <div class="warning">
            <strong>⚠️ Important:</strong> After downloading, upload the zip file to your WordPress site via Plugins → Add New → Upload Plugin. Do not extract the files manually.
        </div>
        
        <h2>📋 Installation Checklist</h2>
        <div class="file-list">
            <ul>
                <li>✅ WordPress 5.0 or higher</li>
                <li>✅ PHP 7.4 or higher</li>
                <li>✅ Admin access to WordPress</li>
                <li>✅ OmniX platform URL and Bot ID</li>
                <li>✅ File upload permissions</li>
            </ul>
        </div>
        
        <h2>🔗 Alternative Installation Methods</h2>
        
        <div class="step">
            <strong>Method 1: WordPress Admin Upload (Recommended)</strong><br>
            1. Download the zip package<br>
            2. Go to Plugins → Add New → Upload Plugin<br>
            3. Choose the zip file and install<br>
            4. Activate the plugin
        </div>
        
        <div class="step">
            <strong>Method 2: Manual Upload</strong><br>
            1. Download and extract the zip package<br>
            2. Upload the folder to wp-content/plugins/<br>
            3. Activate the plugin in WordPress admin
        </div>
        
        <div class="step">
            <strong>Method 3: FTP Upload</strong><br>
            1. Download and extract the zip package<br>
            2. Upload via FTP to wp-content/plugins/<br>
            3. Activate the plugin in WordPress admin
        </div>
        
        <h2>🆘 Need Help?</h2>
        <div class="info">
            <strong>Support Resources:</strong><br>
            • Check the INSTALLATION_GUIDE.md for detailed steps<br>
            • Use the test-api.php script to verify functionality<br>
            • Review WordPress error logs for troubleshooting<br>
            • Ensure all file permissions are correct
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="?download=zip" class="button">📦 Download Now</a>
            <a href="<?php echo admin_url('options-general.php?page=omnix-chatbot-api'); ?>" class="button secondary">⚙️ Plugin Settings</a>
        </div>
    </div>
</body>
</html>
