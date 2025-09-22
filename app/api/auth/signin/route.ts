import { NextRequest, NextResponse } from 'next/server'
import { ServerUserService } from '@/lib/server-database'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const user = await ServerUserService.validatePassword(email, password)
    if (!user) {
      throw new Error("Invalid email or password")
    }

    return NextResponse.json({
      success: true,
      user,
    })

  } catch (error) {
    console.error('Sign in error:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Sign in failed',
      },
      { status: 401 }
    )
  }
}
