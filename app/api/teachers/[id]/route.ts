// app/api/teachers/[id]/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('Update request for teacher:', params.id)
  
  try {
    const { firstName, lastName, email } = await request.json()
    console.log('Update data:', { firstName, lastName, email })

    // First update auth email if it changed
    const { error: authError } = await adminSupabase.auth.admin.updateUserById(
      params.id,
      { email }
    )

    if (authError) {
      console.error('Auth update error:', authError)
      throw authError
    }

    // Then update profile
    const { error: dbError } = await adminSupabase
      .from('users')
      .update({
        first_name: firstName,
        last_name: lastName,
        email: email,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)

    if (dbError) {
      console.error('Database update error:', dbError)
      throw dbError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update teacher' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Delete from auth
    const { error: authError } = await adminSupabase.auth.admin.deleteUser(
      params.id
    )

    if (authError) throw authError

    // Delete from users table
    const { error: dbError } = await adminSupabase
      .from('users')
      .delete()
      .eq('id', params.id)

    if (dbError) throw dbError

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete teacher' },
      { status: 500 }
    )
  }
}