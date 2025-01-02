// app/api/classes/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Student {
  id: string;
  first_name: string;
  last_name: string;
}

interface ClassStudent {
  student: Student;
}

interface Class {
  id: string;
  name: string;
  description: string;
  school_id: string;
  teacher: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  students: ClassStudent[];
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const schoolId = url.searchParams.get('schoolId');
  
  console.log('Fetching classes for school:', schoolId)
  
  try {
    let query = supabase
      .from('classes')
      .select(`
        *,
        teacher:users!classes_teacher_id_fkey (
          id,
          first_name,
          last_name,
          email
        ),
        students:class_students (
          student:students (
            id,
            first_name,
            last_name
          )
        )
      `)
      .order('name')

    // Add school filter if provided
    if (schoolId) {
      query = query.eq('school_id', schoolId)
    }

    const { data: classes, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    // Transform the data to a more usable format
    const transformedClasses = classes?.map(classItem => ({
      ...classItem,
      students: classItem.students.map((cs: ClassStudent) => cs.student)
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
  try {
    const body = await request.json()
    const { name, description, teacher_id, school_id } = body

    if (!name || !teacher_id) {
      return NextResponse.json(
        { error: 'Name and teacher_id are required' }, 
        { status: 400 }
      )
    }

    const { data: newClass, error } = await supabase
      .from('classes')
      .insert([
        {
          name,
          description,
          teacher_id,
          school_id
        }
      ])
      .select(`
        *,
        teacher:users!classes_teacher_id_fkey (
          id,
          first_name,
          last_name,
          email
        ),
        students:class_students (
          student:students (
            id,
            first_name,
            last_name
          )
        )
      `)
      .single()

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    // Transform the class data
    const transformedClass = {
      ...newClass,
      students: newClass.students.map((cs: ClassStudent) => cs.student)
    }

    return NextResponse.json({ class: transformedClass })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add class' },
      { status: 500 }
    )
  }
}