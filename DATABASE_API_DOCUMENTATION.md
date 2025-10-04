# Database Chatbot API Documentation

This API enables chatbots to connect to external databases (MySQL, PostgreSQL, MariaDB) and generate intelligent responses based on database queries. The API uses access tokens and secret keys for authentication.

## Table of Contents

1. [Authentication](#authentication)
2. [API Endpoints](#api-endpoints)
3. [Database Configuration](#database-configuration)
4. [Usage Examples](#usage-examples)
5. [Error Handling](#error-handling)
6. [Security Considerations](#security-considerations)

## Authentication

The API uses a two-factor authentication system:
- **Access Token**: Unique identifier for the bot
- **Secret Key**: Secret key for additional security

### Authentication Methods

#### Method 1: Authorization Header
```http
Authorization: Bearer access_token:secret_key
```

#### Method 2: JSON Body
```json
{
  "access_token": "your_access_token",
  "secret_key": "your_secret_key"
}
```

#### Method 3: Query Parameters
```
?access_token=your_access_token&secret_key=your_secret_key
```

## API Endpoints

### 1. Database Query API

Execute SQL queries directly on external databases.

**Endpoint:** `POST /api/database/query`

**Headers:**
```http
Authorization: Bearer access_token:secret_key
Content-Type: application/json
```

**Request Body:**
```json
{
  "database_config": {
    "type": "mysql|postgresql|mariadb",
    "host": "database_host",
    "port": 3306,
    "database": "database_name",
    "username": "username",
    "password": "password",
    "ssl": false,
    "connectionLimit": 10
  },
  "query": "SELECT * FROM users WHERE active = ?",
  "params": [true],
  "max_rows": 1000,
  "timeout": 30000
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {"id": 1, "name": "John Doe", "email": "john@example.com"},
    {"id": 2, "name": "Jane Smith", "email": "jane@example.com"}
  ],
  "columns": ["id", "name", "email"],
  "rowCount": 2,
  "executionTime": 45,
  "query": "SELECT * FROM users WHERE active = ? LIMIT 1000",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 2. Database Connection Test

Test database connectivity.

**Endpoint:** `GET /api/database/query?action=test`

**Query Parameters:**
- `type`: Database type (mysql, postgresql, maria)
- `host`: Database host
- `port`: Database port
- `database`: Database name
- `username`: Username
- `password`: Password
- `ssl`: SSL enabled (true/false)

**Response:**
```json
{
  "success": true,
  "connected": true,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 3. Database Schema Information

Get database schema information.

**Endpoint:** `GET /api/database/query?action=schema`

**Response:**
```json
{
  "success": true,
  "schema": [
    {
      "table_name": "users",
      "table_comment": "User accounts table"
    },
    {
      "table_name": "orders",
      "table_comment": "Customer orders"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 4. Table Structure

Get detailed table structure.

**Endpoint:** `GET /api/database/query?action=table&table=TABLE_NAME`

**Response:**
```json
{
  "success": true,
  "table": "users",
  "structure": [
    {
      "column_name": "id",
      "data_type": "int",
      "is_nullable": "NO",
      "column_key": "PRI",
      "column_default": null,
      "extra": "auto_increment"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 5. Chatbot Database Chat

AI-powered chatbot that can query databases using natural language.

**Endpoint:** `POST /api/chatbot/database-chat`

**Request Body:**
```json
{
  "message": "How many active users do we have?",
  "database_config": {
    "type": "mysql",
    "host": "localhost",
    "port": 3306,
    "database": "myapp",
    "username": "readonly",
    "password": "password"
  },
  "system_prompt": "You are a helpful database assistant.",
  "context": "We're analyzing user engagement metrics.",
  "max_rows": 100,
  "temperature": 0.7,
  "enable_query_logging": true
}
```

**Response:**
```json
{
  "success": true,
  "response": "Based on the database query, you currently have 1,247 active users. This represents a 15% increase from last month.",
  "query": "SELECT COUNT(*) as active_users FROM users WHERE status = 'active'",
  "queryResult": {
    "data": [{"active_users": 1247}],
    "columns": ["active_users"],
    "rowCount": 1,
    "executionTime": 23
  },
  "confidence": 0.95,
  "executionTime": 1250,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 6. Bot Database Credentials Management

Manage database access credentials for bots.

#### Create Credentials
**Endpoint:** `POST /api/bots/{botId}/database-credentials`

**Request Body:**
```json
{
  "permissions": ["read", "write"],
  "expires_in_days": 365
}
```

**Response:**
```json
{
  "success": true,
  "bot_id": 123,
  "access_token": "abc123...",
  "secret_key": "xyz789...",
  "expires_at": "2025-01-15T10:30:00.000Z",
  "permissions": ["read", "write"],
  "created_at": "2024-01-15T10:30:00.000Z"
}
```

#### Get Credentials Info
**Endpoint:** `GET /api/bots/{botId}/database-credentials`

**Response:**
```json
{
  "success": true,
  "bot_id": 123,
  "credentials": {
    "enabled": true,
    "expires_at": "2025-01-15T10:30:00.000Z",
    "last_used_at": "2024-01-15T09:15:00.000Z",
    "permissions": ["read", "write"],
    "is_expired": false
  }
}
```

#### Update Credentials
**Endpoint:** `PUT /api/bots/{botId}/database-credentials`

#### Revoke Credentials
**Endpoint:** `DELETE /api/bots/{botId}/database-credentials`

## Database Configuration

### Supported Database Types

1. **MySQL**
   - Port: 3306 (default)
   - SSL: Optional
   - Connection pooling supported

2. **PostgreSQL**
   - Port: 5432 (default)
   - SSL: Optional
   - Connection pooling supported

3. **MariaDB**
   - Port: 3306 (default)
   - SSL: Optional
   - Connection pooling supported

### Configuration Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| type | string | Yes | Database type (mysql, postgresql, maria) |
| host | string | Yes | Database host address |
| port | number | Yes | Database port |
| database | string | Yes | Database name |
| username | string | Yes | Database username |
| password | string | Yes | Database password |
| ssl | boolean | No | Enable SSL connection (default: false) |
| connectionLimit | number | No | Max connections in pool (default: 10) |

## Usage Examples

### Example 1: Basic User Query

```bash
curl -X POST "https://your-api.com/api/chatbot/database-chat" \
  -H "Authorization: Bearer your_token:your_secret" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me all users created this month",
    "database_config": {
      "type": "mysql",
      "host": "localhost",
      "port": 3306,
      "database": "myapp",
      "username": "readonly",
      "password": "password"
    }
  }'
```

### Example 2: Complex Analytics Query

```bash
curl -X POST "https://your-api.com/api/chatbot/database-chat" \
  -H "Authorization: Bearer your_token:your_secret" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the top 5 products by sales this quarter?",
    "database_config": {
      "type": "postgresql",
      "host": "analytics-db.company.com",
      "port": 5432,
      "database": "analytics",
      "username": "analyst",
      "password": "secure_password",
      "ssl": true
    },
    "max_rows": 5,
    "temperature": 0.3
  }'
```

### Example 3: Direct SQL Query

```bash
curl -X POST "https://your-api.com/api/database/query" \
  -H "Authorization: Bearer your_token:your_secret" \
  -H "Content-Type: application/json" \
  -d '{
    "database_config": {
      "type": "mysql",
      "host": "localhost",
      "port": 3306,
      "database": "ecommerce",
      "username": "readonly",
      "password": "password"
    },
    "query": "SELECT COUNT(*) as total_orders FROM orders WHERE created_at >= ?",
    "params": ["2024-01-01"],
    "max_rows": 1
  }'
```

## Error Handling

### Common Error Responses

#### 401 Unauthorized
```json
{
  "success": false,
  "error": "Invalid access token",
  "code": "UNAUTHORIZED"
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "error": "Insufficient permissions to execute queries",
  "code": "FORBIDDEN"
}
```

#### 400 Bad Request
```json
{
  "success": false,
  "error": "Missing required fields: type, host, port",
  "code": "BAD_REQUEST"
}
```

#### 408 Request Timeout
```json
{
  "success": false,
  "error": "Query execution timeout",
  "code": "TIMEOUT"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Database connection failed",
  "code": "INTERNAL_ERROR"
}
```

## Security Considerations

### 1. Authentication
- Access tokens and secret keys are stored encrypted in the database
- Tokens have configurable expiration dates
- Failed authentication attempts are logged

### 2. SQL Injection Prevention
- All queries use parameterized statements
- Dangerous SQL keywords are filtered for read-only access
- Query execution is limited by row count and timeout

### 3. Database Access
- Read-only permissions by default
- Write permissions require explicit grant
- Connection pooling prevents resource exhaustion

### 4. Data Privacy
- Sensitive data in responses can be filtered
- Query logging can be disabled
- Database credentials are never logged

### 5. Rate Limiting
- API calls are rate-limited per bot
- Query execution timeouts prevent long-running queries
- Result set size limits prevent memory issues

## Best Practices

1. **Use Read-Only Credentials**: Create database users with minimal required permissions
2. **Enable SSL**: Use encrypted connections for production databases
3. **Set Reasonable Limits**: Configure appropriate timeouts and row limits
4. **Monitor Usage**: Enable query logging for analytics and debugging
5. **Rotate Credentials**: Regularly update access tokens and secret keys
6. **Test Connections**: Use the test endpoint to verify database connectivity
7. **Handle Errors Gracefully**: Implement proper error handling in your applications

## Rate Limits

- **Database Queries**: 100 requests per minute per bot
- **Chatbot Responses**: 50 requests per minute per bot
- **Connection Tests**: 10 requests per minute per bot

## Support

For technical support or questions about the Database Chatbot API, please contact the development team or refer to the main API documentation.
