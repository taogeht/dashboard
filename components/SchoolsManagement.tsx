'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Pencil, Trash2, School, Users, BookOpen, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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

export default function SchoolsManagement() {
  const { supabase } = useSupabase()
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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

      const { data: schoolsData, error: schoolsError } = await supabase
        .from('schools')
        .select(`
          *,
          users:users(id),
          classes:classes(id),
          students:students(id)
        `)
        .order('name')

      if (schoolsError) throw schoolsError

      const transformedSchools = (schoolsData || []).map(school => ({
        ...school,
        stats: {
          teachers: school.users?.length || 0,
          classes: school.classes?.length || 0,
          students: school.students?.length || 0
        }
      }))

      setSchools(transformedSchools)
    } catch (err) {
      console.error('Error fetching schools:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch schools')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError('School name is required')
      return
    }
  
    try {
      setSaving(true)
      setError(null)

      const schoolData = {
        name: formData.name.trim(),
        address: formData.address.trim() || undefined
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
      handleCloseModal()
    } catch (err) {
      console.error('Error saving school:', err)
      setError(err instanceof Error ? err.message : 'Failed to save school')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (schoolId: string) => {
    if (!confirm('Are you sure you want to delete this school? This will remove all associations.')) {
      return
    }

    try {
      setLoading(true)
      setError(null)

      // First update associated records
      await Promise.all([
        supabase.from('users')
          .update({ school_id: null })
          .eq('id', schoolId),
        supabase.from('classes')
          .update({ school_id: null })
          .eq('school_id', schoolId),
        supabase.from('students')
          .update({ school_id: null })
          .eq('school_id', schoolId)
      ])

      // Then delete the school
      const { error: deleteError } = await supabase
        .from('schools')
        .delete()
        .eq('id', schoolId)

      if (deleteError) throw deleteError

      setSchools(prev => prev.filter(school => school.id !== schoolId))
    } catch (err) {
      console.error('Error deleting school:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete school')
    } finally {
      setLoading(false)
    }
  }

  const handleCloseModal = () => {
    setShowAddModal(false)
    setEditingSchool(null)
    setFormData({ name: '', address: '' })
    setError(null)
  }

  useEffect(() => {
    fetchSchools()
  }, [])

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
        <div className="text-red-400 bg-red-900/20 border border-red-800 p-4 rounded-lg flex items-center gap-2">
          <span className="sr-only">Error:</span>
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading && schools.length === 0 ? (
          <div className="col-span-full flex justify-center items-center py-12 text-gray-400">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading schools...
          </div>
        ) : schools.length === 0 ? (
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
                    <span className="sr-only">Edit {school.name}</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleDelete(school.id)}
                    className="text-gray-400 hover:text-red-400"
                  >
                    <Trash2 size={16} />
                    <span className="sr-only">Delete {school.name}</span>
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

      <Dialog open={showAddModal} onOpenChange={handleCloseModal}>
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
                placeholder="Enter school name"
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
                placeholder="Enter school address (optional)"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={handleCloseModal}
                className="border-gray-600 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {editingSchool ? 'Saving...' : 'Creating...'}
                  </>
                ) : (
                  editingSchool ? 'Save Changes' : 'Create School'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}