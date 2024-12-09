// app/api/students/[id]/route.ts
// app/api/students/[id]/route.ts
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
    // Call our stored function
    const { data, error } = await adminSupabase
      .rpc('delete_student_safely', {
        p_student_id: params.id
      })

    if (error) {
      console.error('Delete operation failed:', error)
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete operation failed:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to delete student',
        details: error
      }, 
      { status: 500 }
    )
  }
}