# Database Chatbot API

A comprehensive REST API that enables chatbots to connect to external databases (MySQL, PostgreSQL, MariaDB) and generate intelligent responses based on database queries using natural language processing.

## 🚀 Features

- **Multi-Database Support**: MySQL, PostgreSQL, and MariaDB
- **Natural Language to SQL**: Convert user questions into SQL queries
- **Secure Authentication**: Access token and secret key based authentication
- **Intelligent Responses**: AI-powered response generation from query results
- **Connection Pooling**: Efficient database connection management
- **Query Security**: SQL injection prevention and permission controls
- **Real-time Analytics**: Query execution monitoring and logging

## 📋 Prerequisites

- Node.js 18+ 
- Next.js 14+
- One or more external databases (MySQL, PostgreSQL, or MariaDB)
- OpenAI API key for AI-powered responses

## 🛠️ Installation

1. **Install Dependencies**
   ```bash
   npm install mysql2 pg mariadb
   npm install -D @types/pg
   ```

2. **Environment Variables**
   Add to your `.env.local`:
   ```env
   # OpenAI API (for AI responses)
   OPENAI_API_KEY=your_openai_api_key

   # Database URLs (for your external databases)
   MYSQL_URL=mysql://username:password@host:port/database
   POSTGRESQL_URL=postgresql://username:password@host:port/database
   MARIADB_URL=mariadb://username:password@host:port/database
   ```

3. **Database Setup**
   Ensure your external databases are accessible and have appropriate user permissions.

## 🚀 Quick Start

### 1. Create Bot Database Credentials

```bash
curl -X POST "http://localhost:3000/api/bots/1/database-credentials" \
  -H "Authorization: Bearer your_access_token:your_secret_key" \
  -H "Content-Type: application/json" \
  -d '{
    "permissions": ["read", "write"],
    "expires_in_days": 365
  }'
```

### 2. Test Database Connection

```bash
curl -X GET "http://localhost:3000/api/database/query?action=test&type=mysql&host=localhost&port=3306&database=test_db&username=user&password=pass" \
  -H "Authorization: Bearer your_access_token:your_secret_key"
```

### 3. Execute Direct SQL Query

```bash
curl -X POST "http://localhost:3000/api/database/query" \
  -H "Authorization: Bearer your_access_token:your_secret_key" \
  -H "Content-Type: application/json" \
  -d '{
    "database_config": {
      "type": "mysql",
      "host": "localhost",
      "port": 3306,
      "database": "test_db",
      "username": "user",
      "password": "pass"
    },
    "query": "SELECT COUNT(*) as user_count FROM users WHERE active = ?",
    "params": [true]
  }'
```

### 4. Use Chatbot with Database

```bash
curl -X POST "http://localhost:3000/api/chatbot/database-chat" \
  -H "Authorization: Bearer your_access_token:your_secret_key" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How many active users do we have?",
    "database_config": {
      "type": "mysql",
      "host": "localhost",
      "port": 3306,
      "database": "test_db",
      "username": "user",
      "password": "pass"
    }
  }'
```

## 📚 API Endpoints

### Database Query API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/database/query` | Execute SQL queries |
| GET | `/api/database/query?action=test` | Test database connection |
| GET | `/api/database/query?action=schema` | Get database schema |
| GET | `/api/database/query?action=table&table=NAME` | Get table structure |

### Chatbot API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chatbot/database-chat` | AI-powered database chat |
| GET | `/api/chatbot/database-chat` | API documentation |

### Bot Management API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bots/{botId}/database-credentials` | Create database credentials |
| GET | `/api/bots/{botId}/database-credentials` | Get credentials info |
| PUT | `/api/bots/{botId}/database-credentials` | Update credentials |
| DELETE | `/api/bots/{botId}/database-credentials` | Revoke credentials |

## 🔐 Authentication

The API uses a two-factor authentication system:

### Method 1: Authorization Header
```http
Authorization: Bearer access_token:secret_key
```

### Method 2: JSON Body
```json
{
  "access_token": "your_access_token",
  "secret_key": "your_secret_key"
}
```

### Method 3: Query Parameters
```
?access_token=your_token&secret_key=your_secret
```

## 🗄️ Database Configuration

### Supported Databases

| Database | Port | SSL | Connection Pooling |
|----------|------|-----|-------------------|
| MySQL | 3306 | Optional | ✅ |
| PostgreSQL | 5432 | Optional | ✅ |
| MariaDB | 3306 | Optional | ✅ |

### Configuration Format

```json
{
  "type": "mysql|postgresql|mariadb",
  "host": "database_host",
  "port": 3306,
  "database": "database_name",
  "username": "username",
  "password": "password",
  "ssl": false,
  "connectionLimit": 10
}
```

## 💡 Usage Examples

### Example 1: E-commerce Analytics

```javascript
const response = await fetch('/api/chatbot/database-chat', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer token:secret',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: "What are the top 5 products by sales this month?",
    database_config: {
      type: "mysql",
      host: "analytics-db.company.com",
      port: 3306,
      database: "ecommerce",
      username: "analyst",
      password: "secure_password",
      ssl: true
    },
    system_prompt: "You are an e-commerce analytics expert.",
    max_rows: 5,
    temperature: 0.2
  })
});
```

### Example 2: User Management

```javascript
const response = await fetch('/api/chatbot/database-chat', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer token:secret',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: "Show me all users who registered in the last 7 days",
    database_config: {
      type: "postgresql",
      host: "user-db.company.com",
      port: 5432,
      database: "users",
      username: "readonly",
      password: "password"
    },
    max_rows: 50
  })
});
```

### Example 3: Financial Reporting

```javascript
const response = await fetch('/api/chatbot/database-chat', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer token:secret',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: "Calculate the total revenue for Q1 2024",
    database_config: {
      type: "mariadb",
      host: "finance-db.company.com",
      port: 3306,
      database: "financial",
      username: "finance_user",
      password: "secure_password"
    },
    system_prompt: "You are a financial reporting assistant.",
    temperature: 0.1
  })
});
```

## 🧪 Testing

Run the comprehensive test suite:

```bash
npm run test:database-api
```

Or run individual tests:

```javascript
const { testDatabaseConnection, testChatbotChat } = require('./test-database-api.js');

// Test database connection
const isConnected = await testDatabaseConnection({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  database: 'test_db',
  username: 'user',
  password: 'pass'
});

// Test chatbot chat
const response = await testChatbotChat(
  databaseConfig,
  "How many users are in the database?",
  { temperature: 0.7 }
);
```

## 🔒 Security Features

### SQL Injection Prevention
- All queries use parameterized statements
- Dangerous SQL keywords are filtered for read-only access
- Query execution is limited by row count and timeout

### Authentication Security
- Access tokens and secret keys are stored encrypted
- Tokens have configurable expiration dates
- Failed authentication attempts are logged

### Database Access Control
- Read-only permissions by default
- Write permissions require explicit grant
- Connection pooling prevents resource exhaustion

## 📊 Monitoring & Analytics

### Query Logging
Enable query logging to track usage:

```json
{
  "enable_query_logging": true
}
```

### Performance Metrics
- Query execution time
- Row count returned
- Connection pool usage
- Error rates

### Rate Limiting
- Database Queries: 100 requests/minute per bot
- Chatbot Responses: 50 requests/minute per bot
- Connection Tests: 10 requests/minute per bot

## 🚨 Error Handling

### Common Error Responses

| Status | Error | Description |
|--------|-------|-------------|
| 401 | Unauthorized | Invalid access token or secret key |
| 403 | Forbidden | Insufficient permissions |
| 400 | Bad Request | Missing required fields or invalid data |
| 408 | Timeout | Query execution timeout |
| 500 | Internal Error | Database connection or server error |

### Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🛠️ Development

### Project Structure

```
├── app/api/
│   ├── database/query/route.ts          # Direct SQL query execution
│   ├── chatbot/database-chat/route.ts   # AI-powered database chat
│   └── bots/[botId]/database-credentials/route.ts # Credential management
├── lib/
│   ├── services/
│   │   ├── external-database.service.ts # Database connection service
│   │   └── chatbot-database.service.ts  # AI chatbot service
│   └── middleware/
│       └── database-auth.ts             # Authentication middleware
├── test-database-api.js                 # Test suite
└── DATABASE_API_DOCUMENTATION.md       # Detailed documentation
```

### Adding New Database Types

1. Add database driver to `package.json`
2. Update `ExternalDatabaseService` with new database type
3. Add connection logic in `createConnection` method
4. Add query execution logic in `executeQuery` method
5. Update documentation and tests

### Customizing AI Responses

Modify the system prompts in `ChatbotDatabaseService`:

```typescript
const systemPrompt = "You are a specialized database assistant for [your domain].";
```

## 📈 Performance Optimization

### Connection Pooling
- Configure appropriate pool sizes based on expected load
- Monitor connection usage and adjust limits
- Use connection timeouts to prevent hanging connections

### Query Optimization
- Use appropriate indexes in your database
- Limit result set sizes with `max_rows` parameter
- Implement query caching for frequently accessed data

### Caching
- Cache database schema information
- Implement response caching for common queries
- Use Redis or similar for session management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For technical support or questions:

1. Check the [API Documentation](DATABASE_API_DOCUMENTATION.md)
2. Review the test examples in `test-database-api.js`
3. Open an issue on GitHub
4. Contact the development team

## 🔄 Changelog

### v1.0.0
- Initial release
- Support for MySQL, PostgreSQL, and MariaDB
- AI-powered natural language to SQL conversion
- Secure authentication system
- Comprehensive API documentation
- Test suite and examples
