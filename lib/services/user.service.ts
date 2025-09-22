import { db } from '../db'
import bcrypt from 'bcryptjs'
import type { User } from '../types'

export interface CreateUserRequest {
  email: string
  password: string
  name: string
}

export interface UpdateUserRequest {
  name?: string
  email?: string
  password?: string
}

export class UserService {
  /**
   * Create a new user
   */
  static async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      // Check if user already exists
      const existingUser = await db.user.findUnique({
        where: { email: userData.email }
      })

      if (existingUser) {
        throw new Error('User with this email already exists')
      }

      // Hash password
      const password_hash = await bcrypt.hash(userData.password, 12)

      // Create user
      const user = await db.user.create({
        data: {
          email: userData.email,
          password_hash,
          name: userData.name,
        },
      })

      return this.mapUserToResponse(user)
    } catch (error) {
      console.error('UserService.createUser error:', error)
      throw error
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: number): Promise<User | null> {
    try {
      const user = await db.user.findUnique({
        where: { id }
      })

      if (!user) {
        return null
      }

      return this.mapUserToResponse(user)
    } catch (error) {
      console.error('UserService.getUserById error:', error)
      throw error
    }
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await db.user.findUnique({
        where: { email }
      })

      if (!user) {
        return null
      }

      return this.mapUserToResponse(user)
    } catch (error) {
      console.error('UserService.getUserByEmail error:', error)
      throw error
    }
  }

  /**
   * Validate user password
   */
  static async validatePassword(email: string, password: string): Promise<User | null> {
    try {
      const user = await db.user.findUnique({
        where: { email }
      })

      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return null
      }

      return this.mapUserToResponse(user)
    } catch (error) {
      console.error('UserService.validatePassword error:', error)
      throw error
    }
  }

  /**
   * Update user
   */
  static async updateUser(id: number, updates: UpdateUserRequest): Promise<User | null> {
    try {
      // Check if user exists
      const existingUser = await db.user.findUnique({
        where: { id }
      })

      if (!existingUser) {
        return null
      }

      // Check if email is being updated and if it's already taken
      if (updates.email && updates.email !== existingUser.email) {
        const emailExists = await db.user.findUnique({
          where: { email: updates.email }
        })

        if (emailExists) {
          throw new Error('Email is already taken')
        }
      }

      // Prepare update data
      const updateData: any = {}
      
      if (updates.name) {
        updateData.name = updates.name.trim()
      }
      
      if (updates.email) {
        updateData.email = updates.email.trim()
      }
      
      if (updates.password) {
        updateData.password_hash = await bcrypt.hash(updates.password, 12)
      }

      // Update user
      const user = await db.user.update({
        where: { id },
        data: updateData
      })

      return this.mapUserToResponse(user)
    } catch (error) {
      console.error('UserService.updateUser error:', error)
      throw error
    }
  }

  /**
   * Delete user
   */
  static async deleteUser(id: number): Promise<boolean> {
    try {
      // Check if user exists
      const existingUser = await db.user.findUnique({
        where: { id }
      })

      if (!existingUser) {
        return false
      }

      // Delete user (cascade will handle related records)
      await db.user.delete({
        where: { id }
      })

      return true
    } catch (error) {
      console.error('UserService.deleteUser error:', error)
      throw error
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStats(userId: number): Promise<{
    totalBots: number
    activeBots: number
    totalConversations: number
    totalMessages: number
  }> {
    try {
      const [bots, conversations, messages] = await Promise.all([
        db.bot.count({
          where: { user_id: userId }
        }),
        db.bot.count({
          where: { 
            user_id: userId,
            status: 'active'
          }
        }),
        db.conversation.count({
          where: { user_id: userId }
        }),
        db.message.count({
          where: {
            conversation: {
              user_id: userId
            }
          }
        })
      ])

      return {
        totalBots: bots,
        activeBots: conversations,
        totalConversations: conversations,
        totalMessages: messages
      }
    } catch (error) {
      console.error('UserService.getUserStats error:', error)
      throw error
    }
  }

  /**
   * Map database user to response format
   */
  private static mapUserToResponse(user: any): User {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      created_at: user.created_at.toISOString(),
    }
  }
}
