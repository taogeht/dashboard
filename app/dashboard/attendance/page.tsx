'use client'

import { useState, useEffect } from 'react'
import { useSupabase } from '@/components/supabase-provider'
import Calendar from '@/components/Calendar'
import AttendanceMarker from '@/components/AttendanceMarker'
import AttendanceClassSelect from '@/components/AttendanceClassSelect'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, UserCheck, UserX, Clock, Loader2 } from 'lucide-react'
import type { Classes } from '@/lib/types/supabase'

interface AttendanceStats {
  totalStudents: number
  presentCount: number
  absentCount: number
  lateCount: number
  attendanceRate: number
}

export default function AttendancePage() {
  const { supabase, user } = useSupabase()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  const [classes, setClasses] = useState<Classes[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [attendanceData, setAttendanceData] = useState<Array<{
    date: string
    presentCount: number
    totalCount: number
  }>>([])
  const [stats, setStats] = useState<AttendanceStats>({
    totalStudents: 0,
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
    attendanceRate: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch user role and classes
  useEffect(() => {
    const fetchUserRoleAndClasses = async () => {
      if (!user) return

      try {
        setLoading(true)
        setError(null)

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (userError) throw userError

        const isAdminUser = userData.role === 'admin'
        setIsAdmin(isAdminUser)

        let query = supabase.from('classes').select('*')
        if (!isAdminUser) {
          query = query.eq('teacher_id', user.id)
        }

        const { data: classesData, error: classesError } = await query.order('name')

        if (classesError) throw classesError

        setClasses(classesData || [])
        if (classesData?.length === 1) {
          setSelectedClass(classesData[0].id)
        }

      } catch (err) {
        console.error('Error fetching classes:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch classes')
      } finally {
        setLoading(false)
      }
    }

    fetchUserRoleAndClasses()
  }, [user])

  // Fetch attendance data whenever selected class or date changes
  useEffect(() => {
    const fetchAttendanceData = async () => {
      if (!selectedClass) {
        setAttendanceData([])
        return
      }

      try {
        setError(null)
        const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
        const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)

        const { data: attendanceRecords, error: attendanceError } = await supabase
          .from('attendance')
          .select('*')
          .eq('class_id', selectedClass)
          .gte('date', startDate.toISOString().split('T')[0])
          .lte('date', endDate.toISOString().split('T')[0])

        if (attendanceError) throw attendanceError

        const grouped = (attendanceRecords || []).reduce((acc, record) => {
          const date = record.date
          if (!acc[date]) {
            acc[date] = { total: 0, present: 0 }
          }
          acc[date].total++
          if (record.status === 'present') {
            acc[date].present++
          }
          return acc
        }, {} as Record<string, { total: number; present: number }>)

        const formattedData = Object.entries(grouped).map(([date, counts]) => ({
          date,
          presentCount: counts.present,
          totalCount: counts.total
        }))

        setAttendanceData(formattedData)
      } catch (err) {
        console.error('Error fetching attendance data:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch attendance data')
      }
    }

    fetchAttendanceData()
  }, [selectedClass, selectedDate.getMonth(), selectedDate.getFullYear()])

  // Fetch daily stats whenever selected class or date changes
  useEffect(() => {
    const fetchDailyStats = async () => {
      if (!selectedClass) {
        setStats({
          totalStudents: 0,
          presentCount: 0,
          absentCount: 0,
          lateCount: 0,
          attendanceRate: 0
        })
        return
      }

      try {
        const { data: attendanceRecords, error: statsError } = await supabase
          .from('attendance')
          .select('*')
          .eq('class_id', selectedClass)
          .eq('date', selectedDate.toISOString().split('T')[0])

        if (statsError) throw statsError

        const total = attendanceRecords?.length || 0
        const present = attendanceRecords?.filter(r => r.status === 'present').length || 0
        const absent = attendanceRecords?.filter(r => r.status === 'absent').length || 0
        const late = attendanceRecords?.filter(r => r.status === 'late').length || 0

        setStats({
          totalStudents: total,
          presentCount: present,
          absentCount: absent,
          lateCount: late,
          attendanceRate: total > 0 ? (present + late) / total * 100 : 0
        })
      } catch (err) {
        console.error('Error fetching daily stats:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch daily stats')
      }
    }

    fetchDailyStats()
  }, [selectedClass, selectedDate])

  const handleClassSelect = (classId: string) => {
    setSelectedClass(classId)
    // Reset attendance data when changing classes
    setAttendanceData([])
    setStats({
      totalStudents: 0,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      attendanceRate: 0
    })
  }

  const handleAttendanceSaved = async () => {
    // Refresh both calendar data and stats after saving attendance
    const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
    const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)

    try {
      // Fetch updated attendance data
      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .eq('class_id', selectedClass)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])

      if (attendanceError) throw attendanceError

      // Update calendar data
      const grouped = (attendanceRecords || []).reduce((acc, record) => {
        const date = record.date
        if (!acc[date]) {
          acc[date] = { total: 0, present: 0 }
        }
        acc[date].total++
        if (record.status === 'present') {
          acc[date].present++
        }
        return acc
      }, {} as Record<string, { total: number; present: number }>)

      setAttendanceData(
        Object.entries(grouped).map(([date, counts]) => ({
          date,
          presentCount: counts.present,
          totalCount: counts.total
        }))
      )

      // Fetch updated daily stats
      const { data: todayRecords, error: statsError } = await supabase
        .from('attendance')
        .select('*')
        .eq('class_id', selectedClass)
        .eq('date', selectedDate.toISOString().split('T')[0])

      if (statsError) throw statsError

      const total = todayRecords?.length || 0
      const present = todayRecords?.filter(r => r.status === 'present').length || 0
      const absent = todayRecords?.filter(r => r.status === 'absent').length || 0
      const late = todayRecords?.filter(r => r.status === 'late').length || 0

      setStats({
        totalStudents: total,
        presentCount: present,
        absentCount: absent,
        lateCount: late,
        attendanceRate: total > 0 ? (present + late) / total * 100 : 0
      })
    } catch (err) {
      console.error('Error refreshing data:', err)
      setError(err instanceof Error ? err.message : 'Failed to refresh data')
    }
  }

  // Rest of the component remains the same...
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        
        {!selectedClass ? (
          <AttendanceClassSelect onClassSelect={handleClassSelect} />
        ) : (
          <Select value={selectedClass} onValueChange={handleClassSelect}>
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
        )}
      </div>

      {selectedClass && (
        <>
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-200">
                  Total Students
                </CardTitle>
                <Users className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-100">
                  {stats.totalStudents}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-200">
                  Present Today
                </CardTitle>
                <UserCheck className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400">
                  {stats.presentCount}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-200">
                  Absent Today
                </CardTitle>
                <UserX className="h-4 w-4 text-red-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-400">
                  {stats.absentCount}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-200">
                  Late Today
                </CardTitle>
                <Clock className="h-4 w-4 text-yellow-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-400">
                  {stats.lateCount}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Calendar
              value={selectedDate}
              onChange={setSelectedDate}
              attendanceData={attendanceData}
              minDate={new Date(2024, 0, 1)}
            />
            
            <AttendanceMarker
              date={selectedDate}
              classId={selectedClass}
              onSave={handleAttendanceSaved}
            />
          </div>
        </>
      )}
    </div>
  )
}