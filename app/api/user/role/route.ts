// app/api/user/role/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Valid role types
const validRoles = ['teacher', 'school_admin', 'super_admin'] as const
type UserRole = typeof validRoles[number]

export async function GET(request: Request) {
  try {
    // Get the user ID from the URL
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const { data, error } = await adminSupabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching role:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Validate the role
    if (!validRoles.includes(data.role as UserRole)) {
      console.error('Invalid role found:', data.role)
      return NextResponse.json(
        { error: `Invalid role: ${data.role}` },
        { status: 400 }
      )
    }

    // Add debug logging
    console.log('User role fetched successfully:', {
      userId,
      role: data.role
    })

    return NextResponse.json({ role: data.role })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}