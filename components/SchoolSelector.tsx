import { useSchool } from '@/context/SchoolContext'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, School } from 'lucide-react'

const ALL_SCHOOLS_VALUE = 'all_schools' // Special value for "All Schools" option

export default function SchoolSelector() {
  const { selectedSchool, setSelectedSchool, schools, loading, error } = useSchool()

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

  return (
    <div className="flex items-center gap-2">
      <School className="h-5 w-5 text-gray-400" />
      <Select
        value={selectedSchool?.id || ALL_SCHOOLS_VALUE}
        onValueChange={(value) => {
          if (value === ALL_SCHOOLS_VALUE) {
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
          <SelectItem 
            value={ALL_SCHOOLS_VALUE}
            className="text-gray-100"
          >
            All Schools
          </SelectItem>
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