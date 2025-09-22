-- Creating database schema for AI chatbot platform
-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bots table for chatbot management
CREATE TABLE IF NOT EXISTS bots (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  system_prompt TEXT,
  model VARCHAR(100) DEFAULT 'gpt-3.5-turbo',
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 1000,
  status VARCHAR(20) DEFAULT 'draft', -- draft, active, inactive
  is_deployed BOOLEAN DEFAULT FALSE,
  deployment_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Knowledge base documents
CREATE TABLE IF NOT EXISTS knowledge_documents (
  id SERIAL PRIMARY KEY,
  bot_id INTEGER REFERENCES bots(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  file_type VARCHAR(50), -- text, pdf, docx, etc.
  file_size INTEGER,
  status VARCHAR(20) DEFAULT 'processing', -- processing, indexed, error
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat conversations for testing and history
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  bot_id INTEGER REFERENCES bots(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  is_test BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Individual messages in conversations
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL, -- user, assistant, system
  content TEXT NOT NULL,
  tokens_used INTEGER,
  response_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analytics data for bot performance
CREATE TABLE IF NOT EXISTS bot_analytics (
  id SERIAL PRIMARY KEY,
  bot_id INTEGER REFERENCES bots(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_conversations INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  total_tokens_used INTEGER DEFAULT 0,
  avg_response_time_ms DECIMAL(10,2),
  user_satisfaction_score DECIMAL(3,2), -- 1-5 rating
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API keys and deployment settings
CREATE TABLE IF NOT EXISTS bot_settings (
  id SERIAL PRIMARY KEY,
  bot_id INTEGER REFERENCES bots(id) ON DELETE CASCADE,
  setting_key VARCHAR(100) NOT NULL,
  setting_value TEXT,
  is_encrypted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(bot_id, setting_key)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bots_user_id ON bots(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_bot_id ON knowledge_documents(bot_id);
CREATE INDEX IF NOT EXISTS idx_conversations_bot_id ON conversations(bot_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_bot_analytics_bot_id ON bot_analytics(bot_id);
CREATE INDEX IF NOT EXISTS idx_bot_analytics_date ON bot_analytics(date);
CREATE INDEX IF NOT EXISTS idx_bot_settings_bot_id ON bot_settings(bot_id);
