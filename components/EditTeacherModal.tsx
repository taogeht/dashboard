// components/EditTeacherModal.tsx
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select,
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { useSupabase } from '@/components/supabase-provider'
import type { Users } from '@/lib/types/supabase'

interface EditTeacherModalProps {
  teacher: Teacher | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  schoolId: string | undefined
}

interface School {
  id: string
  name: string
  address?: string
  schoolId: string | undefined
}

interface Teacher extends Users {
  school_id: string | null
}

export function EditTeacherModal({ teacher, isOpen, onClose, onSuccess }: EditTeacherModalProps) {
  const { supabase } = useSupabase()
  const [firstName, setFirstName] = useState(teacher?.first_name || '')
  const [lastName, setLastName] = useState(teacher?.last_name || '')
  const [email, setEmail] = useState(teacher?.email || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [schools, setSchools] = useState<School[]>([])
  const [selectedSchool, setSelectedSchool] = useState(teacher?.school_id || '')
  
  // Update state when teacher prop changes
  useEffect(() => {
    if (teacher) {
      setFirstName(teacher.first_name)
      setLastName(teacher.last_name)
      setEmail(teacher.email)
      setSelectedSchool(teacher.school_id || '')
    }
  }, [teacher])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teacher) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/teachers/${teacher.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          schoolId: selectedSchool
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update teacher')
      }

      onSuccess()
      onClose()
    } catch (err) {
      console.error('Error updating teacher:', err)
      setError(err instanceof Error ? err.message : 'Failed to update teacher')
    } finally {
      setLoading(false)
    }
  }
  async function cascadeSchoolAssignment(
    teacherId: string,
    schoolId: string | null,
    supabase: any
  ) {
    try {
      // Start a transaction
      const { error: teacherError } = await supabase
        .from('users')
        .update({ school_id: schoolId })
        .eq('id', teacherId)
  
      if (teacherError) throw teacherError
  
      // Get all classes taught by this teacher
      const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('id')
        .eq('teacher_id', teacherId)
  
      if (classesError) throw classesError
  
      if (classes && classes.length > 0) {
        const classIds = classes.map(c => c.id)
  
        // Update all of teacher's classes to the new school
        const { error: updateClassesError } = await supabase
          .from('classes')
          .update({ school_id: schoolId })
          .in('id', classIds)
  
        if (updateClassesError) throw updateClassesError
  
        // Get all students in these classes
        const { data: students, error: studentsError } = await supabase
          .from('class_students')
          .select('student_id')
          .in('class_id', classIds)
  
        if (studentsError) throw studentsError
  
        if (students && students.length > 0) {
          const studentIds = [...new Set(students.map(s => s.student_id))]
  
          // Update all students in these classes to the new school
          const { error: updateStudentsError } = await supabase
            .from('students')
            .update({ school_id: schoolId })
            .in('id', studentIds)
  
          if (updateStudentsError) throw updateStudentsError
        }
      }
  
      return { success: true }
    } catch (error) {
      console.error('Error in cascading school assignment:', error)
      throw error
    }
  }
  useEffect(() => {
    const fetchSchools = async () => {
      const { data } = await supabase
        .from('schools')
        .select('id, name')
        .order('name')
      
      if (data) {
        setSchools(data.map((school: any) => ({ ...school, schoolId: school.id })))
      }
    }

    if (isOpen) {
      fetchSchools()
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gray-800 text-gray-100">
        <DialogHeader>
          <DialogTitle>Edit Teacher</DialogTitle>
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
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="bg-gray-700 border-gray-600 text-gray-100"
                required
              />
            </div>
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
          <div className="space-y-2">
          <Label htmlFor="school">School</Label>
          <Select 
            value={selectedSchool} 
            onValueChange={setSelectedSchool}
          >
            <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
              <SelectValue placeholder="Select a school" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {schools.map((school) => (
                <SelectItem 
                  key={school.id} 
                  value={school.id}
                  className="text-gray-100 focus:bg-gray-700"
                >
                  {school.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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