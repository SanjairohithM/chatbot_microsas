<?php
/**
 * OmniX Chatbot API - Test Script
 * 
 * This script tests the API endpoints to ensure they're working correctly
 * Run this script after installation to verify everything is set up properly
 */

// Configuration
$site_url = 'https://your-wordpress-site.com'; // Change this to your WordPress site URL
$access_token = 'ox_your_access_token_here'; // Change this to your access token

// Test endpoints
$endpoints = [
    'info' => [
        'method' => 'GET',
        'url' => $site_url . '/wp-json/omnix-chatbot/v1/info',
        'data' => null
    ],
    'search' => [
        'method' => 'POST',
        'url' => $site_url . '/wp-json/omnix-chatbot/v1/search',
        'data' => [
            'query' => 'WordPress',
            'post_types' => ['post'],
            'limit' => 5
        ]
    ],
    'export_posts' => [
        'method' => 'GET',
        'url' => $site_url . '/wp-json/omnix-chatbot/v1/export/posts?limit=5',
        'data' => null
    ],
    'export_categories' => [
        'method' => 'GET',
        'url' => $site_url . '/wp-json/omnix-chatbot/v1/export/categories',
        'data' => null
    ]
];

// Function to make API request
function make_api_request($url, $method = 'GET', $data = null, $token = null) {
    $headers = [
        'Content-Type: application/json',
        'User-Agent: OmniX-Chatbot-API-Test/1.0'
    ];
    
    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }
    
    $options = [
        'http' => [
            'method' => $method,
            'header' => implode("\r\n", $headers),
            'timeout' => 30
        ]
    ];
    
    if ($data && in_array($method, ['POST', 'PUT', 'PATCH'])) {
        $options['http']['content'] = json_encode($data);
    }
    
    $context = stream_context_create($options);
    $result = file_get_contents($url, false, $context);
    
    if ($result === false) {
        return [
            'success' => false,
            'error' => 'Failed to make request',
            'http_code' => 0
        ];
    }
    
    $http_code = 0;
    if (isset($http_response_header)) {
        foreach ($http_response_header as $header) {
            if (preg_match('/HTTP\/\d\.\d\s+(\d+)/', $header, $matches)) {
                $http_code = intval($matches[1]);
                break;
            }
        }
    }
    
    return [
        'success' => $http_code >= 200 && $http_code < 300,
        'data' => json_decode($result, true),
        'http_code' => $http_code,
        'raw_response' => $result
    ];
}

// Test function
function run_tests($endpoints, $token) {
    echo "<h1>🧪 OmniX Chatbot API - Test Results</h1>\n";
    echo "<style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f1f1f1; }
        .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 1000px; margin: 0 auto; }
        .test { margin: 20px 0; padding: 15px; border-radius: 4px; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
        .info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; }
        .code { background: #f8f9fa; border: 1px solid #e9ecef; padding: 15px; border-radius: 4px; font-family: monospace; margin: 10px 0; overflow-x: auto; }
        .endpoint { font-weight: bold; color: #0073aa; }
        .status { font-weight: bold; }
        .response { max-height: 300px; overflow-y: auto; }
    </style>\n";
    
    echo "<div class='container'>\n";
    
    $total_tests = count($endpoints);
    $passed_tests = 0;
    
    foreach ($endpoints as $name => $endpoint) {
        echo "<div class='test'>\n";
        echo "<h3>🔍 Testing: " . ucfirst(str_replace('_', ' ', $name)) . "</h3>\n";
        echo "<div class='endpoint'>{$endpoint['method']} {$endpoint['url']}</div>\n";
        
        if ($endpoint['data']) {
            echo "<div class='code'>Request Data: " . json_encode($endpoint['data'], JSON_PRETTY_PRINT) . "</div>\n";
        }
        
        $result = make_api_request($endpoint['url'], $endpoint['method'], $endpoint['data'], $token);
        
        if ($result['success']) {
            echo "<div class='status' style='color: green;'>✅ PASSED</div>\n";
            echo "<div class='info'>HTTP Status: {$result['http_code']}</div>\n";
            $passed_tests++;
        } else {
            echo "<div class='status' style='color: red;'>❌ FAILED</div>\n";
            echo "<div class='error'>HTTP Status: {$result['http_code']}</div>\n";
            if (isset($result['error'])) {
                echo "<div class='error'>Error: {$result['error']}</div>\n";
            }
        }
        
        if ($result['data']) {
            echo "<div class='code response'>Response: " . json_encode($result['data'], JSON_PRETTY_PRINT) . "</div>\n";
        } else {
            echo "<div class='code response'>Raw Response: " . htmlspecialchars($result['raw_response']) . "</div>\n";
        }
        
        echo "</div>\n";
    }
    
    // Summary
    echo "<div class='test'>\n";
    echo "<h2>📊 Test Summary</h2>\n";
    echo "<div class='info'>\n";
    echo "Total Tests: {$total_tests}<br>\n";
    echo "Passed: {$passed_tests}<br>\n";
    echo "Failed: " . ($total_tests - $passed_tests) . "<br>\n";
    echo "Success Rate: " . round(($passed_tests / $total_tests) * 100, 2) . "%\n";
    echo "</div>\n";
    
    if ($passed_tests === $total_tests) {
        echo "<div class='success'>🎉 All tests passed! Your OmniX Chatbot API is working correctly.</div>\n";
    } else {
        echo "<div class='error'>⚠️ Some tests failed. Please check the configuration and try again.</div>\n";
    }
    
    echo "</div>\n";
    echo "</div>\n";
}

// Check if running from command line or web
if (php_sapi_name() === 'cli') {
    // Command line usage
    echo "OmniX Chatbot API Test Script\n";
    echo "=============================\n\n";
    echo "Usage: php test-api.php\n";
    echo "Make sure to update the configuration variables at the top of this file.\n\n";
    
    if ($site_url === 'https://your-wordpress-site.com' || $access_token === 'ox_your_access_token_here') {
        echo "ERROR: Please update the configuration variables before running the test.\n";
        echo "Edit this file and change:\n";
        echo "- \$site_url to your WordPress site URL\n";
        echo "- \$access_token to your access token\n";
        exit(1);
    }
    
    run_tests($endpoints, $access_token);
} else {
    // Web usage
    if ($site_url === 'https://your-wordpress-site.com' || $access_token === 'ox_your_access_token_here') {
        echo "<div class='container'>";
        echo "<h1>⚠️ Configuration Required</h1>";
        echo "<div class='error'>";
        echo "Please update the configuration variables at the top of this file:<br>";
        echo "1. Change \$site_url to your WordPress site URL<br>";
        echo "2. Change \$access_token to your access token<br>";
        echo "3. Refresh this page to run the tests";
        echo "</div>";
        echo "</div>";
    } else {
        run_tests($endpoints, $access_token);
    }
}
?>
