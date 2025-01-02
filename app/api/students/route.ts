import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET() {
  try {
    const { data: students, error } = await adminSupabase
      .from('students')
      .select('*')
      .order('last_name')

    if (error) throw error

    return NextResponse.json({ students })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch students' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { first_name, last_name } = body

    if (!first_name?.trim()) {
      return NextResponse.json(
        { error: 'First name is required' },
        { status: 400 }
      )
    }

    // Create the student record with just name fields
    const studentData = {
      first_name: first_name.trim(),
      last_name: last_name?.trim() || '-'
    }

    console.log('Processing student data:', studentData)

    const { data: student, error } = await adminSupabase
      .from('students')
      .insert([studentData])
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    return NextResponse.json({ student })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add student' },
      { status: 500 }
    )
  }
}