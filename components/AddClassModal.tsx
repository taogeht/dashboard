'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSupabase } from '@/components/supabase-provider'
import type { Users } from '@/lib/types/supabase'

interface AddClassModalProps {
  isOpen: boolean
  onClose: () => void
  onClassAdded: () => void
  schoolId?: string
}

export function AddClassModal({ isOpen, onClose, onClassAdded, schoolId }: AddClassModalProps) {
  const { supabase } = useSupabase()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [teachers, setTeachers] = useState<Users[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTeachers = async () => {
    try {
      // Fetch teachers from the selected school
      let query = supabase
        .from('users')
        .select('id, first_name, last_name, email, encrypted_password, role, school_id, created_at, updated_at')
        .eq('role', 'teacher')
        .order('last_name')

      // Filter teachers by school if schoolId is provided
      if (schoolId) {
        query = query.eq('school_id', schoolId)
      }

      const { data: teachersData, error: teachersError } = await query

      if (teachersError) throw teachersError
      setTeachers(teachersData || [])
    } catch (err) {
      console.error('Error fetching teachers:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch teachers')
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchTeachers()
    }
  }, [isOpen, schoolId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!teacherId) {
      setError('Please select a teacher')
      return
    }
    
    try {
      setLoading(true)
      setError(null)

      const { error: insertError } = await supabase
        .from('classes')
        .insert({
          name,
          description: description || null,
          teacher_id: teacherId,
          school_id: schoolId // Add school_id to the class
        })

      if (insertError) throw insertError

      setName('')
      setDescription('')
      setTeacherId('')
      onClassAdded()
      onClose()

    } catch (err) {
      console.error('Error adding class:', err)
      setError(err instanceof Error ? err.message : 'Failed to add class')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 text-gray-100 border-gray-700">
        <DialogHeader>
          <DialogTitle>Add New Class</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="teacher">Teacher *</Label>
            <Select value={teacherId} onValueChange={setTeacherId} required>
              <SelectTrigger 
                className="bg-gray-700 border-gray-600 text-gray-100"
                id="teacher"
              >
                <SelectValue placeholder="Select a teacher" />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600 text-gray-100">
                {teachers.map((teacher) => (
                  <SelectItem 
                    key={teacher.id} 
                    value={teacher.id}
                    className="focus:bg-gray-600 focus:text-gray-100"
                  >
                    {teacher.first_name} {teacher.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Class Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-gray-700 border-gray-600 text-gray-100"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-gray-700 border-gray-600 text-gray-100"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

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
              disabled={loading || !name || !teacherId}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Adding...' : 'Add Class'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}