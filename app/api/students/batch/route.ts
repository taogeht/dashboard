import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    const csvText = await file.text()
    const rows = csvText.split('\n').slice(1) // Skip header row
    const students = []

    for (const row of rows) {
      if (!row.trim()) continue // Skip empty rows
      
      const [first_name, last_name] = row.split(',').map(field => field.trim())
      
      // Skip rows without first name
      if (!first_name) continue

      // Create student object with just name fields
      const student = {
        first_name,
        last_name: last_name || '-' // Provide default value for last_name
      }

      students.push(student)
    }

    if (students.length === 0) {
      return NextResponse.json(
        { error: 'No valid students found in CSV' },
        { status: 400 }
      )
    }

    console.log('Attempting to insert students:', students)

    // Insert students into database
    const { data, error } = await adminSupabase
      .from('students')
      .insert(students)
      .select()

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    return NextResponse.json({ 
      success: true, 
      studentsAdded: students.length,
      students: data
    })
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload students' },
      { status: 500 }
    )
  }
}