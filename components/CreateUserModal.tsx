import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Loader2 } from 'lucide-react'
import { useSupabase } from '@/components/supabase-provider'

interface School {
  id: string
  name: string
}

interface CreateUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  allowedRoles: string[]
  schoolId: string | undefined
}

const ROLE_LABELS: Record<string, string> = {
  'super_admin': 'Super Admin',
  'school_admin': 'School Admin',
  'teacher': 'Teacher'
}

export default function CreateUserModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  allowedRoles,
  schoolId 
}: CreateUserModalProps) {
  const { supabase } = useSupabase()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: '',
    assignedSchoolId: schoolId || ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [schools, setSchools] = useState<School[]>([])
  const [loadingSchools, setLoadingSchools] = useState(false)

  // Fetch available schools when needed
  useEffect(() => {
    const fetchSchools = async () => {
      if (!formData.role || formData.role !== 'school_admin') return

      try {
        setLoadingSchools(true)
        const { data, error } = await supabase
          .from('schools')
          .select('id, name')
          .order('name')

        if (error) throw error
        setSchools(data || [])
      } catch (err) {
        console.error('Error fetching schools:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch schools')
      } finally {
        setLoadingSchools(false)
      }
    }

    fetchSchools()
  }, [formData.role, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate role is allowed
      if (!allowedRoles.includes(formData.role)) {
        throw new Error('Selected role is not allowed')
      }

      // Validate school selection for school admin
      if (formData.role === 'school_admin' && !formData.assignedSchoolId) {
        throw new Error('Please select a school for the school admin')
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          schoolId: formData.role === 'teacher' ? schoolId : formData.assignedSchoolId
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user')
      }

      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: '',
        assignedSchoolId: schoolId || ''
      })
      
      onSuccess()
      onClose()
    } catch (err) {
      console.error('Error creating user:', err)
      setError(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = (role: string) => {
    setFormData(prev => ({
      ...prev,
      role,
      // Reset assigned school if switching to teacher
      assignedSchoolId: role === 'teacher' ? (schoolId || '') : prev.assignedSchoolId
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gray-800 text-gray-100">
        <DialogHeader>
          <DialogTitle>
            {allowedRoles.length === 1 && allowedRoles[0] === 'teacher' 
              ? 'Add New Teacher' 
              : 'Create New User'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-900/50 p-3 rounded-lg flex items-center gap-2 text-red-200 border border-red-800">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                className="bg-gray-700 border-gray-600 text-gray-100"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
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
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="bg-gray-700 border-gray-600 text-gray-100"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="bg-gray-700 border-gray-600 text-gray-100"
              required
            />
          </div>

          {allowedRoles.length > 1 && (
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select 
                value={formData.role} 
                onValueChange={handleRoleChange}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {allowedRoles.map(role => (
                    <SelectItem 
                      key={role} 
                      value={role}
                      className="text-gray-100"
                    >
                      {ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Show school selector for school admin */}
          {formData.role === 'school_admin' && (
            <div className="space-y-2">
              <Label htmlFor="school">Assigned School</Label>
              <Select 
                value={formData.assignedSchoolId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, assignedSchoolId: value }))}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                  <SelectValue placeholder="Select a school" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {loadingSchools ? (
                    <SelectItem value="loading" disabled className="text-gray-400">
                      Loading schools...
                    </SelectItem>
                  ) : (
                    schools.map(school => (
                      <SelectItem 
                        key={school.id} 
                        value={school.id}
                        className="text-gray-100"
                      >
                        {school.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* If only one role is allowed, set it automatically */}
          {allowedRoles.length === 1 && (
            <input 
              type="hidden" 
              name="role" 
              value={allowedRoles[0]} 
              onChange={() => setFormData(prev => ({ ...prev, role: allowedRoles[0] }))}
            />
          )}

          <div className="flex justify-end gap-3 pt-4">
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
              disabled={loading || !formData.role || (formData.role === 'school_admin' && !formData.assignedSchoolId)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create User'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}