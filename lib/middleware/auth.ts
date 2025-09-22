import { NextRequest } from 'next/server'
import { ApiResponse } from '../utils/api-response'
import { db } from '../db'

export interface AuthenticatedUser {
  id: number
  email: string
  name: string
}

export interface AuthRequest extends NextRequest {
  user?: AuthenticatedUser
}

/**
 * Extract user from request headers or session
 * This is a placeholder - implement based on your auth strategy
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    // Option 1: JWT Token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      // TODO: Verify JWT token and extract user info
      // const decoded = jwt.verify(token, process.env.JWT_SECRET)
      // return await getUserById(decoded.userId)
    }

    // Option 2: Session-based auth (if using sessions)
    const sessionId = request.cookies.get('session')?.value
    if (sessionId) {
      // TODO: Verify session and get user
      // const session = await getSession(sessionId)
      // return session?.user
    }

    // Option 3: API Key authentication
    const apiKey = request.headers.get('x-api-key')
    if (apiKey) {
      // TODO: Verify API key and get associated user
      // const user = await getUserByApiKey(apiKey)
      // return user
    }

    return null
  } catch (error) {
    console.error('Authentication error:', error)
    return null
  }
}

/**
 * Middleware to require authentication
 */
export async function requireAuth(request: NextRequest): Promise<AuthenticatedUser | NextResponse> {
  const user = await authenticateRequest(request)
  
  if (!user) {
    return ApiResponse.unauthorized('Authentication required')
  }

  return user
}

/**
 * Middleware to require specific user role
 */
export async function requireRole(
  request: NextRequest, 
  allowedRoles: string[]
): Promise<AuthenticatedUser | NextResponse> {
  const authResult = await requireAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult
  }

  // TODO: Implement role checking
  // const userRoles = await getUserRoles(authResult.id)
  // const hasRequiredRole = userRoles.some(role => allowedRoles.includes(role))
  
  // if (!hasRequiredRole) {
  //   return ApiResponse.forbidden('Insufficient permissions')
  // }

  return authResult
}

/**
 * Check if user owns the resource
 */
export async function requireOwnership(
  request: NextRequest,
  resourceType: 'bot' | 'conversation' | 'document',
  resourceId: number
): Promise<AuthenticatedUser | NextResponse> {
  const authResult = await requireAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    let isOwner = false

    switch (resourceType) {
      case 'bot':
        const bot = await db.bot.findUnique({
          where: { id: resourceId },
          select: { user_id: true }
        })
        isOwner = bot?.user_id === authResult.id
        break

      case 'conversation':
        const conversation = await db.conversation.findUnique({
          where: { id: resourceId },
          select: { user_id: true }
        })
        isOwner = conversation?.user_id === authResult.id
        break

      case 'document':
        const document = await db.knowledgeDocument.findUnique({
          where: { id: resourceId },
          include: {
            bot: {
              select: { user_id: true }
            }
          }
        })
        isOwner = document?.bot.user_id === authResult.id
        break

      default:
        return ApiResponse.badRequest('Invalid resource type')
    }

    if (!isOwner) {
      return ApiResponse.forbidden('You do not have permission to access this resource')
    }

    return authResult
  } catch (error) {
    console.error('Ownership check error:', error)
    return ApiResponse.internalServerError('Failed to verify resource ownership')
  }
}

/**
 * Rate limiting middleware (basic implementation)
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): boolean {
  const now = Date.now()
  const key = identifier
  const current = rateLimitMap.get(key)

  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (current.count >= maxRequests) {
    return false
  }

  current.count++
  return true
}

/**
 * Apply rate limiting to request
 */
export function applyRateLimit(request: NextRequest): NextResponse | null {
  const identifier = request.ip || 'unknown'
  
  if (!rateLimit(identifier)) {
    return ApiResponse.custom(429, 'Too many requests', undefined, {
      rateLimit: ['Rate limit exceeded. Please try again later.']
    })
  }

  return null
}
