import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useSchool } from '@/context/SchoolContext'
import { useSupabase } from '@/components/supabase-provider'
import { useState, useEffect } from 'react'
import { Users, BookOpen, GraduationCap, School, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SchoolStats {
  totalTeachers: number
  totalStudents: number
  totalClasses: number
  averageAttendance: number
}

interface QuickActionCard {
  title: string
  href: string
  icon: React.ElementType
  description?: string
}

const quickActions: QuickActionCard[] = [
  {
    title: "Family and Friends",
    href: "https://www.oxfordlearnersbookshelf.com/home/main.html",
    icon: BookOpen,
    description: "Access your Oxford Learner's Bookshelf materials"
  },
  // Add more quick action cards here as needed
]

export default function AdminDashboard() {
  const { selectedSchool } = useSchool()
  const { supabase } = useSupabase()
  const [stats, setStats] = useState<SchoolStats>({
    totalTeachers: 0,
    totalStudents: 0,
    totalClasses: 0,
    averageAttendance: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchSchoolStats = async () => {
      if (!selectedSchool) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Get teachers count
        const { count: teachersCount, error: teachersError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', selectedSchool.id)
          .eq('role', 'teacher')

        if (teachersError) throw teachersError

        // Get students count
        const { count: studentsCount, error: studentsError } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', selectedSchool.id)

        if (studentsError) throw studentsError

        // Get classes count
        const { count: classesCount, error: classesError } = await supabase
          .from('classes')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', selectedSchool.id)

        if (classesError) throw classesError

        // Get attendance data (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        // Updated attendance query to join with classes
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendance')
          .select(`
            status,
            classes!inner(school_id)
          `)
          .eq('classes.school_id', selectedSchool.id)
          .gte('date', thirtyDaysAgo.toISOString().split('T')[0])

        if (attendanceError) throw attendanceError

        const presentCount = attendanceData?.filter(record => 
          record.status === 'present'
        ).length || 0

        const attendanceRate = attendanceData?.length 
          ? (presentCount / attendanceData.length) * 100 
          : 0

        setStats({
          totalTeachers: teachersCount || 0,
          totalStudents: studentsCount || 0,
          totalClasses: classesCount || 0,
          averageAttendance: Math.round(attendanceRate)
        })
      } catch (err) {
        console.error('Error fetching school stats:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch school statistics')
      } finally {
        setLoading(false)
      }
    }

    fetchSchoolStats()
  }, [selectedSchool])

  if (!selectedSchool) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-gray-400">Please select a school to view the dashboard statistics.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/50 text-red-200 p-4 rounded-lg border border-red-800">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 border-0">
        <CardContent className="py-4">
          <h2 className="text-2xl font-bold text-white">
            {selectedSchool.name}
          </h2>
          <p className="text-blue-100 mt-1">
            School Administration Dashboard
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card 
          className="bg-gray-800 border-gray-700 cursor-pointer hover:bg-gray-700/50 transition"
          onClick={() => router.push('/dashboard/teachers')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">
              Teachers
            </CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-100">
              {stats.totalTeachers}
            </div>
            <p className="text-xs text-gray-400">
              Active teachers
            </p>
          </CardContent>
        </Card>

        <Card 
          className="bg-gray-800 border-gray-700 cursor-pointer hover:bg-gray-700/50 transition"
          onClick={() => router.push('/dashboard/students')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">
              Students
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-100">
              {stats.totalStudents}
            </div>
            <p className="text-xs text-gray-400">
              Enrolled students
            </p>
          </CardContent>
        </Card>

        <Card 
          className="bg-gray-800 border-gray-700 cursor-pointer hover:bg-gray-700/50 transition"
          onClick={() => router.push('/dashboard/classes')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">
              Classes
            </CardTitle>
            <BookOpen className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-100">
              {stats.totalClasses}
            </div>
            <p className="text-xs text-gray-400">
              Active classes
            </p>
          </CardContent>
        </Card>

        <Card 
          className="bg-gray-800 border-gray-700 cursor-pointer hover:bg-gray-700/50 transition"
          onClick={() => router.push('/dashboard/attendance')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">
              Attendance Rate
            </CardTitle>
            <School className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-100">
              {stats.averageAttendance}%
            </div>
            <p className="text-xs text-gray-400">
              30-day average
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-200">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-400 text-sm">
              Recent school-wide activity will be shown here
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-200">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {quickActions.map((action, index) => (
                <div key={index} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-gray-200 font-medium">{action.title}</h3>
                    <action.icon className="h-4 w-4 text-gray-400" />
                  </div>
                  {action.description && (
                    <p className="text-sm text-gray-400 mb-3">{action.description}</p>
                  )}
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => window.open(action.href, '_blank')}
                  >
                    Open Resource
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}