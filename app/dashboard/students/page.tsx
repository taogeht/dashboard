// app/dashboard/students/page.tsx
'use client'

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
  } from "@/components/ui/tabs"

  import { useEffect, useState } from 'react'
  import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
  import { Button } from "@/components/ui/button"
  import { Plus, Pencil, Trash2 } from 'lucide-react'
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
      const response = await fetch('/api/students')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch students')
      }

      setStudents(data.students)
    } catch (err) {
      console.error('Error fetching students:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch students')
    } finally {
      setLoading(false)
    }
  }

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/classes')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch classes')
      }

      setClasses(data.classes)
    } catch (err) {
      console.error('Error fetching classes:', err)
    }
  }

  useEffect(() => {
    fetchStudents()
    fetchClasses()
  }, [])

  const filteredStudents = selectedClass === 'all' 
    ? students 
    : students.filter(student => 
        student.classes?.some(classItem => classItem.id === selectedClass)
      )

  if (loading) return <div className="text-gray-100">Loading students...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-100">Students</h1>
        <div className="flex items-center gap-4">
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
          <Button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredStudents.length === 0 ? (
          <div className="col-span-full text-center text-gray-400 py-12">
            No students found. Add your first student to get started.
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
                        const response = await fetch(`/api/students/${student.id}`, {
                          method: 'DELETE',
                        });

                        const data = await response.json();

                        if (!response.ok) {
                          throw new Error(data.error || 'Failed to delete student');
                        }

                        fetchStudents();
                      } catch (err) {
                        console.error('Error deleting student:', err);
                        alert('Failed to delete student: ' + (err instanceof Error ? err.message : 'Unknown error'));
                      }
                    }}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-400">{student.email}</p>
                {student.classes && student.classes.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-400">
                      Classes: {student.classes.map(c => c.name).join(', ')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      <AddStudentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onStudentAdded={() => {
          fetchStudents()
        }}
      />

      <EditStudentModal
        student={editingStudent}
        isOpen={!!editingStudent}
        onClose={() => setEditingStudent(null)}
        onSuccess={fetchStudents}
      />
    </div>
  )
}