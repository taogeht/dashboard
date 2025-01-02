// app/api/schools/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' }, 
        { status: 401 }
      )
    }

    // All authenticated users can read schools, so we remove the super_admin check
    const { data: schools, error } = await supabase
      .from('schools')
      .select(`
        *,
        users:users(count),
        classes:classes(count),
        students:students(count)
      `)
      .order('name')

    if (error) throw error

    return NextResponse.json({ schools })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schools' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    const { name, address } = await request.json()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Verify user is super_admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      )
    }

    const { data, error } = await supabase
      .from('schools')
      .insert({ name, address })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ school: data })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to create school' },
      { status: 500 }
    )
  }
}