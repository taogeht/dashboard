import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
interface ClassStudent {
    student: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
    }
  }
  
  interface ClassResponse {
    id: string;
    name: string;
    teacher: {
      id: string;
      first_name: string;
      last_name: string;
    };
    class_students: ClassStudent[];
  }

export async function GET() {
    console.log('Fetching classes...')
    
    try {
const { data: classes, error } = await supabase
  .from('classes')
  .select(`
    *,
    teacher:users!classes_teacher_id_fkey (
      id,
      first_name,
      last_name
    ),
    class_students (
      student:students (
        id,
        first_name,
        last_name,
        email
      )
    )
  `) as unknown as { data: ClassResponse[], error: any }

  
      console.log('Query result:', { classes, error })
  
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
  
      // Transform the data to a more usable format
      const transformedClasses = classes?.map(classItem => ({
        ...classItem,
        students: classItem.class_students.map(cs => cs.student)
      }))
  
      return NextResponse.json({ classes: transformedClasses })
    } catch (error) {
      console.error('Server error:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to fetch classes' },
        { status: 500 }
      )
    }
  }

export async function POST(request: Request) {
  console.log('Adding new class...')
  
  try {
    const body = await request.json()
    const { name, description, teacher_id } = body

    if (!name || !teacher_id) {
      return NextResponse.json({ error: 'Name and teacher_id are required' }, { status: 400 })
    }

    console.log('Received data:', { name, description, teacher_id })

    const { data: newClass, error } = await supabase
      .from('classes')
      .insert([
        {
          name,
          description,
          teacher_id
        }
      ])
      .select()
      .single()

    console.log('Insert result:', { newClass, error })

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    return NextResponse.json({ class: newClass })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add class' },
      { status: 500 }
    )
  }
}