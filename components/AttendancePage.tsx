// app/dashboard/attendance/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { useSupabase } from '@/components/supabase-provider'
import { useSchool } from '@/context/SchoolContext'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from 'lucide-react'
import AttendanceMarker from '@/components/AttendanceMarker'
import Calendar from '@/components/Calendar'

interface Class {
  id: string
  name: string
  teacher_id: string
}

export default function AttendancePage() {
  const { supabase, user } = useSupabase()
  const { selectedSchool } = useSchool()
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  // Fetch user role
  useEffect(() => {
    const checkRole = async () => {
      if (!user) return

      try {
        const response = await fetch(`/api/user/role?userId=${user.id}`)
        const data = await response.json()

        if (!response.ok) throw new Error(data.error)
        setUserRole(data.role)
      } catch (err) {
        console.error('Error checking role:', err)
        setError(err instanceof Error ? err.message : 'Failed to check user role')
      }
    }

    checkRole()
  }, [user])

  // Fetch classes based on role and selected school
  useEffect(() => {
    const fetchClasses = async () => {
      if (!user || !userRole) return
      
      try {
        setLoading(true)
        setError(null)
        
        let query = supabase
          .from('classes')
          .select('*')
          .order('name')

        // Apply filters based on role and selected school
        if (userRole === 'teacher') {
          // Teachers only see their own classes
          query = query.eq('teacher_id', user.id)
        } else if (userRole === 'school_admin') {
          // School admins see classes from their school
          if (selectedSchool?.id) {
            query = query.eq('school_id', selectedSchool.id)
          }
        } else if (userRole === 'super_admin' && selectedSchool) {
          // Super admins see classes from selected school only
          query = query.eq('school_id', selectedSchool.id)
        }

        const { data, error: fetchError } = await query

        if (fetchError) throw fetchError

        setClasses(data || [])
        
        // Automatically select class if only one exists
        if (data && data.length === 1) {
          setSelectedClass(data[0].id)
        } else {
          setSelectedClass('')
        }

      } catch (err) {
        console.error('Error fetching classes:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch classes')
      } finally {
        setLoading(false)
      }
    }

    fetchClasses()
  }, [user, userRole, selectedSchool, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Loading...</span>
      </div>
    )
  }

  // Super admin without school selected
  if (userRole === 'super_admin' && !selectedSchool) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="pt-6">
          <div className="text-center text-gray-400">
            Please select a school to view attendance
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-100">Attendance</h1>
        <Select
          value={selectedClass}
          onValueChange={setSelectedClass}
        >
          <SelectTrigger className="w-[200px] bg-gray-800 border-gray-700 text-gray-100">
            <SelectValue placeholder="Select a class" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            {classes.length > 0 ? (
              classes.map((classItem) => (
                <SelectItem 
                  key={classItem.id} 
                  value={classItem.id}
                  className="text-gray-100"
                >
                  {classItem.name}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="no-classes" disabled className="text-gray-400">
                No classes available
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="bg-red-900/50 text-red-200 p-4 rounded-lg border border-red-800">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Calendar
          value={selectedDate}
          onChange={setSelectedDate}
          minDate={new Date(2024, 0, 1)}
        />
        
        <AttendanceMarker
          classId={selectedClass}
          date={selectedDate}
        />
      </div>
    </div>
  )
}