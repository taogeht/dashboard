'use client'
import { useState, useEffect } from 'react'
import { useSupabase } from '@/components/supabase-provider'
import SchoolAdminDashboard from '@/components/SchoolAdminDashboard'
import TeacherDashboard from '@/components/TeacherDashboard'
import { useSchool } from '@/context/SchoolContext'
import { Loader2 } from 'lucide-react'

interface School {
  id: string
  name: string
}

interface UserData {
  role: string
  school_id: string | null
  school: School[] | null
}

export default function DashboardPage() {
  const { supabase, user } = useSupabase()
  const { setSelectedSchool } = useSchool()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkRoleAndSchool = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('users')
          .select(`
            role,
            school_id,
            school:schools!inner (
              id,
              name
            )
          `)
          .eq('id', user.id)
          .single()
            
        if (error) throw error
        const userData = data as UserData
        setUserRole(userData.role)
        
        // If user is a school_admin, automatically set their school
        if (userData.role === 'school_admin' && userData.school?.[0]) {
          setSelectedSchool(userData.school[0])
        }
      } catch (error) {
        console.error('Error checking role:', error)
      } finally {
        setLoading(false)
      }
    }

    checkRoleAndSchool()
  }, [user, setSelectedSchool, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  switch (userRole) {
    case 'teacher':
      return <TeacherDashboard />
    case 'school_admin':
    case 'super_admin':
      return <SchoolAdminDashboard />
    default:
      return <div className="text-gray-100">Unknown user role</div>
  }
}
