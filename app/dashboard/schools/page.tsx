'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useSupabase } from '@/components/supabase-provider'
import { useEffect } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Users, BookOpen, GraduationCap } from 'lucide-react'


interface School {
    id: string
    name: string
    address: string
    created_at: string
    _count?: {
      users: number
      classes: number
      students: number
    }
  }

export default function SchoolsPage() {
  const { supabase } = useSupabase()
  const [schools, setSchools] = useState<School[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    address: ''
  })
  const [editingSchool, setEditingSchool] = useState<School | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError('School name is required')
      return
    }
  
    try {
      setLoading(true)
      setError(null)
  
      if (editingSchool) {
        const { error: updateError } = await supabase
          .from('schools')
          .update({
            name: formData.name.trim(),
            address: formData.address.trim()
          })
          .eq('id', editingSchool.id)
  
        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('schools')
          .insert({
            name: formData.name.trim(),
            address: formData.address.trim()
          })
  
        if (insertError) throw insertError
      }
  
      await fetchSchools()
      setShowAddModal(false)
      setFormData({ name: '', address: '' })
      setEditingSchool(null)
    } catch (err) {
      console.error('Error saving school:', err)
      setError(err instanceof Error ? err.message : 'Failed to save school')
    } finally {
      setLoading(false)
    }
  }

  const fetchSchools = async () => {
    try {
      setLoading(true)
      setError(null)
  
      // Simple query to just get schools
      const { data: schoolsData, error: fetchError } = await supabase
        .from('schools')
        .select('*')
        .order('name')
  
      if (fetchError) throw fetchError
  
      // Transform the data with default counts
      const transformedData = (schoolsData || []).map(school => ({
        ...school,
        _count: {
          users: 0,
          classes: 0,
          students: 0
        }
      }))
  
      setSchools(transformedData)
    } catch (err) {
      console.error('Error fetching schools:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch schools')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (schoolId: string) => {
    if (!confirm('Are you sure you want to delete this school?')) {
      return
    }
  
    try {
      setLoading(true)
      setError(null)
  
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
        <div className="text-red-400 bg-red-900/20 border border-red-800 p-4 rounded-lg">
          {error}
        </div>
      )}
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  {loading ? (
    <div className="col-span-full text-center text-gray-400 py-12">
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
          {school._count?.users || 0}
        </p>
        <p className="text-xs text-gray-400">Teachers</p>
      </div>
      <div className="space-y-1">
        <BookOpen className="h-4 w-4 mx-auto text-green-400" />
        <p className="text-sm font-medium text-gray-100">
          {school._count?.classes || 0}
        </p>
        <p className="text-xs text-gray-400">Classes</p>
      </div>
      <div className="space-y-1">
        <GraduationCap className="h-4 w-4 mx-auto text-purple-400" />
        <p className="text-sm font-medium text-gray-100">
          {school._count?.students || 0}
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
  onClick={() => {
    setShowAddModal(false)
    setFormData({ name: '', address: '' })
    setError(null)
    setEditingSchool(null)
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
  {loading ? 'Saving...' : editingSchool ? 'Save Changes' : 'Create School'}
</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}