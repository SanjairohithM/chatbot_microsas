# Chatbot Widget Export Guide

This guide explains how to export your chatbots as embeddable widgets that can be used on external websites, similar to services like AppSumo or Microsoft Chatbot Services.

## Features

- **Multiple Export Formats**: JavaScript widget, iframe embed, and React component
- **Customizable Appearance**: Colors, position, size, and branding options
- **Easy Integration**: Simple script tags or programmatic initialization
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Chat**: Full conversation functionality with your trained bots

## How to Export a Bot

1. **Navigate to your Dashboard**: Go to your chatbot dashboard
2. **Find your Bot**: Locate the bot you want to export
3. **Click Export Widget**: Use the dropdown menu on the bot card and select "Export Widget"
4. **Customize Settings**: Choose colors, position, size, and other options
5. **Copy Code**: Select your preferred integration method and copy the code
6. **Embed on Website**: Paste the code into your website's HTML

## Export Options

### 1. JavaScript Widget (Recommended)
A floating chat widget that appears as a button and expands into a chat window.

**Advantages:**
- Non-intrusive floating design
- Customizable position and appearance
- Full conversation functionality
- Easy to integrate

**Usage:**
```html
<script src="https://your-domain.com/widgets/chatbot-widget.js" 
        data-bot-id="YOUR_BOT_ID"
        data-primary-color="#3b82f6"
        data-position="bottom-right"
        data-size="medium">
</script>
```

### 2. Iframe Embed
A fixed chat window that can be embedded anywhere on your page.

**Advantages:**
- Fixed position and size
- Works in any HTML context
- No JavaScript conflicts
- Easy to style with CSS

**Usage:**
```html
<iframe 
  src="https://your-domain.com/embed/YOUR_BOT_ID" 
  width="350" 
  height="500" 
  frameborder="0"
  title="Chatbot">
</iframe>
```

### 3. React Component
A React component for use in React applications.

**Advantages:**
- Full React integration
- Customizable and extensible
- TypeScript support
- Component-based architecture

**Usage:**
```jsx
import ChatbotWidget from './ChatbotWidget';

function App() {
  return (
    <div>
      <ChatbotWidget 
        botId="YOUR_BOT_ID"
        primaryColor="#3b82f6"
        position="bottom-right"
      />
    </div>
  );
}
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `botId` | string | required | Your bot's unique identifier |
| `primaryColor` | string | "#3b82f6" | Main color for buttons and user messages |
| `secondaryColor` | string | "#1e40af" | Secondary color for avatar and accents |
| `position` | string | "bottom-right" | Widget position (bottom-right, bottom-left, top-right, top-left) |
| `size` | string | "medium" | Widget size (small, medium, large) |
| `showAvatar` | boolean | true | Show bot avatar in header |
| `showTitle` | boolean | true | Show bot name in header |
| `autoOpen` | boolean | false | Automatically open chat on page load |
| `apiUrl` | string | "/api/chat" | Your chat API endpoint URL |
| `botName` | string | "Chatbot" | Display name for the bot |

## JavaScript API

The widget exposes a JavaScript API for programmatic control:

```javascript
// Open the chat widget
ChatbotWidget.open();

// Close the chat widget
ChatbotWidget.close();

// Toggle the chat widget
ChatbotWidget.toggle();

// Send a message programmatically
ChatbotWidget.sendMessage();

// Destroy the widget
ChatbotWidget.destroy();
```

## Integration Examples

### WordPress
Add the script tag to your theme's `header.php` file or use a plugin like "Insert Headers and Footers".

### Shopify
Add the script to your theme's `theme.liquid` file in the `<head>` section.

### React/Next.js
Use the React component or initialize the widget in a `useEffect` hook.

### Static HTML
Simply add the script tag to your HTML file's `<head>` section.

## Styling and Customization

The widget is designed to be non-intrusive and responsive. It automatically adapts to your website's design while maintaining its own styling to ensure consistency across different sites.

### Custom CSS
You can override widget styles by targeting the widget's CSS classes:

```css
#chatbot-widget-YOUR_BOT_ID {
  /* Custom styles */
}

#chatbot-widget-YOUR_BOT_ID .chatbot-button {
  /* Custom button styles */
}
```

## Security Considerations

- The widget communicates with your API endpoints
- Ensure your API has proper CORS configuration
- Consider rate limiting for public bots
- Validate all user inputs on the server side

## Troubleshooting

### Widget Not Appearing
- Check that the script tag is correctly placed
- Verify the bot ID is correct
- Ensure the API URL is accessible
- Check browser console for errors

### Styling Issues
- The widget uses fixed positioning and high z-index
- Check for CSS conflicts with your site's styles
- Ensure the widget container has proper dimensions

### API Errors
- Verify the bot is active and deployed
- Check API endpoint configuration
- Ensure proper authentication if required

## Support

For technical support or questions about widget integration, please refer to the API documentation or contact support.

## File Structure

```
├── components/dashboard/
│   ├── embeddable-widget.tsx      # Export dialog component
│   └── bot-card.tsx               # Updated with export functionality
├── app/
│   ├── api/widget/[botId]/script.js/route.ts  # Widget script API
│   └── embed/[botId]/page.tsx     # Iframe embed page
├── public/
│   ├── widgets/
│   │   └── chatbot-widget.js      # Standalone widget script
│   └── examples/
│       └── widget-embed-example.html  # Integration example
└── WIDGET_EXPORT_GUIDE.md         # This documentation
```

## Next Steps

1. **Test the Widget**: Use the example HTML file to test your widget
2. **Customize Appearance**: Adjust colors and settings to match your brand
3. **Deploy to Production**: Update your production environment with the new files
4. **Monitor Usage**: Track widget usage and performance through your analytics
5. **Gather Feedback**: Collect user feedback to improve the widget experience

