// hooks/useClasses.ts
import { useState, useEffect } from 'react'
import { useSupabase } from '@/components/supabase-provider'
import { Classes, Students } from '@/lib/types/supabase'

interface ClassWithStudents extends Classes {
  students?: Students[]
}

interface ClassResponse extends Classes {
  students: {
    student: {
      id: string
      first_name: string
      last_name: string
      email: string
    }
  }[]
}

interface TransformedClass extends Omit<Classes, 'students'> {
  students?: Students[]
}

export function useClasses() {
  const { supabase } = useSupabase()
  const [classes, setClasses] = useState<TransformedClass[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClasses = async () => {
    try {
      setLoading(true)
      
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select(`
          *,
          students:class_students(
            student:students(
              id,
              first_name,
              last_name,
              email
            )
          )
        `)

      if (classesError) {
        throw classesError
      }

      const transformedClasses = (classesData as ClassResponse[]).map(classData => ({
        ...classData,
        students: classData.students.map(s => s.student)
      }))

      setClasses(transformedClasses)
    } catch (err) {
      console.error('Error fetching classes:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch classes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClasses()
  }, [])

  const addClass = async (newClass: Omit<Classes, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .insert(newClass)
        .select()
        .single()

      if (error) throw error

      setClasses(prev => [...prev, data])
      return data
    } catch (err) {
      console.error('Error adding class:', err)
      throw err
    }
  }

  const updateClass = async (id: string, updates: Partial<Omit<Classes, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      setClasses(prev => 
        prev.map(c => c.id === id ? { ...c, ...data } : c)
      )
      return data
    } catch (err) {
      console.error('Error updating class:', err)
      throw err
    }
  }

  return {
    classes,
    loading,
    error,
    refetch: fetchClasses,
    addClass,
    updateClass
  }
}