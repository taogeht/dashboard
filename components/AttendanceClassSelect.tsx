import { useState, useEffect } from 'react'
import { useSupabase } from '@/components/supabase-provider'
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Users, Loader2, AlertCircle } from 'lucide-react'
import type { Classes } from '@/lib/types/supabase'

interface ExtendedClass extends Classes {
  students: {
    count: number
  }
  last_attendance?: string
}

export default function AttendanceClassSelect({ onClassSelect }: { onClassSelect: (classId: string) => void }) {
  const { supabase, user } = useSupabase()
  const [classes, setClasses] = useState<ExtendedClass[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchClasses = async () => {
      if (!user) return

      try {
        setLoading(true)
        setError(null)

        // Get user role first
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (userError) throw userError

        // Build query based on role
        let query = supabase.from('classes').select(`
          *,
          students:class_students(count),
          attendance(
            date
          )
        `)
        
        if (userData.role === 'teacher') {
          query = query.eq('teacher_id', user.id)
        }

        const { data: classesData, error: classesError } = await query
          .order('name')

        if (classesError) throw classesError

        // Process the data to include last attendance date and format students
        const processedClasses = classesData?.map(classItem => ({
          ...classItem,
          students: { count: classItem.students[0]?.count || 0 },
          last_attendance: classItem.attendance
            ?.map(a => a.date)
            .sort()
            .reverse()[0]
        })) || []

        setClasses(processedClasses)
      } catch (err) {
        console.error('Error fetching classes:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch classes')
      } finally {
        setLoading(false)
      }
    }

    fetchClasses()
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Loading classes...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-400 bg-red-900/20 p-4 rounded-lg border border-red-800">
        <AlertCircle className="w-5 h-5" />
        <span>{error}</span>
      </div>
    )
  }

  if (classes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No classes found. Classes assigned to you will appear here.
      </div>
    )
  }

  const getAttendanceStatus = (lastAttendance?: string) => {
    if (!lastAttendance) return 'No attendance recorded'
    
    const today = new Date().toISOString().split('T')[0]
    if (lastAttendance === today) return 'Attendance taken today'
    
    const lastDate = new Date(lastAttendance)
    const diffTime = Math.ceil((new Date().getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
    return `Last attendance ${diffTime} day${diffTime !== 1 ? 's' : ''} ago`
  }

  return (
    <div className="space-y-6">
      <Select onValueChange={onClassSelect}>
        <SelectTrigger className="w-[200px] bg-gray-800 border-gray-700 text-gray-100">
          <SelectValue placeholder="Select a class" />
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-gray-700">
          {classes.map((classItem) => (
            <SelectItem 
              key={classItem.id} 
              value={classItem.id}
              className="text-gray-100 focus:bg-gray-700"
            >
              {classItem.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {classes.map((classItem) => (
          <Card 
            key={classItem.id}
            className="bg-gray-800 border-gray-700 hover:bg-gray-700/50 transition-colors cursor-pointer group"
            onClick={() => onClassSelect(classItem.id)}
          >
            <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-blue-600/20 rounded-lg flex items-center justify-center group-hover:bg-blue-600/30 transition-colors">
                <Calendar className="w-8 h-8 text-blue-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-100">{classItem.name}</h3>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                  <Users className="w-4 h-4" />
                  <span>{classItem.students.count} student{classItem.students.count !== 1 ? 's' : ''}</span>
                </div>
                <p className="text-sm text-gray-500">
                  {getAttendanceStatus(classItem.last_attendance)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}