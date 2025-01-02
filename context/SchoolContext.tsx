'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import { useSupabase } from '@/components/supabase-provider'

interface School {
  id: string
  name: string
}

interface UserData {
  id: string
  role: string
  school_id: string | null
}

interface SchoolContextType {
  selectedSchool: School | null
  setSelectedSchool: (school: School | null) => void
  schools: School[]
  loading: boolean
  error: string | null
  userRole: string | null
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined)

export function SchoolProvider({ children }: { children: React.ReactNode }) {
  const { supabase, user } = useSupabase()
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null)
  const [schools, setSchools] = useState<School[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserRoleAndSchools = async () => {
      if (!user) return

      try {
        setLoading(true)

        // First get user's role and school
        const { data, error: userError } = await supabase
          .from('users')
          .select(`
            id,
            role,
            school_id
          `)
          .eq('id', user.id)
          .single() as { data: UserData | null; error: any }

        if (userError) throw userError
        if (!data) throw new Error('No user data found')

        setUserRole(data.role)

        // Then fetch schools based on role
        let query = supabase.from('schools').select('id, name')

        // If school_admin, only fetch their school
        if (data.role === 'school_admin' && data.school_id) {
          query = query.eq('id', data.school_id)
        }

        const { data: schoolsData, error: schoolsError } = await query.order('name')
        
        if (schoolsError) throw schoolsError
        
        setSchools(schoolsData || [])

        // For school_admin, automatically set their school
        if (data.role === 'school_admin' && schoolsData && schoolsData.length > 0) {
          setSelectedSchool(schoolsData[0])
        }

      } catch (err) {
        console.error('Error fetching schools:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch schools')
      } finally {
        setLoading(false)
      }
    }

    fetchUserRoleAndSchools()
  }, [user])

  return (
    <SchoolContext.Provider
      value={{
        selectedSchool,
        setSelectedSchool,
        schools,
        loading,
        error,
        userRole
      }}
    >
      {children}
    </SchoolContext.Provider>
  )
}

export function useSchool() {
  const context = useContext(SchoolContext)
  if (context === undefined) {
    throw new Error('useSchool must be used within a SchoolProvider')
  }
  return context
}