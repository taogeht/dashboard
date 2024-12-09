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

type RouteParams = {
  params: {
    id: string
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  const teacherId = params.id
  console.log('Attempting to delete teacher:', teacherId)

  try {
    // First check if user exists
    const { data: user, error: userCheckError } = await adminSupabase
      .from('users')
      .select()
      .eq('id', teacherId)
      .single()

    if (userCheckError || !user) {
      console.error('User check error:', userCheckError)
      return NextResponse.json(
        { error: 'Teacher not found' },
        { status: 404 }
      )
    }

    // Update any classes to remove this teacher
    const { error: classUpdateError } = await adminSupabase
      .from('classes')
      .update({ teacher_id: null })
      .eq('teacher_id', teacherId)

    if (classUpdateError) {
      console.error('Class update error:', classUpdateError)
      return NextResponse.json(
        { error: 'Failed to update classes' },
        { status: 500 }
      )
    }

    // Delete the user record
    const { error: deleteError } = await adminSupabase
      .from('users')
      .delete()
      .eq('id', teacherId)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete teacher' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { firstName, lastName, email } = await request.json()

    const { error } = await adminSupabase
      .from('users')
      .update({
        first_name: firstName,
        last_name: lastName,
        email: email,
      })
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update teacher' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // First, let's just get teachers with their classes
    const { data: teachers, error } = await adminSupabase
      .from('users')
      .select(`
        id, 
        first_name, 
        last_name, 
        email,
        classes (
          id,
          name
        )
      `)
      .eq('role', 'teacher')

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ teachers })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch teachers' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { firstName, lastName, email, password, schoolId } = await request.json()

    // 1. Create auth user
    const { data: authData, error: signUpError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (signUpError) {
      console.error('Auth creation error:', signUpError)
      return NextResponse.json({ error: signUpError.message }, { status: 400 })
    }

    // 2. Add user to users table
    const { error: userError } = await adminSupabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        role: 'teacher',
        school_id: schoolId
      })

    if (userError) {
      console.error('User creation error:', userError)
      // Clean up auth user if profile creation fails
      await adminSupabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: userError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, user: authData.user })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create teacher' },
      { status: 500 }
    )
  }
}