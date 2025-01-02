// components/AddTeacherModal.tsx

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

interface AddTeacherModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}
interface School {
  id: string
  name: string
  schoolId: string | undefined
}


export function AddTeacherModal({ isOpen, onClose, onSuccess }: AddTeacherModalProps) {
  const { supabase } = useSupabase()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [schools, setSchools] = useState<School[]>([])
  const [selectedSchool, setSelectedSchool] = useState('')


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/teachers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          schoolId: selectedSchool
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create teacher')
      }

      // Reset form
      setFirstName('')
      setLastName('')
      setEmail('')
      setPassword('')
      
      onSuccess()
      onClose()
    } catch (err) {
      console.error('Error creating teacher:', err)
      setError(err instanceof Error ? err.message : 'Failed to create teacher')
    } finally {
      setLoading(false)
    }
  }

useEffect(() => {
    const fetchSchools = async () => {
      const { data, error } = await supabase
        .from('schools')
        .select('id, name')
        .order('name')
      
      if (error) {
        console.error('Error fetching schools:', error)
        return
      }

      if (data) {
        setSchools(data)
        if (data.length === 1) {
          setSelectedSchool(data[0].id)
        }
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
          <DialogTitle>Add New Teacher</DialogTitle>
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
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              {loading ? 'Creating...' : 'Create Teacher'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}