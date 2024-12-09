// components/EditStudentModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Students, Classes } from '@/lib/types/supabase'
import { useSupabase } from '@/components/supabase-provider'

interface EditStudentModalProps {
  student: Students | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function EditStudentModal({ student, isOpen, onClose, onSuccess }: EditStudentModalProps) {
  const { supabase } = useSupabase()
  const [firstName, setFirstName] = useState(student?.first_name || '')
  const [lastName, setLastName] = useState(student?.last_name || '')
  const [email, setEmail] = useState(student?.email || '')
  const [classes, setClasses] = useState<Classes[]>([])
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (student) {
      setFirstName(student.first_name)
      setLastName(student.last_name || '')
      setEmail(student.email || '')
      fetchStudentClasses()
      fetchAvailableClasses()
    }
  }, [student])

  const fetchStudentClasses = async () => {
    if (!student) return
    
    try {
      const { data, error } = await supabase
        .from('class_students')
        .select('class_id')
        .eq('student_id', student.id)

      if (error) throw error

      setSelectedClasses(data.map(item => item.class_id))
    } catch (err) {
      console.error('Error fetching student classes:', err)
    }
  }

  const fetchAvailableClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('name')

      if (error) throw error

      setClasses(data || [])
    } catch (err) {
      console.error('Error fetching classes:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!student) return

    setLoading(true)
    setError('')

    try {
      // Update student details
      const updateData = {
        first_name: firstName.trim(),
        ...(lastName.trim() && { last_name: lastName.trim() }),
        ...(email.trim() && { email: email.trim() })
      }
      
      const { error: updateError } = await supabase
        .from('students')
        .update(updateData)
        .eq('id', student.id)

      if (updateError) throw updateError

      // Get current class enrollments
      const { data: currentEnrollments } = await supabase
        .from('class_students')
        .select('class_id')
        .eq('student_id', student.id)

      const currentClassIds = currentEnrollments?.map(e => e.class_id) || []

      // Remove student from unselected classes
      const classesToRemove = currentClassIds.filter(id => !selectedClasses.includes(id))
      if (classesToRemove.length > 0) {
        const { error: removeError } = await supabase
          .from('class_students')
          .delete()
          .eq('student_id', student.id)
          .in('class_id', classesToRemove)

        if (removeError) throw removeError
      }

      // Add student to newly selected classes
      const classesToAdd = selectedClasses.filter(id => !currentClassIds.includes(id))
      if (classesToAdd.length > 0) {
        const { error: addError } = await supabase
          .from('class_students')
          .insert(
            classesToAdd.map(classId => ({
              student_id: student.id,
              class_id: classId
            }))
          )

        if (addError) throw addError
      }

      onSuccess()
      onClose()
    } catch (err) {
      console.error('Error updating student:', err)
      setError(err instanceof Error ? err.message : 'Failed to update student')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 text-gray-100 border-gray-700">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="lastName">Last Name (Optional)</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="bg-gray-700 border-gray-600 text-gray-100"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email (Optional)</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-gray-700 border-gray-600 text-gray-100"
            />
          </div>

          <div className="space-y-2">
            <Label>Enrolled Classes</Label>
            <div className="grid grid-cols-2 gap-2">
              {classes.map((classItem) => (
                <label
                  key={classItem.id}
                  className="flex items-center space-x-2 p-2 rounded border border-gray-700 hover:bg-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={selectedClasses.includes(classItem.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedClasses(prev => [...prev, classItem.id])
                      } else {
                        setSelectedClasses(prev => prev.filter(id => id !== classItem.id))
                      }
                    }}
                  />
                  <span>{classItem.name}</span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onClose}
              className="text-gray-300 hover:text-gray-100"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default EditStudentModal