# Comprehensive Hardcode Analysis & Solutions

## 🔍 **CRITICAL HARDCODED VALUES FOUND**

### 1. **🚨 HARDCODED API KEYS & SECRETS**

#### **DeepSeek API Key** - CRITICAL
```javascript
// lib/deepseek-api.ts - LINE 37
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "sk-f1ff59dc5a8c42fb850267e784b1864a"
```
**Risk**: API key exposed in code

#### **Pinecone API Key** - CRITICAL
```javascript
// lib/config.ts - LINE 15
apiKey: process.env.PINECONE_API_KEY || "pcsk_4w6uv3_EKThZtWRWMFUDzKKS5mncjXN7AWHp2pQRQWFHH2Jfgy3nYZ3T55kWLfu519Bz5V"
```
**Risk**: API key exposed in code

#### **Google Client Credentials** - EXPOSED IN .ENV
```
GOOGLE_CLIENT_ID=39350655117-h6hqjvv7n4m6231u6cmerfmlllh4on49.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```
**Risk**: OAuth credentials exposed

### 2. **🚨 HARDCODED BOT/USER IDs**

#### **Bot ID 11** - Multiple files
- `process-all-uploads-to-pinecone.js` - Line 29: `const botId = 11;`
- `clear-pinecone-and-store-documents.js` - Line 42: `?botId=11`
- `check-and-fix-document.js` - Line 11: `where: { bot_id: 11 }`
- `debug-pinecone-search.js` - Line 47: `botId: { $eq: 11 }`

#### **Bot ID 25** - Debug files
- `debug-pinecone-upload.js` - Line 58: `formData.append('botId', '25')`

#### **User IDs** - Test files
- `verify-pinecone-working.js` - Multiple hardcoded user IDs: 1, 3

### 3. **🚨 HARDCODED CONFIGURATION VALUES**

#### **Pinecone Index Settings**
```javascript
// lib/config.ts
indexName: "chatbot",           // Should be configurable
cloud: "aws",                   // Should be configurable  
region: "us-east-1",           // Should be configurable
```

#### **Database Configurations**
```javascript
// Multiple hardcoded model defaults
model: "gpt-4o-mini",          // In multiple places
defaultModel: 'gpt-4o-mini',   // lib/config.ts
```

### 4. **🚨 DEVELOPMENT/TEST DATA**

#### **Mock Data with Hardcoded IDs**
- `lib/mock-data.ts` - Hardcoded bot IDs 1, 2, 3
- `scripts/seed-database.js` - Hardcoded bot creation with specific IDs
- `scripts/02-seed-data.sql` - Hardcoded INSERT statements

#### **Test File References**
- HTML test files with hardcoded bot IDs (23, 5, 11)
- Documentation with specific bot/user ID examples

## 🔧 **COMPREHENSIVE SOLUTION**

### **Phase 1: Remove Critical Security Issues**
1. Remove all hardcoded API keys
2. Move all secrets to environment variables only
3. Add validation for required environment variables

### **Phase 2: Dynamic Configuration System**
1. Create dynamic bot/user selection
2. Make Pinecone configuration environment-based
3. Remove hardcoded IDs from all scripts

### **Phase 3: Environment Validation**
1. Add startup validation for all required environment variables
2. Create configuration validation system
3. Add fallback handling for missing configs

## 🚀 **IMMEDIATE ACTIONS REQUIRED**

### **1. Security Fixes** (URGENT)
- Remove hardcoded API keys from code
- Regenerate exposed API keys
- Update OAuth credentials

### **2. Dynamic System** (HIGH PRIORITY)
- Replace hardcoded bot/user IDs with dynamic selection
- Make configuration environment-driven
- Add proper error handling

### **3. Validation System** (MEDIUM PRIORITY)
- Add environment variable validation
- Create configuration checks
- Implement graceful fallbacks
