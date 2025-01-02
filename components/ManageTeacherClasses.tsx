'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useSupabase } from '@/components/supabase-provider'
import type { Classes, Users } from '@/lib/types/supabase'

interface ManageTeacherClassesProps {
  teacher: Users
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
  schoolId?: string
}

export function ManageTeacherClasses({ teacher, isOpen, onClose, onUpdate }: ManageTeacherClassesProps) {
  const { supabase } = useSupabase()
  const [classes, setClasses] = useState<Classes[]>([])
  const [teacherClassIds, setTeacherClassIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch all classes
      const { data: allClasses, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .order('name')

      if (classesError) throw classesError

      // Fetch classes assigned to this teacher
      const { data: teacherClasses, error: teacherClassesError } = await supabase
        .from('classes')
        .select('id')
        .eq('teacher_id', teacher.id)

      if (teacherClassesError) throw teacherClassesError

      setClasses(allClasses || [])
      setTeacherClassIds(teacherClasses.map(c => c.id))
      
    } catch (err) {
      console.error('Error fetching class data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch class data')
    } finally {
      setLoading(false)
    }
  }

  const toggleClassAssignment = async (classId: string) => {
    try {
      setLoading(true)
      
      if (teacherClassIds.includes(classId)) {
        // Unassign class from teacher
        const { error: updateError } = await supabase
          .from('classes')
          .update({ teacher_id: undefined })
          .eq('id', classId)

        if (updateError) throw updateError
        
        setTeacherClassIds(prev => prev.filter(id => id !== classId))
      } else {
        // Assign class to teacher
        const { error: updateError } = await supabase
          .from('classes')
          .update({ teacher_id: teacher.id })
          .eq('id', classId)

        if (updateError) throw updateError
        
        setTeacherClassIds(prev => [...prev, classId])
      }
      
      onUpdate()
    } catch (err) {
      console.error('Error updating class assignment:', err)
      setError(err instanceof Error ? err.message : 'Failed to update class assignment')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
  }, [isOpen, teacher.id])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 text-gray-100 border-gray-700">
        <DialogHeader>
          <DialogTitle>Manage Classes for {teacher.first_name} {teacher.last_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {error && <p className="text-red-400 text-sm">{error}</p>}
          
          {loading ? (
            <p className="text-gray-400">Loading classes...</p>
          ) : classes.length === 0 ? (
            <p className="text-gray-400">No classes available</p>
          ) : (
            <div className="space-y-2">
              {classes.map((classItem) => (
                <div
                  key={classItem.id}
                  className="flex items-center justify-between p-2 rounded-lg border border-gray-700"
                >
                  <span className="text-gray-100">{classItem.name}</span>
                  <Button
                    onClick={() => toggleClassAssignment(classItem.id)}
                    variant={teacherClassIds.includes(classItem.id) ? "destructive" : "default"}
                    disabled={loading}
                    size="sm"
                  >
                    {teacherClassIds.includes(classItem.id) ? 'Remove' : 'Assign'}
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <Button 
              onClick={onClose}
              className="border-gray-600 hover:bg-gray-700"
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}