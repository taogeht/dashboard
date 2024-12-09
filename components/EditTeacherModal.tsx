// components/EditTeacherModal.tsx
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Users } from '@/lib/types/supabase'

interface EditTeacherModalProps {
  teacher: Users | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function EditTeacherModal({ teacher, isOpen, onClose, onSuccess }: EditTeacherModalProps) {
  const [firstName, setFirstName] = useState(teacher?.first_name || '')
  const [lastName, setLastName] = useState(teacher?.last_name || '')
  const [email, setEmail] = useState(teacher?.email || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Update state when teacher prop changes
  useState(() => {
    if (teacher) {
      setFirstName(teacher.first_name)
      setLastName(teacher.last_name)
      setEmail(teacher.email)
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