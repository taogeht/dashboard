'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react'
import { useSupabase } from '@/components/supabase-provider'
import { useSchool } from '@/context/SchoolContext'
import type { Users } from '@/lib/types/supabase'
import CreateUserModal from '@/components/CreateUserModal'
import { EditTeacherModal } from '@/components/EditTeacherModal'
import { ManageTeacherClasses } from '@/components/ManageTeacherClasses'
import { useRouter } from 'next/navigation'

interface ClassData {
  id: string
  name: string
  class_students: { count: number }[]
}

interface TeacherWithClasses extends Users {
  classes: ClassData[] | null
}

interface TransformedTeacher {
  id: string
  first_name: string
  last_name: string
  email: string
  role: 'teacher'
  school_id: string | null
  classes: ClassData[] | null
  created_at: string
  updated_at: string
  encrypted_password: string | null
}

export default function TeachersPage() {
  const { supabase, user } = useSupabase()
  const { selectedSchool } = useSchool()
  const [teachers, setTeachers] = useState<TransformedTeacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<TransformedTeacher | null>(null)
  const [managingClassesFor, setManagingClassesFor] = useState<TransformedTeacher | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) return
      
      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (data) {
        setUserRole(data.role)
      }
    }

    checkUserRole()
  }, [user])

  const fetchTeachers = async () => {
    setLoading(true)
    setError(null)
  
    try {
      let query = supabase
        .from('users')
        .select(`
          id, 
          first_name, 
          last_name, 
          email,
          role,
          school_id,
          created_at,
          updated_at,
          encrypted_password,
          classes (
            id,
            name,
            class_students(count)
          )
        `)
        .eq('role', 'teacher')

      if (selectedSchool) {
        query = query.eq('school_id', selectedSchool.id)
      }
  
      const { data, error: fetchError } = await query as { 
        data: TeacherWithClasses[] | null, 
        error: any 
      }
  
      if (fetchError) throw fetchError
      if (!data) throw new Error('No data returned')

      const transformedData: TransformedTeacher[] = data.map(teacher => ({
        ...teacher,
        classes: teacher.classes || null,
        role: 'teacher',
        school_id: teacher.school_id ?? null
      }))
  
      setTeachers(transformedData)
    } catch (err) {
      console.error('Error fetching teachers:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch teachers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeachers()
  }, [selectedSchool])

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
        <h1 className="text-2xl font-bold text-gray-100">Teachers</h1>
        {selectedSchool && (
          <Button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Teacher
          </Button>
        )}
      </div>
  
      {error && (
        <div className="bg-red-900/50 text-red-200 p-4 rounded-lg border border-red-800">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {!selectedSchool ? (
          <div className="col-span-full">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-gray-400">Select a school to view and manage its teachers.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : teachers.length === 0 ? (
          <div className="col-span-full">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <p className="text-gray-400">No teachers found in {selectedSchool.name}.</p>
                  <Button 
                    onClick={() => setShowAddModal(true)}
                    variant="ghost" 
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add your first teacher
                  </Button>
                </div>
              </CardContent>
            </Card>
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
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">
                      Assigned Classes
                    </h4>
                    {teacher.classes && teacher.classes.length > 0 ? (
                      <div className="space-y-1.5">
                        {teacher.classes.map(cls => (
                          <div 
                            key={cls.id} 
                            className="text-sm text-gray-400 px-2.5 py-1.5 bg-gray-700/50 rounded-md flex items-center justify-between cursor-pointer hover:bg-gray-700"
                            onClick={() => router.push(`/dashboard/classes?selected=${cls.id}`)}
                          >
                            <span>{cls.name}</span>
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
  
      {showAddModal && (
        <CreateUserModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchTeachers}
          schoolId={selectedSchool?.id}
          allowedRoles={userRole === 'super_admin' ? ['teacher', 'school_admin'] : ['teacher']}
        />
      )}
  
      {editingTeacher && (
        <EditTeacherModal
          teacher={editingTeacher}
          isOpen={true}
          onClose={() => setEditingTeacher(null)}
          onSuccess={fetchTeachers}
          schoolId={selectedSchool?.id}
        />
      )}
  
      {managingClassesFor && (
        <ManageTeacherClasses
          teacher={managingClassesFor}
          isOpen={true}
          onClose={() => setManagingClassesFor(null)}
          onUpdate={fetchTeachers}
          schoolId={selectedSchool?.id}
        />
      )}
    </div>
  )
}