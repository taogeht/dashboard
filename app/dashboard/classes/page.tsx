'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Users, Pencil, Trash2 } from 'lucide-react'
import { useSupabase } from '@/components/supabase-provider'
import { useSchool } from '@/context/SchoolContext'
import type { Classes, Students } from '@/lib/types/supabase'
import { AddClassModal } from '@/components/AddClassModal'
import { EditClassModal } from '@/components/EditClassModal'

interface ClassWithStudents extends Classes {
  students: Students[]
  teacher?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
}

export default function ClassesPage() {
  const { supabase } = useSupabase()
  const { selectedSchool } = useSchool()
  const [classes, setClasses] = useState<ClassWithStudents[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingClass, setEditingClass] = useState<Classes | null>(null)
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)

  const fetchClasses = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get the current user's role and ID
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('No authenticated user')
      }
  
      // Get the user's role from the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
  
      if (userError) throw userError
  
      // Build the query based on role and selected school
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
              last_name
            )
          )
        `)
        .order('name')
  
      // If user is a teacher, only show their classes
      if (userData.role === 'teacher') {
        query = query.eq('teacher_id', user.id)
      }

      // If a school is selected, filter by school_id
      if (selectedSchool) {
        query = query.eq('school_id', selectedSchool.id)
      }
  
      const { data, error: fetchError } = await query
  
      if (fetchError) throw fetchError
  
      const transformedClasses = (data || []).map(classData => ({
        ...classData,
        teacher: classData.teacher ? classData.teacher[0] : undefined,
        students: classData.class_students.map((cs: any) => cs.student)
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
  }, [selectedSchool]) // Refetch when selected school changes

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
      </div>
    )
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
        <div className="bg-red-900/50 text-red-200 p-4 rounded-lg border border-red-800">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {classes.length === 0 ? (
          <div className="col-span-full">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  {selectedSchool ? (
                    <>
                      <p className="text-gray-400">No classes found in {selectedSchool.name}.</p>
                      <Button 
                        onClick={() => setShowAddModal(true)}
                        variant="ghost" 
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add your first class
                      </Button>
                    </>
                  ) : (
                    <p className="text-gray-400">Select a school to view its classes.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          classes.map((classItem) => (
            <Card key={classItem.id} className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium text-gray-200">
                  {classItem.name}
                </CardTitle>
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
                              onClick={() => {
                                // Handle removing student from class
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
          onClassAdded={fetchClasses}
          schoolId={selectedSchool?.id}
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