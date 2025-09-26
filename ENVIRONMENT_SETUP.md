# Environment Setup Guide

## Database and API Configuration

To use the chatbot application with PostgreSQL database and DeepSeek API, you need to set up environment variables.

### 1. Create Environment File

Create a `.env.local` file in your project root with the following content:

```bash
# Database Configuration
DATABASE_URL="postgresql://myuser:mypassword@127.0.0.1:5431/mydb?schema=public"

# OpenAI API Configuration
OPENAI_API_KEY=sk-your-openai-key

# Next.js Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# JWT Secret for authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 2. Environment Variables Explained

- `DATABASE_URL`: PostgreSQL database connection string
- `DEEPSEEK_API_KEY`: Your DeepSeek API key for authentication
- `DEEPSEEK_API_URL`: The DeepSeek API endpoint URL
- `NEXT_PUBLIC_APP_URL`: Your application URL (used for CORS and other configurations)
- `JWT_SECRET`: Secret key for JWT token generation (change in production)

### 3. Security Notes

- **Never commit your `.env.local` file to version control**
- The `.env.local` file is already included in `.gitignore`
- For production, set these environment variables in your hosting platform (Vercel, Netlify, etc.)

### 4. Fallback Configuration

If environment variables are not set, the application will use the following defaults:
- API Key: The one provided in your request
- Default Model: `gpt-4o-mini`

### 5. Database Setup

1. **Install PostgreSQL** and create a database named `mydb`
2. **Update the DATABASE_URL** in `.env.local` with your actual database credentials
3. **Run database migrations**: `npm run db:push`
4. **Seed the database**: `npm run db:seed`

### 6. Testing the Setup

1. Start your development server: `npm run dev`
2. Navigate to the authentication page and sign up/sign in
3. Create a new bot in the dashboard
4. Navigate to the chat page and create a new conversation
5. Send a message - the bot should respond using the DeepSeek API and save to database

### 7. Production Deployment

For production deployment:

1. **Vercel**: Add environment variables in your Vercel dashboard under Settings > Environment Variables
2. **Netlify**: Add environment variables in your Netlify dashboard under Site Settings > Environment Variables
3. **Other platforms**: Follow your hosting provider's documentation for setting environment variables

### 8. Database Commands

Useful database commands for development:

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes to database
npm run db:push

# Create and run migrations
npm run db:migrate

# Open Prisma Studio (database GUI)
npm run db:studio

# Seed database with sample data
npm run db:seed
```

### 9. API Usage

The application now includes:
- **Database Integration**: PostgreSQL with Prisma ORM
- **Authentication**: Secure user registration and login
- **Bot Management**: Create, update, and manage chatbots
- **Conversation History**: Persistent chat conversations
- **Analytics**: Bot performance tracking
- **Knowledge Base**: Document management for bots
- Server-side API routes for secure operations
- Client-side hooks for easy integration
- Error handling and loading states
- Token usage tracking
- Support for different bot configurations (temperature, max tokens, etc.)
