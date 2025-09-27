/**
 * Configuration validation system to ensure all required environment variables are set
 */

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface RequiredConfig {
  key: string
  required: boolean
  description: string
  defaultValue?: string
  sensitive?: boolean
}

export const REQUIRED_ENV_VARS: RequiredConfig[] = [
  {
    key: 'DATABASE_URL',
    required: true,
    description: 'PostgreSQL database connection string',
    sensitive: true
  },
  {
    key: 'OPENAI_API_KEY',
    required: true,
    description: 'OpenAI API key for GPT models',
    sensitive: true
  },
  {
    key: 'PINECONE_API_KEY',
    required: true,
    description: 'Pinecone vector database API key',
    sensitive: true
  },
  {
    key: 'NEXTAUTH_SECRET',
    required: true,
    description: 'NextAuth.js authentication secret',
    sensitive: true
  },
  {
    key: 'NEXTAUTH_URL',
    required: true,
    description: 'NextAuth.js base URL',
    defaultValue: 'http://localhost:3000'
  },
  {
    key: 'NEXT_PUBLIC_APP_URL',
    required: false,
    description: 'Public application URL',
    defaultValue: 'http://localhost:3000'
  },
  {
    key: 'PINECONE_INDEX_NAME',
    required: false,
    description: 'Pinecone index name',
    defaultValue: 'chatbot'
  },
  {
    key: 'PINECONE_CLOUD',
    required: false,
    description: 'Pinecone cloud provider',
    defaultValue: 'aws'
  },
  {
    key: 'PINECONE_REGION',
    required: false,
    description: 'Pinecone region',
    defaultValue: 'us-east-1'
  },
  {
    key: 'PINECONE_EMBEDDING_MODEL',
    required: false,
    description: 'Embedding model for Pinecone',
    defaultValue: 'text-embedding-3-small'
  },
  {
    key: 'DEEPSEEK_API_KEY',
    required: false,
    description: 'DeepSeek API key (if using DeepSeek models)',
    sensitive: true
  },
  {
    key: 'GOOGLE_CLIENT_ID',
    required: false,
    description: 'Google OAuth client ID',
    sensitive: true
  },
  {
    key: 'GOOGLE_CLIENT_SECRET',
    required: false,
    description: 'Google OAuth client secret',
    sensitive: true
  }
]

export class ConfigValidator {
  /**
   * Validate all environment variables
   */
  static validate(): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    for (const config of REQUIRED_ENV_VARS) {
      const value = process.env[config.key]

      if (config.required && (!value || value.trim() === '')) {
        errors.push(`❌ Missing required environment variable: ${config.key} (${config.description})`)
      } else if (!value && config.defaultValue) {
        warnings.push(`⚠️ Using default value for ${config.key}: ${config.defaultValue}`)
      } else if (!value) {
        warnings.push(`⚠️ Optional environment variable not set: ${config.key} (${config.description})`)
      }

      // Check for placeholder values
      if (value && this.isPlaceholderValue(value)) {
        errors.push(`❌ Placeholder value detected for ${config.key}. Please set a real value.`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Check if a value looks like a placeholder
   */
  private static isPlaceholderValue(value: string): boolean {
    const placeholders = [
      'your_',
      'your-',
      'change-this',
      'placeholder',
      'example',
      'test-key',
      'dummy',
      'sk-your-',
      'pcsk_your-'
    ]

    return placeholders.some(placeholder => 
      value.toLowerCase().includes(placeholder.toLowerCase())
    )
  }

  /**
   * Print validation results
   */
  static printValidationResults(result: ValidationResult): void {
    console.log('\n🔍 Configuration Validation Results:')
    console.log('=====================================')

    if (result.isValid) {
      console.log('✅ All required configuration is valid!')
    } else {
      console.log('❌ Configuration validation failed!')
      result.errors.forEach(error => console.log(error))
    }

    if (result.warnings.length > 0) {
      console.log('\nWarnings:')
      result.warnings.forEach(warning => console.log(warning))
    }

    console.log('=====================================\n')
  }

  /**
   * Get environment summary (with sensitive values masked)
   */
  static getEnvironmentSummary(): Record<string, string> {
    const summary: Record<string, string> = {}

    for (const config of REQUIRED_ENV_VARS) {
      const value = process.env[config.key]
      
      if (config.sensitive && value) {
        // Mask sensitive values
        summary[config.key] = `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
      } else {
        summary[config.key] = value || config.defaultValue || 'Not set'
      }
    }

    return summary
  }

  /**
   * Startup validation - throws error if critical config is missing
   */
  static validateStartup(): void {
    const result = this.validate()
    
    if (!result.isValid) {
      this.printValidationResults(result)
      throw new Error('Configuration validation failed. Please check your environment variables.')
    }

    if (result.warnings.length > 0 && process.env.NODE_ENV !== 'production') {
      this.printValidationResults(result)
    }
  }
}

// Auto-validate in development mode
if (process.env.NODE_ENV === 'development') {
  try {
    ConfigValidator.validateStartup()
  } catch (error) {
    console.error('Configuration validation failed:', error.message)
  }
}
