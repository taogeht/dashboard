import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/types/supabase'


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

interface StudentWithClasses {
    id: string
    first_name: string
    last_name: string
    email: string
    class_students: {
      class: {
        id: string
        name: string
      }
    }[]
  }

// Helper function to generate a unique email
const generateEmail = (firstName: string, lastName: string = '') => {
  const base = `${firstName.toLowerCase()}${lastName ? '.' + lastName.toLowerCase() : ''}`
  const timestamp = Date.now().toString(36) // Add timestamp to ensure uniqueness
  return `${base}.${timestamp}@student.edu`
}

export async function GET(request: Request) {
    try {
      const { data, error } = await adminSupabase
        .rpc('get_students_with_classes')
  
      if (error) throw error
  
      return NextResponse.json({ 
        students: data || [] 
      })
    } catch (error) {
      console.error('Server error:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to fetch students' },
        { status: 500 }
      )
    }
  }

export async function POST(request: Request) {
  console.log('Adding new student...')
  
  try {
    const body = await request.json()
    const { first_name, last_name, email } = body

    if (!first_name?.trim()) {
      return NextResponse.json(
        { error: 'First name is required' },
        { status: 400 }
      )
    }

    // Create the student record
    const studentData: any = {
      first_name: first_name.trim(),
      // Generate email if not provided
      email: email?.trim() || generateEmail(first_name, last_name)
    }

    // Add last name if provided
    if (last_name?.trim()) {
      studentData.last_name = last_name.trim()
    }

    console.log('Processing data:', studentData)

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