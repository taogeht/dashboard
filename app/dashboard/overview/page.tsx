'use client'
import React, { useState, useEffect } from 'react'
import { useSupabase } from '@/components/supabase-provider'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Users, GraduationCap, UserCheck, Clock } from 'lucide-react'

interface SupabaseGradeData {
  score: number | null
  classes: {
    name: string
  }[]
}

interface Stats {
  totalStudents: number
  totalTeachers: number
  totalClasses: number
  averageAttendance: number
  averageGrade: number
}

interface GradeData {
  score: number | null
  classes: {
    name: string
  }
}

interface AbsenceRecord {
  students: {
    first_name: string
    last_name: string
  }
  classes: {
    name: string
  }
}

interface ClassGrades {
  [className: string]: {
    total: number
    count: number
  }
}

interface PerformanceData {
  name: string
  average: number
}

export default function SchoolOverview() {
  const { supabase } = useSupabase()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    averageAttendance: 0,
    averageGrade: 0
  })
  const [todayAbsences, setTodayAbsences] = useState<AbsenceRecord[]>([])
  const [classPerformance, setClassPerformance] = useState<PerformanceData[]>([])
  
  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        setLoading(true)
        const today = new Date().toISOString().split('T')[0]

        // Fetch basic counts
        const [studentsCount, teachersCount, classesCount] = await Promise.all([
          supabase.from('students').select('id', { count: 'exact' }),
          supabase.from('users').select('id', { count: 'exact' }).eq('role', 'teacher'),
          supabase.from('classes').select('id', { count: 'exact' })
        ])

        // Fetch today's attendance
        const { data: attendanceData } = await supabase
          .from('attendance')
          .select(`
            students (
              first_name,
              last_name
            ),
            classes (
              name
            )
          `)
          .eq('date', today)
          .eq('status', 'absent')

        // Fetch class performance
        const { data: gradesData } = await supabase
          .from('grades')
          .select(`
            score,
            classes (
              name
            )
          `)
          .not ('score', 'is', null)

        // Calculate average grade per class
        const classGrades = (gradesData || []).reduce<Record<string, number[]>>((acc, grade) => {
          const className = grade.classes?.[0]?.name
          if (className && grade.score !== null) {
            if (!acc[className]) {
              acc[className] = []
            }
            acc[className].push(grade.score)
          }
          return acc
        }, {})

        const performanceData = Object.entries(classGrades).map(([name, scores]) => ({
          name,
          average: Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10) / 10
        }))

        // Calculate overall stats
        const totalStudents = studentsCount.count || 0
        const avgAttendance = (totalStudents - (attendanceData?.length || 0)) / totalStudents * 100
        const avgGrade = performanceData.length > 0
        ? Math.round(performanceData.reduce((sum, item) => sum + item.average, 0) / performanceData.length)
        : 0

        setStats({
          totalStudents,
          totalTeachers: teachersCount.count || 0,
          totalClasses: classesCount.count || 0,
          averageAttendance: Math.round(avgAttendance),
          averageGrade: avgGrade
        })

        setTodayAbsences((attendanceData || []) as unknown as AbsenceRecord[])
        setClassPerformance(performanceData)

      } catch (err) {
        console.error('Error fetching overview data:', err)
        setError('Failed to load overview data')
      } finally {
        setLoading(false)
      }
    }

    fetchOverviewData()
  }, [])

  if (loading) {
    return <div className="text-center text-gray-400">Loading overview data...</div>
  }

  if (error) {
    return <div className="text-center text-red-400">{error}</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-100">School Overview</h1>

      <div className="grid gap-4 md:grid-cols-4">
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
              Total Teachers
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-100">
              {stats.totalTeachers}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">
              Attendance Rate
            </CardTitle>
            <UserCheck className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {stats.averageAttendance}%
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">
              Average Grade
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">
              {stats.averageGrade}%
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-gray-200">
              Class Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={classPerformance}>
                  <XAxis 
                    dataKey="name" 
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '0.5rem'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="average" 
                    stroke="#60A5FA" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-gray-200">
              Today's Absences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todayAbsences.length === 0 ? (
                <p className="text-gray-400 text-center py-4">
                  No absences reported today
                </p>
              ) : (
                todayAbsences.map((absence, index) => (
                  <div 
                    key={index} 
                    className="flex justify-between items-center p-3 rounded-lg bg-gray-900/50 border border-gray-700"
                  >
                    <div>
                      <p className="text-gray-100">
                        {absence.students.first_name} {absence.students.last_name}
                      </p>
                      <p className="text-sm text-gray-400">
                        {absence.classes.name}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}