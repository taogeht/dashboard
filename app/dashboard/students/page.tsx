// app/dashboard/students/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useSupabase } from '@/components/supabase-provider'
import { useSchool } from '@/context/SchoolContext'
import { AddStudentModal } from '@/components/AddStudentModal'
import { EditStudentModal } from '@/components/EditStudentModal'
import type { Students } from '@/lib/types/supabase'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface StudentWithClasses extends Students {
  classes: {
    id: string
    name: string
  }[]
}

export default function StudentsPage() {
  const { supabase } = useSupabase()
  const { selectedSchool } = useSchool()
  const [students, setStudents] = useState<StudentWithClasses[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState<StudentWithClasses | null>(null)
  const [selectedClass, setSelectedClass] = useState<string>('all')
  const [classes, setClasses] = useState<any[]>([])

  const fetchStudents = async () => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('students')
        .select(`
          *,
          classes:class_students(
            class:classes(
              id,
              name
            )
          )
        `)
        .order('last_name')

      // Filter by selected school if one is selected
      if (selectedSchool) {
        query = query.eq('school_id', selectedSchool.id)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      // Transform the nested data structure
      const transformedData = (data || []).map(student => ({
        ...student,
        classes: student.classes
          ? student.classes.map((c: any) => c.class).filter(Boolean)
          : []
      }))

      setStudents(transformedData)
    } catch (err) {
      console.error('Error fetching students:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch students')
    } finally {
      setLoading(false)
    }
  }

  const fetchClasses = async () => {
    try {
      let query = supabase
        .from('classes')
        .select('id, name')
        .order('name')

      if (selectedSchool) {
        query = query.eq('school_id', selectedSchool.id)
      }

      const { data, error } = await query

      if (error) throw error

      setClasses(data || [])
    } catch (err) {
      console.error('Error fetching classes:', err)
    }
  }

  // Refetch when selected school changes
  useEffect(() => {
    fetchStudents()
    fetchClasses()
    // Reset selected class when school changes
    setSelectedClass('all')
  }, [selectedSchool])

  const filteredStudents = selectedClass === 'all' 
    ? students 
    : students.filter(student => 
        student.classes?.some(classItem => classItem.id === selectedClass)
      )

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
        <h1 className="text-2xl font-bold text-gray-100">Students</h1>
        <div className="flex items-center gap-4">
          {selectedSchool && (
            <Select
              value={selectedClass}
              onValueChange={setSelectedClass}
            >
              <SelectTrigger className="w-[200px] bg-gray-700 border-gray-600 text-gray-100">
                <SelectValue placeholder="Filter by class" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600 text-gray-100">
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((classItem) => (
                  <SelectItem key={classItem.id} value={classItem.id}>
                    {classItem.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {selectedSchool && (
            <Button 
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          )}
        </div>
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
                  <p className="text-gray-400">Select a school to view and manage its students.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="col-span-full">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <p className="text-gray-400">
                    {selectedClass === 'all' 
                      ? `No students found in ${selectedSchool.name}.`
                      : 'No students found in this class.'}
                  </p>
                  {selectedClass === 'all' && (
                    <Button 
                      onClick={() => setShowAddModal(true)}
                      variant="ghost" 
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add your first student
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredStudents.map((student) => (
            <Card key={student.id} className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium text-gray-200">
                  {student.first_name} {student.last_name}
                </CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-gray-400 hover:text-gray-100"
                    onClick={() => setEditingStudent(student)}
                  >
                    <Pencil size={16} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-gray-400 hover:text-red-400"
                    onClick={async () => {
                      if (!confirm('Are you sure you want to delete this student? This will remove them from all classes.')) {
                        return;
                      }

                      try {
                        const { error } = await supabase
                          .from('students')
                          .delete()
                          .eq('id', student.id)

                        if (error) throw error

                        fetchStudents()
                      } catch (err) {
                        console.error('Error deleting student:', err)
                        alert('Failed to delete student: ' + (err instanceof Error ? err.message : 'Unknown error'))
                      }
                    }}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-400"></p>
                  {student.classes && student.classes.length > 0 && (
                    <p className="text-sm text-gray-400">
                      Classes: {student.classes.map(c => c.name).join(', ')}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      {showAddModal && (
        <AddStudentModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onStudentAdded={fetchStudents}
          schoolId={selectedSchool?.id}
        />
      )}

      {editingStudent && (
        <EditStudentModal
          student={editingStudent}
          isOpen={true}
          onClose={() => setEditingStudent(null)}
          onSuccess={fetchStudents}
          schoolId={selectedSchool?.id}
        />
      )}
    </div>
  )
}