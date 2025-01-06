// components/SchoolSelector.tsx
import { useSchool } from '@/context/SchoolContext'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, School } from 'lucide-react'

export default function SchoolSelector() {
  const { 
    selectedSchool, 
    setSelectedSchool, 
    schools, 
    loading, 
    error,
    userRole 
  } = useSchool()

  // If school admin, don't show selector since they're locked to their school
  if (userRole === 'school_admin') {
    return (
      <div className="flex items-center gap-2">
        <School className="h-5 w-5 text-gray-400" />
        <span className="text-gray-100">{selectedSchool?.name}</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading schools...
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-400">
        Error loading schools
      </div>
    )
  }

  // Only super_admin can switch between schools
  return (
    <div className="flex items-center gap-2">
      <School className="h-5 w-5 text-gray-400" />
      <Select
        value={selectedSchool?.id || 'all'}
        onValueChange={(value) => {
          if (value === 'all') {
            setSelectedSchool(null)
          } else {
            const school = schools.find(s => s.id === value)
            setSelectedSchool(school || null)
          }
        }}
      >
        <SelectTrigger className="w-[200px] bg-gray-800 border-gray-700">
          <SelectValue 
            placeholder="Select a school" 
          />
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-gray-700">
          {userRole === 'super_admin' && (
            <SelectItem value="all" className="text-gray-100">
              All Schools
            </SelectItem>
          )}
          {schools.map((school) => (
            <SelectItem 
              key={school.id} 
              value={school.id}
              className="text-gray-100"
            >
              {school.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}