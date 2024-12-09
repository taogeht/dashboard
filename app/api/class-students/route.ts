// app/api/class-students/route.ts
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

export async function DELETE(request: Request) {
  try {
    const { studentId, classId } = await request.json()
    console.log('Attempting to remove student:', studentId, 'from class:', classId)

    if (!studentId || !classId) {
      return NextResponse.json(
        { error: 'Student ID and Class ID are required' },
        { status: 400 }
      )
    }

    // Use raw SQL through RPC to bypass RLS
    const { data, error } = await adminSupabase.rpc('remove_class_enrollment', {
      p_student_id: studentId,
      p_class_id: classId
    })

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing student from class:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to remove student from class' },
      { status: 500 }
    )
  }
}