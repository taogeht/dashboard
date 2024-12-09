'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Pencil, Trash2, BookOpen, School } from 'lucide-react'
import { useSupabase } from '@/components/supabase-provider'
import type { Users } from '@/lib/types/supabase'
import { AddTeacherModal } from '@/components/AddTeacherModal'
import { EditTeacherModal } from '@/components/EditTeacherModal'
import { ManageTeacherClasses } from '@/components/ManageTeacherClasses'
import { useRouter } from 'next/navigation'

// Define proper types for the response data
interface ClassData {
  id: string
  name: string
  class_students: { count: number }[]
}

interface SchoolData {
  id: string
  name: string
}

interface TeacherWithClasses extends Users {
  school: SchoolData[] | null
  classes: ClassData[] | null
}

interface TeacherData extends Users {
  school_details: {
    id: string
    name: string
  } | null
  teaching_classes: {
    id: string
    name: string
    student_count: number
  }[]
}

interface TransformedTeacher {
  id: string
  first_name: string
  last_name: string
  email: string
  role: 'teacher'
  school: SchoolData | null
  classes: ClassData[] | null
  created_at: string
  updated_at: string
  encrypted_password: string | null
}

export default function TeachersPage() {
  const { supabase } = useSupabase()
  const [teachers, setTeachers] = useState<TeacherData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<TeacherData | null>(null)
  const [managingClassesFor, setManagingClassesFor] = useState<TeacherData | null>(null)
  const router = useRouter()

  const fetchTeachers = async () => {
    try {
      setLoading(true)
      setError(null)

      // First fetch teachers with their school details
      const { data: teachersData, error: teachersError } = await supabase
        .from('users')
        .select(`
          *,
          school_details:school_id(
            id,
            name
          )
        `)
        .eq('role', 'teacher')

      if (teachersError) throw teachersError

      // Then fetch class information for each teacher
      const teachersWithClasses = await Promise.all(
        teachersData.map(async (teacher) => {
          const { data: classesData, error: classesError } = await supabase
            .from('classes')
            .select(`
              id,
              name,
              class_students (count)
            `)
            .eq('teacher_id', teacher.id)

          if (classesError) throw classesError

          return {
            ...teacher,
            teaching_classes: classesData.map(cls => ({
              id: cls.id,
              name: cls.name,
              student_count: cls.class_students?.[0]?.count || 0
            }))
          }
        })
      )

      setTeachers(teachersWithClasses)
    } catch (err) {
      console.error('Error fetching teachers:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch teachers')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTeacher = async (teacherId: string) => {
    if (!confirm('Are you sure you want to delete this teacher?')) {
      return
    }

    try {
      const response = await fetch(`/api/teachers/${teacherId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete teacher')
      }

      await fetchTeachers()
    } catch (err) {
      console.error('Error deleting teacher:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete teacher')
    }
  }

  useEffect(() => {
    fetchTeachers()
  }, [])

  if (loading) {
    return <div className="text-gray-100">Loading teachers...</div>
  }

  if (error) {
    return (
      <div className="text-red-400">
        <p>{error}</p>
        <Button 
          onClick={fetchTeachers}
          className="mt-4"
          variant="outline"
        >
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-100">Teachers</h1>
        <Button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Teacher
        </Button>
      </div>
  
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {teachers.length === 0 ? (
          <div className="col-span-full text-center text-gray-400 py-12">
            No teachers found. Add your first teacher to get started.
          </div>
        ) : (
          teachers.map((teacher) => (
            <Card key={teacher.id} className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium text-gray-200">
                  {teacher.first_name} {teacher.last_name}
                </CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-gray-400 hover:text-gray-100"
                    onClick={() => setEditingTeacher(teacher)}
                  >
                    <Pencil size={16} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-gray-400 hover:text-gray-100"
                    onClick={() => setManagingClassesFor(teacher)}
                  >
                    <BookOpen size={16} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-gray-400 hover:text-red-400"
                    onClick={() => handleDeleteTeacher(teacher.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">{teacher.email}</p>
                  <div className="flex items-center gap-2">
                    <School className="h-4 w-4 text-gray-500" />
                    <p className="text-sm text-gray-400">
                      {teacher.school_details?.name || 'No school assigned'}
                    </p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">
                      Assigned Classes
                    </h4>
                    {teacher.teaching_classes.length > 0 ? (
                      <div className="space-y-1.5">
                        {teacher.teaching_classes.map(cls => (
                          <div 
                            key={cls.id} 
                            className="text-sm text-gray-400 px-2.5 py-1.5 bg-gray-700/50 rounded-md flex items-center justify-between cursor-pointer hover:bg-gray-700"
                            onClick={() => router.push(`/dashboard/classes?selected=${cls.id}`)}
                          >
                            <span>{cls.name}</span>
                            <span className="text-xs text-gray-500">
                              {cls.student_count} students
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        No classes assigned
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
  
      <AddTeacherModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchTeachers}
      />
  
      <EditTeacherModal
        teacher={editingTeacher}
        isOpen={!!editingTeacher}
        onClose={() => setEditingTeacher(null)}
        onSuccess={fetchTeachers}
      />
  
      {managingClassesFor && (
        <ManageTeacherClasses
          teacher={managingClassesFor}
          isOpen={true}
          onClose={() => setManagingClassesFor(null)}
          onUpdate={fetchTeachers}
        />
      )}
    </div>
  )
}