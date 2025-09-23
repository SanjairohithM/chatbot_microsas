export interface ValidationRule {
  required?: boolean
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object'
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  enum?: any[]
  custom?: (value: any) => string | null
}

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string[]>
}

export function validateRequest(
  rules: Record<string, ValidationRule>,
  data: any
): ValidationResult {
  const errors: Record<string, string[]> = {}

  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field]
    const fieldErrors: string[] = []

    // Check required
    if (rule.required && (value === undefined || value === null || value === '')) {
      fieldErrors.push(`${field} is required`)
      continue
    }

    // Skip validation if field is not provided and not required
    if (value === undefined || value === null) {
      continue
    }

    // Check type
    if (rule.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value
      if (actualType !== rule.type) {
        fieldErrors.push(`${field} must be of type ${rule.type}`)
        continue
      }
    }

    // String validations
    if (rule.type === 'string' && typeof value === 'string') {
      if (rule.minLength !== undefined && value.length < rule.minLength) {
        fieldErrors.push(`${field} must be at least ${rule.minLength} characters long`)
      }
      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        fieldErrors.push(`${field} must be at most ${rule.maxLength} characters long`)
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        fieldErrors.push(`${field} format is invalid`)
      }
    }

    // Number validations
    if (rule.type === 'number' && typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        fieldErrors.push(`${field} must be at least ${rule.min}`)
      }
      if (rule.max !== undefined && value > rule.max) {
        fieldErrors.push(`${field} must be at most ${rule.max}`)
      }
    }

    // Enum validation
    if (rule.enum && !rule.enum.includes(value)) {
      fieldErrors.push(`${field} must be one of: ${rule.enum.join(', ')}`)
    }

    // Custom validation
    if (rule.custom) {
      const customError = rule.custom(value)
      if (customError) {
        fieldErrors.push(customError)
      }
    }

    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Common validation rules
export const ValidationRules = {
  email: {
    required: true,
    type: 'string' as const,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: {
    required: true,
    type: 'string' as const,
    minLength: 6,
    maxLength: 100
  },
  name: {
    required: true,
    type: 'string' as const,
    minLength: 1,
    maxLength: 255
  },
  botName: {
    required: true,
    type: 'string' as const,
    minLength: 1,
    maxLength: 255
  },
  description: {
    type: 'string' as const,
    maxLength: 1000
  },
  systemPrompt: {
    type: 'string' as const,
    maxLength: 50000
  },
  temperature: {
    type: 'number' as const,
    min: 0,
    max: 2
  },
  maxTokens: {
    type: 'number' as const,
    min: 100,
    max: 4000
  },
  status: {
    type: 'string' as const,
    enum: ['draft', 'active', 'inactive']
  },
  model: {
    type: 'string' as const,
    enum: ['deepseek-chat', 'deepseek-coder']
  }
}
