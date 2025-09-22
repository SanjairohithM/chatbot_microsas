import { NextRequest, NextResponse } from 'next/server'
import { ServerUserService } from '@/lib/server-database'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await ServerUserService.findByEmail(email)
    if (existingUser) {
      throw new Error("User already exists")
    }

    const user = await ServerUserService.create(email, password, name)

    return NextResponse.json({
      success: true,
      user,
    })

  } catch (error) {
    console.error('Sign up error:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Sign up failed',
      },
      { status: 400 }
    )
  }
}
