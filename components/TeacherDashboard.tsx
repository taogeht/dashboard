import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSupabase } from '@/components/supabase-provider'
import { BookOpen, Users, Clock, FileSpreadsheet } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useRouter } from 'next/navigation'

interface TeacherStats {
  totalClasses: number
  totalStudents: number
  upcomingClasses: number
  school: {
    id: string
    name: string
  } | null
}

interface QuickActionCard {
  title: string
  href: string
  icon: React.ElementType
  description: string
}

const resourceLinks: QuickActionCard[] = [
  {
    title: "Family and Friends",
    href: "https://www.oxfordlearnersbookshelf.com/home/main.html",
    icon: BookOpen,
    description: "Access your Oxford Learner's Bookshelf materials"
  },
  {
    title: "ESL Library",
    href: "https://esllibrary.com/",
    icon: BookOpen,
    description: "Browse lesson plans and teaching materials"
  },
  {
    title: "Cambridge One",
    href: "https://www.cambridgeone.org/",
    icon: BookOpen,
    description: "Access Cambridge English teaching resources"
  },
  {
    title: "EF Teacher Zone",
    href: "https://www.ef.com/teacherzone/",
    icon: BookOpen,
    description: "Access EF teaching resources and materials"
  }
]

export default function TeacherDashboard() {
  const { supabase, user } = useSupabase()
  const [stats, setStats] = useState<TeacherStats>({
    totalClasses: 0,
    totalStudents: 0,
    upcomingClasses: 0,
    school: null
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchTeacherStats = async () => {
      if (!user) return

      try {
        setLoading(true)
        
        // Get teacher's school and classes
        const { data: teacherData, error: teacherError } = await supabase
          .from('users')
          .select(`
            school:schools (
              id,
              name
            ),
            classes (
              id,
              name,
              class_students (
                count
              )
            )
          `)
          .eq('id', user.id)
          .single()

        if (teacherError) throw teacherError

        // Calculate total students across all classes
        const totalStudents = teacherData.classes?.reduce((sum, cls) => {
          return sum + (cls.class_students?.[0]?.count || 0)
        }, 0) || 0

        setStats({
          totalClasses: teacherData.classes?.length || 0,
          totalStudents,
          upcomingClasses: teacherData.classes?.length || 0,
          school: teacherData.school?.[0] || null
        })

      } catch (err) {
        console.error('Error fetching teacher stats:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch teacher stats')
      } finally {
        setLoading(false)
      }
    }

    fetchTeacherStats()
  }, [user])

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
      {stats.school && (
        <Card className="bg-gradient-to-r from-blue-600 to-blue-700 border-0">
          <CardContent className="py-4">
            <h2 className="text-2xl font-bold text-white">
              {stats.school.name}
            </h2>
            <p className="text-blue-100 mt-1">
              Welcome to your teacher dashboard
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card 
          className="bg-gray-800 border-gray-700 cursor-pointer hover:bg-gray-700/50 transition"
          onClick={() => router.push('/dashboard/classes')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">
              My Classes
            </CardTitle>
            <BookOpen className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-100">{stats.totalClasses}</div>
            <p className="text-xs text-gray-400">Active classes</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-100">{stats.totalStudents}</div>
            <p className="text-xs text-gray-400">Across all classes</p>
          </CardContent>
        </Card>

        <Card 
          className="bg-gray-800 border-gray-700 cursor-pointer hover:bg-gray-700/50 transition"
          onClick={() => router.push('/dashboard/attendance')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">
              Today's Attendance
            </CardTitle>
            <Clock className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-100">{stats.upcomingClasses}</div>
            <p className="text-xs text-gray-400">Classes needing attendance</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-200">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push('/dashboard/attendance')}
              >
                <Clock className="mr-2 h-4 w-4" />
                Take Attendance
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push('/dashboard/grades')}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Enter Grades
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => router.push('/dashboard/classes')}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                View Classes
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-200">Teaching Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {resourceLinks.map((resource, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start hover:bg-gray-700"
                  onClick={() => window.open(resource.href, '_blank')}
                >
                  <div className="flex-1 text-left">
                    <div className="flex items-center">
                      <resource.icon className="mr-2 h-4 w-4 text-blue-400" />
                      <span className="font-medium">{resource.title}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{resource.description}</p>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}