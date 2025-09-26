# API Documentation

## Overview

This document describes the REST API endpoints for the AI Chatbot Platform. The API follows RESTful conventions and returns JSON responses.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Currently, the API uses simple user ID-based authentication. In production, implement proper JWT or session-based authentication.

## Response Format

All API responses follow this format:

```json
{
  "success": boolean,
  "message": string,
  "data": any,
  "errors": object,
  "timestamp": string
}
```

## Error Codes

- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `500` - Internal Server Error

---

## Bot Management

### Create Bot

**POST** `/api/bots`

Create a new chatbot.

**Request Body:**
```json
{
  "userId": number,
  "name": string,
  "description": string,
  "system_prompt": string,
  "model": "gpt-4o" | "gpt-4o-mini" | "o3-mini" | "gpt-3.5-turbo",
  "temperature": number,
  "max_tokens": number,
  "status": "draft" | "active" | "inactive",
  "is_deployed": boolean,
  "deployment_url": string
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bot created successfully",
  "data": {
    "id": 1,
    "user_id": 1,
    "name": "Customer Support Bot",
    "description": "A helpful customer support assistant",
    "system_prompt": "You are a helpful assistant...",
    "model": "gpt-4o-mini",
    "temperature": 0.7,
    "max_tokens": 1000,
    "status": "draft",
    "is_deployed": false,
    "deployment_url": null,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get Bots

**GET** `/api/bots`

Get all bots with optional filters.

**Query Parameters:**
- `userId` (number) - Filter by user ID
- `status` (string) - Filter by status
- `isDeployed` (boolean) - Filter by deployment status
- `search` (string) - Search in name and description

**Response:**
```json
{
  "success": true,
  "message": "Bots retrieved successfully",
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "name": "Customer Support Bot",
      "description": "A helpful customer support assistant",
      "system_prompt": "You are a helpful assistant...",
      "model": "gpt-4o-mini",
      "temperature": 0.7,
      "max_tokens": 1000,
      "status": "draft",
      "is_deployed": false,
      "deployment_url": null,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Get Bot by ID

**GET** `/api/bots/{id}`

Get a specific bot by ID.

**Response:**
```json
{
  "success": true,
  "message": "Bot retrieved successfully",
  "data": {
    "id": 1,
    "user_id": 1,
    "name": "Customer Support Bot",
    "description": "A helpful customer support assistant",
    "system_prompt": "You are a helpful assistant...",
    "model": "gpt-4o-mini",
    "temperature": 0.7,
    "max_tokens": 1000,
    "status": "draft",
    "is_deployed": false,
    "deployment_url": null,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Update Bot

**PUT** `/api/bots/{id}`

Update a bot's configuration.

**Request Body:**
```json
{
  "name": string,
  "description": string,
  "system_prompt": string,
  "model": "gpt-4o" | "gpt-4o-mini" | "o3-mini" | "gpt-3.5-turbo",
  "temperature": number,
  "max_tokens": number,
  "status": "draft" | "active" | "inactive",
  "is_deployed": boolean,
  "deployment_url": string
}
```

### Delete Bot

**DELETE** `/api/bots/{id}`

Delete a bot and all associated data.

**Response:**
```json
{
  "success": true,
  "message": "Bot deleted successfully"
}
```




### Get Bot Statistics

**GET** `/api/bots/{id}/stats`

Get statistics for a specific bot.

**Response:**
```json
{
  "success": true,
  "message": "Bot statistics retrieved successfully",
  "data": {
    "totalConversations": 150,
    "totalMessages": 1250,
    "totalTokensUsed": 45000,
    "avgResponseTime": 1200
  }
}
```

---

## Conversation Management

### Create Conversation

**POST** `/api/conversations`

Create a new conversation.

**Request Body:**
```json
{
  "botId": number,
  "userId": number,
  "title": string,
  "isTest": boolean
}
```

**Response:**
```json
{
  "success": true,
  "message": "Conversation created successfully",
  "data": {
    "id": 1,
    "bot_id": 1,
    "user_id": 1,
    "title": "New Conversation",
    "is_test": false,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get Conversations

**GET** `/api/conversations`

Get conversations for a user.

**Query Parameters:**
- `userId` (number) - User ID to get conversations for

### Get Conversation by ID

**GET** `/api/conversations/{id}`

Get a specific conversation by ID.

### Update Conversation

**PUT** `/api/conversations/{id}`

Update conversation details.

**Request Body:**
```json
{
  "title": string
}
```

### Delete Conversation

**DELETE** `/api/conversations/{id}`

Delete a conversation and all its messages.

---

## Message Management

### Create Message

**POST** `/api/conversations/{id}/messages`

Add a message to a conversation.

**Request Body:**
```json
{
  "role": "user" | "assistant" | "system",
  "content": string,
  "tokensUsed": number,
  "responseTimeMs": number
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message created successfully",
  "data": {
    "id": 1,
    "conversation_id": 1,
    "role": "user",
    "content": "Hello, how can you help me?",
    "tokens_used": 12,
    "response_time_ms": 150,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get Messages

**GET** `/api/conversations/{id}/messages`

Get all messages for a conversation.

**Response:**
```json
{
  "success": true,
  "message": "Messages retrieved successfully",
  "data": [
    {
      "id": 1,
      "conversation_id": 1,
      "role": "user",
      "content": "Hello, how can you help me?",
      "tokens_used": 12,
      "response_time_ms": 150,
      "created_at": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "conversation_id": 1,
      "role": "assistant",
      "content": "I'm here to help you with any questions you might have!",
      "tokens_used": 18,
      "response_time_ms": 1200,
      "created_at": "2024-01-01T00:01:00.000Z"
    }
  ]
}
```

---

## User Management

### Create User

**POST** `/api/users`

Create a new user account.

**Request Body:**
```json
{
  "email": string,
  "password": string,
  "name": string
}
```

### Get User by ID

**GET** `/api/users/{id}`

Get user information by ID.

### Update User

**PUT** `/api/users/{id}`

Update user information.

**Request Body:**
```json
{
  "name": string,
  "email": string,
  "password": string
}
```

### Delete User

**DELETE** `/api/users/{id}`

Delete user account and all associated data.

### Get User Statistics

**GET** `/api/users/{id}/stats`

Get user statistics.

**Response:**
```json
{
  "success": true,
  "message": "User statistics retrieved successfully",
  "data": {
    "totalBots": 5,
    "activeBots": 3,
    "totalConversations": 150,
    "totalMessages": 1250
  }
}
```

### Authenticate User

**POST** `/api/users/authenticate`

Authenticate user login.

**Request Body:**
```json
{
  "email": string,
  "password": string
}
```

---

## Error Examples

### Validation Error

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "name": ["Bot name is required"],
    "temperature": ["Temperature must be between 0 and 2"]
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Not Found Error

```json
{
  "success": false,
  "message": "Bot not found",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Internal Server Error

```json
{
  "success": false,
  "message": "Internal server error",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Rate Limiting

The API implements basic rate limiting:
- 100 requests per 15 minutes per IP address
- Returns `429 Too Many Requests` when limit exceeded

---

## Development Notes

- All timestamps are in ISO 8601 format
- All IDs are integers
- Boolean values are true/false
- String fields have length limits (see validation rules)
- Database operations use transactions where appropriate
- All endpoints include proper error handling and logging
