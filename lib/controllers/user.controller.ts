import { NextRequest } from 'next/server'
import { UserService, type CreateUserRequest, type UpdateUserRequest } from '../services/user.service'
import { ApiResponse } from '../utils/api-response'
import { validateRequest, ValidationRules } from '../middleware/validation'

export class UserController {
  /**
   * Create a new user (signup)
   */
  static async createUser(request: NextRequest) {
    try {
      const userData = await request.json()

      // Validate request
      const validation = validateRequest({
        email: ValidationRules.email,
        password: ValidationRules.password,
        name: ValidationRules.name
      }, userData)

      if (!validation.isValid) {
        return ApiResponse.badRequest('Validation failed', validation.errors)
      }

      const user = await UserService.createUser(userData as CreateUserRequest)

      return ApiResponse.success('User created successfully', user)
    } catch (error) {
      console.error('UserController.createUser error:', error)
      return ApiResponse.internalServerError(
        error instanceof Error ? error.message : 'Failed to create user'
      )
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(request: NextRequest, { params }: { params: { id: string } }) {
    try {
      const id = parseInt(params.id)

      if (isNaN(id)) {
        return ApiResponse.badRequest('Invalid user ID')
      }

      const user = await UserService.getUserById(id)

      if (!user) {
        return ApiResponse.notFound('User not found')
      }

      return ApiResponse.success('User retrieved successfully', user)
    } catch (error) {
      console.error('UserController.getUserById error:', error)
      return ApiResponse.internalServerError('Failed to retrieve user')
    }
  }

  /**
   * Update user
   */
  static async updateUser(request: NextRequest, { params }: { params: { id: string } }) {
    try {
      const id = parseInt(params.id)

      if (isNaN(id)) {
        return ApiResponse.badRequest('Invalid user ID')
      }

      const updates = await request.json()

      // Validate updates
      const validation = validateRequest({
        name: { type: 'string', minLength: 1, maxLength: 255 },
        email: { type: 'string', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
        password: { type: 'string', minLength: 6, maxLength: 100 }
      }, updates)

      if (!validation.isValid) {
        return ApiResponse.badRequest('Validation failed', validation.errors)
      }

      const user = await UserService.updateUser(id, updates as UpdateUserRequest)

      if (!user) {
        return ApiResponse.notFound('User not found')
      }

      return ApiResponse.success('User updated successfully', user)
    } catch (error) {
      console.error('UserController.updateUser error:', error)
      return ApiResponse.internalServerError(
        error instanceof Error ? error.message : 'Failed to update user'
      )
    }
  }

  /**
   * Delete user
   */
  static async deleteUser(request: NextRequest, { params }: { params: { id: string } }) {
    try {
      const id = parseInt(params.id)

      if (isNaN(id)) {
        return ApiResponse.badRequest('Invalid user ID')
      }

      const success = await UserService.deleteUser(id)

      if (!success) {
        return ApiResponse.notFound('User not found')
      }

      return ApiResponse.success('User deleted successfully')
    } catch (error) {
      console.error('UserController.deleteUser error:', error)
      return ApiResponse.internalServerError('Failed to delete user')
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStats(request: NextRequest, { params }: { params: { id: string } }) {
    try {
      const id = parseInt(params.id)

      if (isNaN(id)) {
        return ApiResponse.badRequest('Invalid user ID')
      }

      // Check if user exists
      const user = await UserService.getUserById(id)
      if (!user) {
        return ApiResponse.notFound('User not found')
      }

      const stats = await UserService.getUserStats(id)

      return ApiResponse.success('User statistics retrieved successfully', stats)
    } catch (error) {
      console.error('UserController.getUserStats error:', error)
      return ApiResponse.internalServerError('Failed to retrieve user statistics')
    }
  }

  /**
   * Authenticate user (login)
   */
  static async authenticateUser(request: NextRequest) {
    try {
      const { email, password } = await request.json()

      // Validate request
      const validation = validateRequest({
        email: ValidationRules.email,
        password: ValidationRules.password
      }, { email, password })

      if (!validation.isValid) {
        return ApiResponse.badRequest('Validation failed', validation.errors)
      }

      const user = await UserService.validatePassword(email, password)

      if (!user) {
        return ApiResponse.unauthorized('Invalid email or password')
      }

      return ApiResponse.success('Authentication successful', user)
    } catch (error) {
      console.error('UserController.authenticateUser error:', error)
      return ApiResponse.internalServerError('Authentication failed')
    }
  }
}
