'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Users, Pencil, Trash2 } from 'lucide-react'
import { useSupabase } from '@/components/supabase-provider'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Classes, Students } from '@/lib/types/supabase'
import { AddClassModal } from '@/components/AddClassModal'
import { EditClassModal } from '@/components/EditClassModal'

interface DatabaseStudent {
    id: string
    first_name: string
    last_name: string
    email: string
    date_of_birth: string | null
    created_at: string
    updated_at: string
  }
  
  interface DatabaseClass {
    id: string
    name: string
    description: string | null
    teacher_id: string
    created_at: string
    updated_at: string
    teacher: {
      id: string
      first_name: string
      last_name: string
      email: string
    }
    class_students: {
      student: DatabaseStudent
    }[]
  }
interface ClassWithStudentsAndTeacher extends Classes {
    teacher: {
      id: string
      first_name: string
      last_name: string
      email: string
    }
    students: Students[]
  }

interface ClassWithStudents extends Classes {
  students: Students[]
}

interface EditClassModalProps {
  classItem: Classes
  isOpen: boolean
  onClose: () => void
  onSave: (updatedClass: Classes) => void
}

interface AddClassModalProps {
  isOpen: boolean
  onClose: () => void
  onClassAdded: () => void
}

export default function ClassesPage() {
  const { supabase } = useSupabase()
  const [classes, setClasses] = useState<ClassWithStudentsAndTeacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingClass, setEditingClass] = useState<Classes | null>(null)
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
  const searchParams = new URLSearchParams(window.location.search)
  const selectedFromUrl = searchParams.get('selected')

  useEffect(() => {
    if (selectedFromUrl) {
      setSelectedClassId(selectedFromUrl)
    }
  }, [selectedFromUrl])

  const fetchClasses = async () => {
    try {
      setLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('No authenticated user')
      }
  
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
  
      if (userError) throw userError
  
      let query = supabase
        .from('classes')
        .select(`
          *,
          teacher:users!classes_teacher_id_fkey(
            id,
            first_name,
            last_name,
            email
          ),
          class_students(
            student:students(
              id,
              first_name,
              last_name,
              email
            )
          )
        `)
        .order('name')
  
      if (userData.role === 'teacher') {
        query = query.eq('teacher_id', user.id)
      }
  
      const { data, error: fetchError } = await query as { 
        data: DatabaseClass[] | null
        error: any 
      }
  
      if (fetchError) throw fetchError
      if (!data) throw new Error('No data returned')
  
      const transformedClasses: ClassWithStudentsAndTeacher[] = data.map(classData => ({
        ...classData,
        teacher: classData.teacher,
        students: classData.class_students.map(cs => cs.student)
      }))
  
      setClasses(transformedClasses)
    } catch (err) {
      console.error('Error fetching classes:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch classes')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateClass = async (updatedClass: Classes) => {
    try {
      const { error: updateError } = await supabase
        .from('classes')
        .update({
          name: updatedClass.name,
          description: updatedClass.description
        })
        .eq('id', updatedClass.id)

      if (updateError) throw updateError

      fetchClasses()
    } catch (err) {
      console.error('Error updating class:', err)
      throw err
    }
  }

  const handleDeleteClass = async (classId: string) => {
    if (!confirm('Are you sure you want to delete this class? This will remove all student enrollments.')) {
      return
    }

    try {
      // Delete the class (cascade will handle class_students)
      const { error: deleteError } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId)

      if (deleteError) throw deleteError

      setClasses(prev => prev.filter(c => c.id !== classId))
    } catch (err) {
      console.error('Error deleting class:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete class')
    }
  }

  useEffect(() => {
    fetchClasses()
  }, [])

  if (loading) {
    return <div className="text-gray-100">Loading classes...</div>
  }


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-100">Classes</h1>
        <Button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Class
        </Button>
      </div>

      {error && (
        <div className="text-red-400 text-sm">{error}</div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {classes.length === 0 ? (
          <div className="col-span-full text-center text-gray-400 py-12">
            No classes found. Add your first class to get started.
          </div>
        ) : (
          classes.map((classItem: ClassWithStudentsAndTeacher) => (

<Card key={classItem.id} className="bg-gray-800 border-gray-700">
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <div>
      <CardTitle className="text-lg font-medium text-gray-200">
        {classItem.name}
      </CardTitle>
 
    </div>
    <div className="flex gap-2">
      <Button 
        variant="ghost" 
        size="icon" 
        className="text-gray-400 hover:text-gray-100"
        onClick={() => setSelectedClassId(classItem.id === selectedClassId ? null : classItem.id)}
      >
        <Users size={16} />
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        className="text-gray-400 hover:text-gray-100"
        onClick={() => setEditingClass(classItem)}
      >
        <Pencil size={16} />
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        className="text-gray-400 hover:text-red-400"
        onClick={() => handleDeleteClass(classItem.id)}
      >
        <Trash2 size={16} />
      </Button>
    </div>
  </CardHeader>
  <CardContent>
      <div className="space-y-2">
        {classItem.description && (
          <p className="text-sm text-gray-400">{classItem.description}</p>
        )}
        {classItem.teacher && (
          <p className="text-sm text-gray-400">
            Teacher: {classItem.teacher.first_name} {classItem.teacher.last_name}
          </p>
        )}
        <p className="text-sm text-gray-400">
          {classItem.students.length} student{classItem.students.length !== 1 ? 's' : ''}
        </p>
      </div>

    {selectedClassId === classItem.id && (
  <div className="mt-4 space-y-2">
    <h3 className="text-sm font-medium text-gray-200">Enrolled Students</h3>
    {classItem.students.length === 0 ? (
      <p className="text-sm text-gray-400">No students enrolled</p>
    ) : (
      <div className="space-y-1">
        {classItem.students.map((student) => (
          <div 
            key={student.id}
            className="text-sm text-gray-400 flex justify-between items-center"
          >
            <span>{student.first_name} {student.last_name}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-gray-400 hover:text-red-400"
              onClick={async () => {
                if (!confirm('Are you sure you want to remove this student from the class?')) {
                  return;
                }

                try {
                  const response = await fetch(`/api/class-students`, {
                    method: 'DELETE',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      studentId: student.id,
                      classId: classItem.id
                    })
                  });

                  if (!response.ok) {
                    throw new Error('Failed to remove student from class');
                  }

                  // Refresh the classes data
                  fetchClasses();
                } catch (err) {
                  console.error('Error removing student from class:', err);
                  alert('Failed to remove student from class');
                }
              }}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>
    )}
  </div>
)}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {showAddModal && (
  <AddClassModal
    isOpen={showAddModal}
    onClose={() => setShowAddModal(false)}
    onClassAdded={() => {
      fetchClasses()
      setShowAddModal(false)
    }}
  />
      )}

{editingClass && (
  <EditClassModal
    classItem={editingClass}
    isOpen={true}
    onClose={() => setEditingClass(null)}
    onSave={handleUpdateClass}
  />
)}
    </div>
  )
}