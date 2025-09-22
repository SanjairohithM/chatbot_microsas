-- Adding dummy data for development and testing
-- Insert dummy users
INSERT INTO users (email, password_hash, name) VALUES
('john@example.com', '$2b$10$dummy.hash.for.testing', 'John Doe'),
('jane@example.com', '$2b$10$dummy.hash.for.testing', 'Jane Smith'),
('admin@example.com', '$2b$10$dummy.hash.for.testing', 'Admin User')
ON CONFLICT (email) DO NOTHING;

-- Insert dummy bots
INSERT INTO bots (user_id, name, description, system_prompt, model, temperature, max_tokens, status, is_deployed, deployment_url) VALUES
(1, 'Customer Support Bot', 'Handles customer inquiries and support tickets', 'You are a helpful customer support assistant. Be polite, professional, and try to resolve customer issues efficiently.', 'gpt-3.5-turbo', 0.7, 1000, 'active', true, 'https://bot1.example.com'),
(1, 'Sales Assistant', 'Helps with product recommendations and sales inquiries', 'You are a knowledgeable sales assistant. Help customers find the right products and answer their questions about features and pricing.', 'gpt-4', 0.5, 800, 'active', false, null),
(1, 'FAQ Bot', 'Answers frequently asked questions', 'You are an FAQ bot. Provide clear, concise answers to common questions about our products and services.', 'gpt-3.5-turbo', 0.3, 500, 'draft', false, null),
(2, 'Technical Support', 'Provides technical assistance and troubleshooting', 'You are a technical support specialist. Help users troubleshoot technical issues with detailed, step-by-step instructions.', 'gpt-4', 0.6, 1200, 'active', true, 'https://techbot.example.com'),
(2, 'HR Assistant', 'Handles HR-related queries and employee support', 'You are an HR assistant. Help employees with HR policies, benefits, and general workplace questions.', 'gpt-3.5-turbo', 0.7, 800, 'inactive', false, null);

-- Insert dummy knowledge documents
INSERT INTO knowledge_documents (bot_id, title, content, file_type, file_size, status) VALUES
(1, 'Product Catalog', 'Our comprehensive product catalog includes laptops, desktops, accessories, and software solutions. Each product comes with detailed specifications, pricing, and availability information.', 'text', 1024, 'indexed'),
(1, 'Return Policy', 'We offer a 30-day return policy for all products. Items must be in original condition with all packaging and accessories included.', 'text', 512, 'indexed'),
(1, 'Shipping Information', 'We offer free shipping on orders over $50. Standard shipping takes 3-5 business days, expedited shipping takes 1-2 business days.', 'text', 256, 'indexed'),
(2, 'Sales Playbook', 'Our sales methodology focuses on understanding customer needs, presenting relevant solutions, and building long-term relationships.', 'pdf', 2048, 'indexed'),
(2, 'Pricing Guide', 'Comprehensive pricing information for all products and services, including volume discounts and promotional offers.', 'text', 1536, 'indexed'),
(4, 'Technical Documentation', 'Complete technical documentation covering installation, configuration, troubleshooting, and best practices.', 'docx', 4096, 'indexed'),
(4, 'API Reference', 'Detailed API documentation with endpoints, parameters, examples, and error codes.', 'text', 3072, 'indexed');

-- Insert dummy conversations
INSERT INTO conversations (bot_id, user_id, title, is_test) VALUES
(1, 1, 'Product inquiry about laptops', false),
(1, 1, 'Return request assistance', false),
(1, 1, 'Test conversation', true),
(2, 1, 'Sales demo request', false),
(4, 2, 'API integration help', false),
(4, 2, 'Testing new features', true);

-- Insert dummy messages
INSERT INTO messages (conversation_id, role, content, tokens_used, response_time_ms) VALUES
(1, 'user', 'Hi, I am looking for a gaming laptop under $1500', 25, null),
(1, 'assistant', 'I would be happy to help you find a gaming laptop under $1500. Based on our current inventory, I recommend the following options: 1) Gaming Pro X15 - $1299, 2) PowerBook Gaming - $1399. Both offer excellent performance for gaming.', 45, 850),
(1, 'user', 'What are the specs of the Gaming Pro X15?', 12, null),
(1, 'assistant', 'The Gaming Pro X15 features: Intel i7 processor, 16GB RAM, NVIDIA RTX 3060 graphics card, 512GB SSD, 15.6" 144Hz display, and RGB backlit keyboard. It is perfect for modern gaming and content creation.', 38, 720),
(2, 'user', 'I need to return a product I bought last week', 15, null),
(2, 'assistant', 'I can help you with your return. Our return policy allows returns within 30 days of purchase. Could you please provide your order number so I can look up the details?', 32, 650),
(3, 'user', 'This is a test message', 8, null),
(3, 'assistant', 'This is a test response from the customer support bot.', 12, 500);

-- Insert dummy analytics data
INSERT INTO bot_analytics (bot_id, date, total_conversations, total_messages, total_tokens_used, avg_response_time_ms, user_satisfaction_score) VALUES
(1, CURRENT_DATE - INTERVAL '7 days', 15, 45, 2250, 750.5, 4.2),
(1, CURRENT_DATE - INTERVAL '6 days', 18, 52, 2600, 680.3, 4.5),
(1, CURRENT_DATE - INTERVAL '5 days', 22, 68, 3400, 720.8, 4.3),
(1, CURRENT_DATE - INTERVAL '4 days', 19, 58, 2900, 695.2, 4.4),
(1, CURRENT_DATE - INTERVAL '3 days', 25, 75, 3750, 710.6, 4.6),
(1, CURRENT_DATE - INTERVAL '2 days', 21, 63, 3150, 665.4, 4.5),
(1, CURRENT_DATE - INTERVAL '1 day', 28, 84, 4200, 690.7, 4.7),
(2, CURRENT_DATE - INTERVAL '7 days', 8, 24, 1920, 850.2, 4.0),
(2, CURRENT_DATE - INTERVAL '6 days', 12, 36, 2880, 780.5, 4.2),
(2, CURRENT_DATE - INTERVAL '5 days', 10, 30, 2400, 820.3, 4.1),
(4, CURRENT_DATE - INTERVAL '7 days', 5, 15, 1800, 950.8, 4.3),
(4, CURRENT_DATE - INTERVAL '6 days', 7, 21, 2520, 890.4, 4.4),
(4, CURRENT_DATE - INTERVAL '5 days', 6, 18, 2160, 920.6, 4.2);

-- Insert dummy bot settings
INSERT INTO bot_settings (bot_id, setting_key, setting_value, is_encrypted) VALUES
(1, 'welcome_message', 'Hello! I am your customer support assistant. How can I help you today?', false),
(1, 'max_conversation_length', '50', false),
(1, 'enable_handoff', 'true', false),
(2, 'welcome_message', 'Hi there! I am your sales assistant. What products are you interested in?', false),
(2, 'lead_qualification', 'true', false),
(4, 'welcome_message', 'Welcome to technical support. Please describe your issue and I will help you resolve it.', false),
(4, 'escalation_threshold', '3', false);
