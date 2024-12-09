'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Pencil, Trash2, School, Users, BookOpen } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSupabase } from '@/components/supabase-provider'

interface School {
  id: string
  name: string
  address: string | null
  created_at: string
  updated_at: string
  stats: {
    teachers: number
    classes: number
    students: number
  }
}

interface SchoolFormData {
  name: string
  address: string
}

interface SchoolRecord {
    id: string
    name: string
    address?: string  // Made optional
    created_at: string
    updated_at: string
  }

export default function SchoolsManagement() {
  const { supabase } = useSupabase()
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingSchool, setEditingSchool] = useState<School | null>(null)
  const [formData, setFormData] = useState<SchoolFormData>({
    name: '',
    address: ''
  })


  const fetchSchools = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch schools and their related counts using RPC
      const { data: schoolsData, error: schoolsError } = await supabase
        .from('schools')
        .select('*')
        .order('name')

      if (schoolsError) throw schoolsError

      // For each school, fetch related counts
      const schoolsWithStats = await Promise.all(
        schoolsData.map(async (school) => {
          // Count teachers (users with role 'teacher')
          const { count: teacherCount } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('school_id', school.id)
            .eq('role', 'teacher')

          // Count classes
          const { count: classCount } = await supabase
            .from('classes')
            .select('*', { count: 'exact', head: true })
            .eq('school_id', school.id)

          // Count students
          const { count: studentCount } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('school_id', school.id)

          return {
            ...school,
            stats: {
              teachers: teacherCount || 0,
              classes: classCount || 0,
              students: studentCount || 0
            }
          }
        })
      )

      setSchools(schoolsWithStats)
    } catch (err) {
      console.error('Error fetching schools:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch schools')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchools()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)

      const schoolData = {
        name: formData.name, 
        ...(formData.address ? { address: formData.address } : {})
      }
  if (editingSchool) {
        const { error: updateError } = await supabase
          .from('schools')
          .update(schoolData)
          .eq('id', editingSchool.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('schools')
          .insert(schoolData)

        if (insertError) throw insertError
      }
      await fetchSchools()
      setShowAddModal(false)
      setEditingSchool(null)
      setFormData({ name: '', address: '' })
    } catch (err) {
      console.error('Error saving school:', err)
      setError(err instanceof Error ? err.message : 'Failed to save school')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (schoolId: string) => {
    if (!confirm('Are you sure you want to delete this school? This action cannot be undone.')) {
      return
    }

    try {
        setLoading(true)
        setError(null)
  
        // First update all related records to remove the school_id
// Inside handleDelete function
await Promise.all([
    // For users table
    supabase.from('users').update({
      email: undefined,
      first_name: undefined,
      last_name: undefined,
      role: undefined
    }).eq('school_id', schoolId),
    
    // For classes and students, you'll need to check their specific type definitions
    supabase.from('classes').update({ teacher_id: undefined }).eq('school_id', schoolId),
    supabase.from('students').update({ email: undefined }).eq('school_id', schoolId)
  ]);
      // Then delete the school
      const { error: deleteError } = await supabase
        .from('schools')
        .delete()
        .eq('id', schoolId)

      if (deleteError) throw deleteError

      await fetchSchools()
    } catch (err) {
      console.error('Error deleting school:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete school')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-gray-100">Loading schools...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-100">Schools Management</h1>
        <Button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add School
        </Button>
      </div>

      {error && (
        <div className="text-red-400 bg-red-900/20 border border-red-800 p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {schools.length === 0 ? (
          <div className="col-span-full text-center text-gray-400 py-12">
            No schools found. Add your first school to get started.
          </div>
        ) : (
          schools.map((school) => (
            <Card key={school.id} className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium text-gray-200">
                  {school.name}
                </CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => {
                      setEditingSchool(school)
                      setFormData({
                        name: school.name,
                        address: school.address || ''
                      })
                      setShowAddModal(true)
                    }}
                    className="text-gray-400 hover:text-gray-100"
                  >
                    <Pencil size={16} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleDelete(school.id)}
                    className="text-gray-400 hover:text-red-400"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {school.address && (
                    <p className="text-sm text-gray-400">{school.address}</p>
                  )}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="space-y-1">
                      <Users className="h-4 w-4 mx-auto text-blue-400" />
                      <p className="text-sm font-medium text-gray-100">
                        {school.stats.teachers}
                      </p>
                      <p className="text-xs text-gray-400">Teachers</p>
                    </div>
                    <div className="space-y-1">
                      <BookOpen className="h-4 w-4 mx-auto text-green-400" />
                      <p className="text-sm font-medium text-gray-100">
                        {school.stats.classes}
                      </p>
                      <p className="text-xs text-gray-400">Classes</p>
                    </div>
                    <div className="space-y-1">
                      <School className="h-4 w-4 mx-auto text-purple-400" />
                      <p className="text-sm font-medium text-gray-100">
                        {school.stats.students}
                      </p>
                      <p className="text-xs text-gray-400">Students</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="bg-gray-800 text-gray-100 border-gray-700">
          <DialogHeader>
            <DialogTitle>
              {editingSchool ? 'Edit School' : 'Add New School'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">School Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="bg-gray-700 border-gray-600 text-gray-100"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="bg-gray-700 border-gray-600 text-gray-100"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => {
                  setShowAddModal(false)
                  setEditingSchool(null)
                  setFormData({ name: '', address: '' })
                }}
                className="border-gray-600 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Saving...' : editingSchool ? 'Save Changes' : 'Add School'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}