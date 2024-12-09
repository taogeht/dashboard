'use client'

import { useState, useEffect } from 'react'
import { useSupabase } from '@/components/supabase-provider'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, UserPlus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Students } from '@/lib/types/supabase'

interface EditStudentModalProps {
  student: Students
  isOpen: boolean
  onClose: () => void
  onSave: (updatedStudent: Students) => void
}

function EditStudentModal({ student, isOpen, onClose, onSave }: EditStudentModalProps) {
  const [firstName, setFirstName] = useState(student.first_name)
  const [lastName, setLastName] = useState(student.last_name)
  const [email, setEmail] = useState(student.email)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...student,
      first_name: firstName,
      last_name: lastName,
      email: email
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 text-gray-100 border-gray-700">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="bg-gray-700 border-gray-600 text-gray-100"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="bg-gray-700 border-gray-600 text-gray-100"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-gray-700 border-gray-600 text-gray-100"
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface ClassStudentListProps {
  classId: string
  className: string
}

export default function ClassStudentList({ classId, className }: ClassStudentListProps) {
  const { supabase } = useSupabase()
  const [students, setStudents] = useState<Students[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingStudent, setEditingStudent] = useState<Students | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('class_students')
        .select(`
          student:students (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('class_id', classId)

      if (fetchError) throw fetchError

      setStudents(data.map(item => item.student) as Students[])
    } catch (err) {
      console.error('Error fetching students:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch students')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveStudent = async (studentId: string) => {
    try {
      const { error: removeError } = await supabase
        .from('class_students')
        .delete()
        .eq('class_id', classId)
        .eq('student_id', studentId)

      if (removeError) throw removeError

      setStudents(prev => prev.filter(s => s.id !== studentId))
    } catch (err) {
      console.error('Error removing student:', err)
      setError(err instanceof Error ? err.message : 'Failed to remove student')
    }
  }

  const handleUpdateStudent = async (updatedStudent: Students) => {
    try {
      const { error: updateError } = await supabase
        .from('students')
        .update({
          first_name: updatedStudent.first_name,
          last_name: updatedStudent.last_name,
          email: updatedStudent.email
        })
        .eq('id', updatedStudent.id)

      if (updateError) throw updateError

      setStudents(prev => 
        prev.map(s => s.id === updatedStudent.id ? updatedStudent : s)
      )
      setEditingStudent(null)
    } catch (err) {
      console.error('Error updating student:', err)
      setError(err instanceof Error ? err.message : 'Failed to update student')
    }
  }

  useEffect(() => {
    if (classId) {
      fetchStudents()
    }
  }, [classId])

  if (loading) {
    return <div className="text-gray-100">Loading students...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-100">{className} Students</h2>
        <Button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Add Student
        </Button>
      </div>

      {error && (
        <div className="text-red-400 text-sm">{error}</div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {students.length === 0 ? (
          <div className="col-span-full text-center text-gray-400 py-12">
            No students enrolled in this class yet.
          </div>
        ) : (
          students.map((student) => (
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
                    onClick={() => handleRemoveStudent(student.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-400">{student.email}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {editingStudent && (
        <EditStudentModal
          student={editingStudent}
          isOpen={true}
          onClose={() => setEditingStudent(null)}
          onSave={handleUpdateStudent}
        />
      )}

      {/* AddStudentModal component would be rendered here */}
    </div>
  )
}