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
  schools?: School
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
        // First, get the user's role without joining schools
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role, school_id')
          .eq('id', user.id)
          .single()

        if (userError) throw userError
        
        setUserRole(userData.role)

        // If user is a school_admin and has a school_id, fetch the school details
        if (userData.role === 'school_admin' && userData.school_id) {
          const { data: schoolData, error: schoolError } = await supabase
            .from('schools')
            .select('id, name')
            .eq('id', userData.school_id)
            .single()

          if (schoolError) throw schoolError

          if (schoolData) {
            setSelectedSchool(schoolData)
          }
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