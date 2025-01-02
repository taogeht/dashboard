// app/api/teachers/[id]/route.ts
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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Deleting teacher with ID:', params.id)

    // First remove teacher from any classes
    const { error: classUpdateError } = await adminSupabase
      .from('classes')
      .update({ teacher_id: null })
      .eq('teacher_id', params.id)

    if (classUpdateError) {
      console.error('Error updating classes:', classUpdateError)
      throw classUpdateError
    }

    // Delete from users table
    const { error: userError } = await adminSupabase
      .from('users')
      .delete()
      .eq('id', params.id)

    if (userError) {
      console.error('Error deleting from users table:', userError)
      throw userError
    }

    // Delete from auth.users
    const { error: authError } = await adminSupabase.auth.admin.deleteUser(
      params.id
    )

    if (authError) {
      console.error('Error deleting from auth:', authError)
      throw authError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete teacher' },
      { status: 500 }
    )
  }
}