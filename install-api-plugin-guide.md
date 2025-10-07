# Install OmniX Chatbot API Plugin

## 🔧 The Issue:
Your WordPress site is missing the **OmniX Chatbot API** plugin that provides the REST API endpoints.

## ✅ Solution: Install the API Plugin

### Step 1: Download the API Plugin
1. Go to: `wordpress-plugin/omnix-chatbot-api/`
2. Download the entire `omnix-chatbot-api` folder
3. Zip it as `omnix-chatbot-api.zip`

### Step 2: Upload to WordPress
1. Go to **WordPress Admin → Plugins → Add New**
2. Click **"Upload Plugin"**
3. Choose the `omnix-chatbot-api.zip` file
4. Click **"Install Now"**
5. Click **"Activate Plugin"**

### Step 3: Configure the API Plugin
1. Go to **Settings → OmniX Chatbot API**
2. Set **OmniX Platform URL**: `https://3a929207c562.ngrok-free.app`
3. Set **Bot ID**: `48`
4. Enable **Auto Sync** and **Sync Enabled**
5. Click **"Save Settings"**

### Step 4: Test the API
After installation, these endpoints should work:
- `https://mgsbuilders.co.in/wp-json/omnix-chatbot/v1/chat`
- `https://mgsbuilders.co.in/wp-json/omnix-chatbot/v1/info`
- `https://mgsbuilders.co.in/wp-json/omnix-chatbot/v1/bots`

### Step 5: Use Simple Script Tag
Once the API plugin is installed, you can use:

```html
<script src="https://mgsbuilders.co.in/wp-content/plugins/omnix-chatbot/assets/chatbot-widget.js" 
        data-bot-id="48"
        data-access-token="ox_38fb3bbfe78960c623bd50a4879e267f722d94d126b12357cbc609ed5cda1e1a">
</script>
```

## 🎯 Alternative: Use Direct API (No Plugin Needed)

If you don't want to install the API plugin, use this instead:

```html
<script>
window.omnixChatbot = {
    apiUrl: "https://3a929207c562.ngrok-free.app",
    botId: "48",
    accessToken: "ox_38fb3bbfe78960c623bd50a4879e267f722d94d126b12357cbc609ed5cda1e1a"
};
</script>
<script src="https://mgsbuilders.co.in/wp-content/plugins/omnix-chatbot/assets/chatbot-widget.js"></script>
```

## 📝 Files You Need:
- `wordpress-plugin/omnix-chatbot-api/omnix-chatbot-api.php` (Main plugin file)
- `wordpress-plugin/omnix-chatbot-api/install.php` (Installation helper)
- `wordpress-plugin/omnix-chatbot-api/test-api.php` (Testing script)

