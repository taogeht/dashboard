'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useSupabase } from '@/components/supabase-provider'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import type { Students } from '@/lib/types/supabase'

interface AddStudentToClassProps {
  isOpen: boolean
  onClose: () => void
  classId: string
  onStudentAdded: () => void
}

export function AddStudentToClass({ 
  isOpen, 
  onClose, 
  classId, 
  onStudentAdded 
}: AddStudentToClassProps) {
  const { supabase } = useSupabase()
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [students, setStudents] = useState<Students[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAvailableStudents = async () => {
    try {
      setLoading(true)
      
      // First get IDs of students already in the class
      const { data: enrolledStudents, error: enrolledError } = await supabase
        .from('class_students')
        .select('student_id')
        .eq('class_id', classId)

      if (enrolledError) throw enrolledError

      const enrolledIds = enrolledStudents.map(s => s.student_id)

      // Then get all students not already in the class
      const { data: availableStudents, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .not('id', 'in', enrolledIds.length > 0 ? enrolledIds : [''])
        .order('last_name', { ascending: true })

      if (studentsError) throw studentsError

      setStudents(availableStudents || [])
      
    } catch (err) {
      console.error('Error fetching available students:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch students')
    } finally {
      setLoading(false)
    }
  }

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent) return

    try {
      setLoading(true)
      setError(null)

      const { error: insertError } = await supabase
        .from('class_students')
        .insert({
          class_id: classId,
          student_id: selectedStudent
        })

      if (insertError) throw insertError

      onStudentAdded()
      onClose()
      setSelectedStudent('')
    } catch (err) {
      console.error('Error adding student to class:', err)
      setError(err instanceof Error ? err.message : 'Failed to add student')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchAvailableStudents()
    }
  }, [isOpen, classId])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 text-gray-100 border-gray-700">
        <DialogHeader>
          <DialogTitle>Add Student to Class</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleAddStudent} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="student">Select Student</Label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger 
                className="bg-gray-700 border-gray-600 text-gray-100"
                id="student"
              >
                <SelectValue placeholder="Select a student" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600 text-gray-100">
                {students.map((student) => (
                  <SelectItem 
                    key={student.id} 
                    value={student.id}
                    className="focus:bg-gray-600 focus:text-gray-100"
                  >
                    {student.first_name} {student.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
          
          {students.length === 0 && !loading && (
            <p className="text-yellow-400 text-sm">
              No available students to add to this class
            </p>
          )}

          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="border-gray-600 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !selectedStudent}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Adding...' : 'Add Student'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}