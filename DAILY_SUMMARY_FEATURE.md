# Daily Summary Feature

This feature provides AI-powered daily insights and trend analysis for your chatbot conversations.

## Overview

The daily summary feature analyzes all messages from a specific bot on a given day and generates:
- **Issues**: User-reported problems, errors, or complaints
- **Trends**: Common topics and themes with frequency counts

## Features

### Two Analysis Methods

1. **Keyword Analysis** (Default)
   - Fast and reliable
   - Uses predefined keyword matching
   - No external API calls required
   - Good for basic trend detection

2. **AI Analysis** (Optional)
   - More sophisticated analysis
   - Uses OpenAI GPT-4o-mini
   - Requires `OPENAI_API_KEY` environment variable
   - Better at understanding context and nuance

### Database Schema

The feature adds a `daily_summary` JSON field to the existing `BotAnalytics` table:

```sql
daily_summary Json?
```

The JSON structure:
```json
{
  "issues": ["Issue 1", "Issue 2"],
  "trends": {
    "trend_name": count,
    "another_trend": count
  },
  "generated_at": "2024-01-15T10:30:00.000Z",
  "method": "keyword" | "ai"
}
```

## API Endpoints

### Generate Daily Summary

**POST** `/api/analytics/[botId]/daily-summary?date=YYYY-MM-DD&useAI=true|false`

Generates a new daily summary for the specified bot and date.

**Parameters:**
- `botId`: Bot ID (path parameter)
- `date`: Date in YYYY-MM-DD format (query parameter)
- `useAI`: Whether to use AI analysis (query parameter, default: true)

**Response:**
```json
{
  "success": true,
  "data": {
    "issues": ["Users report checkout errors", "Password reset fails"],
    "trends": {
      "checkout_errors": 12,
      "password_reset_failures": 5
    },
    "generated_at": "2024-01-15T10:30:00.000Z",
    "method": "ai"
  }
}
```

### Get Daily Summary

**GET** `/api/analytics/[botId]/daily-summary?date=YYYY-MM-DD`

Retrieves an existing daily summary for the specified bot and date.

**Response:**
```json
{
  "success": true,
  "data": {
    "botId": 1,
    "date": "2024-01-15",
    "issues": ["Users report checkout errors"],
    "trends": {
      "checkout_errors": 12
    },
    "generated_at": "2024-01-15T10:30:00.000Z",
    "method": "ai"
  }
}
```

## Frontend Usage

### Analytics Dashboard

The daily summary appears in the analytics dashboard when:
1. A specific bot is selected (not "All Bots")
2. A date is selected using the date picker

### Daily Summary Component

The `DailySummaryCard` component provides:
- **Generate buttons**: Create summaries using keyword or AI analysis
- **Issues list**: Shows detected problems with bullet points
- **Trends grid**: Displays topics with frequency counts
- **Refresh button**: Reload existing summary data

## Backend Services

### DailySummaryService

Located in `lib/services/daily-summary.service.ts`:

```typescript
// Generate keyword-based summary
await DailySummaryService.generateKeywordSummary(messages)

// Generate AI-based summary
await DailySummaryService.generateAISummary(messages)

// Auto-select method based on API key availability
await DailySummaryService.generateDailySummary(messages, useAI)
```

### ServerAnalyticsService

Located in `lib/server-database.ts`:

```typescript
// Get messages for a specific date
const messages = await ServerAnalyticsService.getMessagesForDate(botId, date)

// Generate and save daily summary
const summary = await ServerAnalyticsService.generateDailySummary(botId, date, useAI)
```

## Scripts

### Generate Daily Summaries Script

Use the provided script to generate summaries for existing data:

```bash
# Generate AI summaries for bot 1 from Jan 1-31, 2024
node scripts/generate-daily-summaries.js 1 2024-01-01 2024-01-31 true

# Generate keyword summaries for bot 1 for a single day
node scripts/generate-daily-summaries.js 1 2024-01-15 2024-01-15 false
```

## Environment Variables

For AI analysis, add to your `.env.local`:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

## Migration

The feature uses the existing `BotAnalytics` table with a new JSON column. No migration is required if you've already added the `daily_summary` field to your schema.

## Usage Examples

### 1. Generate Summary via API

```javascript
// Generate AI summary for today
const response = await fetch('/api/analytics/1/daily-summary?date=2024-01-15&useAI=true', {
  method: 'POST'
})
const data = await response.json()
console.log(data.data.issues) // ["Users report checkout errors"]
```

### 2. Get Existing Summary

```javascript
// Get existing summary
const response = await fetch('/api/analytics/1/daily-summary?date=2024-01-15')
const data = await response.json()
console.log(data.data.trends) // { "checkout_errors": 12 }
```

### 3. Generate in Backend

```typescript
import { ServerAnalyticsService } from '@/lib/server-database'

// Generate summary for a specific date
const summary = await ServerAnalyticsService.generateDailySummary(1, '2024-01-15', true)
console.log(summary.issues)
```

## Troubleshooting

### No Summary Available
- Check if there are messages for the selected date
- Verify the bot ID is correct
- Ensure the date format is YYYY-MM-DD

### AI Analysis Fails
- Verify `OPENAI_API_KEY` is set
- Check API key has sufficient credits
- The system will fallback to keyword analysis

### Performance Considerations
- AI analysis is slower and costs money
- Keyword analysis is instant and free
- Consider using keyword analysis for real-time generation
- Use AI analysis for deeper insights on demand

## Future Enhancements

- **Scheduled generation**: Auto-generate summaries daily
- **Email alerts**: Notify when critical issues are detected
- **Trend comparison**: Compare trends across different time periods
- **Custom keywords**: Allow users to define their own issue keywords
- **Sentiment analysis**: Add sentiment scoring to issues and trends
