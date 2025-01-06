'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { 
  BookOpen, 
  Calendar, 
  ClipboardList, 
  FileSpreadsheet, 
  Home, 
  LogOut, 
  Settings, 
  Users, 
  Building,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useSupabase } from '@/components/supabase-provider'
import SchoolSelector from './SchoolSelector'
import { useSchool } from '@/context/SchoolContext'

interface NavLink {
  name: string
  href: string
  icon: React.ElementType
  requiresSchool: boolean
}

const teacherLinks: NavLink[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, requiresSchool: true },
  { name: 'Classes', href: '/dashboard/classes', icon: BookOpen, requiresSchool: true },
  { name: 'Attendance', href: '/dashboard/attendance', icon: Calendar, requiresSchool: true },
  { name: 'Grades', href: '/dashboard/grades', icon: FileSpreadsheet, requiresSchool: true },
]

const schoolAdminLinks: NavLink[] = [
  ...teacherLinks,
  { name: 'Teachers', href: '/dashboard/teachers', icon: Users, requiresSchool: true },
  { name: 'Students', href: '/dashboard/students', icon: Users, requiresSchool: true },
  { name: 'School Overview', href: '/dashboard/overview', icon: ClipboardList, requiresSchool: true },
]

const superAdminLinks: NavLink[] = [
  { name: 'Schools', href: '/dashboard/schools', icon: Building, requiresSchool: false },
  ...schoolAdminLinks,
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { supabase, user } = useSupabase()
  const { selectedSchool } = useSchool()
  const [userRole, setUserRole] = useState<'teacher' | 'school_admin' | 'super_admin' | null>(null)

  useEffect(() => {
    if (!user) {
      console.log('No user found, skipping role check')
      return
    }
  
    const checkRole = async () => {
      console.log('Checking role for user:', user.id)
      try {
        const response = await fetch(`/api/user/role?userId=${user.id}`)
        const data = await response.json()
  
        console.log('Role check response:', data)
  
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch user role')
        }
  
        setUserRole(data.role)
        console.log('Role set successfully:', data.role)
      } catch (error) {
        console.error('Error checking role:', error)
      }
    }
  
    checkRole()
  }, [user])

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push('/login')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  // Get navigation links based on user role
  const getNavLinks = () => {
    switch (userRole) {
      case 'super_admin':
        return superAdminLinks
      case 'school_admin':
        return schoolAdminLinks
      case 'teacher':
        return teacherLinks
      default:
        return []
    }
  }

  // Filter links based on whether a school is selected
  const visibleLinks = getNavLinks().filter(link => 
    !link.requiresSchool || (link.requiresSchool && selectedSchool)
  )

  const NavLink = ({ link }: { link: NavLink }) => {
    const isActive = pathname === link.href
    const Icon = link.icon

    return (
      <Link href={
        selectedSchool && link.requiresSchool 
          ? `${link.href}?schoolId=${selectedSchool.id}` 
          : link.href
      }>
        <span className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-400 transition-all hover:text-gray-100",
          isActive ? "bg-gray-700 text-gray-100" : "hover:bg-gray-700",
          "group"
        )}>
          <Icon size={20} className={cn(
            "transition-colors",
            isActive ? "text-blue-400" : "group-hover:text-blue-400"
          )} />
          {!isCollapsed && <span>{link.name}</span>}
        </span>
      </Link>
    )
  }

  return (
    <div className={cn(
      "flex flex-col border-r border-gray-700 bg-gray-800/40 backdrop-blur-xl transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="flex h-14 items-center border-b border-gray-700 px-3">
        {!isCollapsed && userRole === 'super_admin' && (
          <SchoolSelector />
        )}
        {!isCollapsed && userRole !== 'super_admin' && (
          <h2 className="text-lg font-semibold text-gray-100">ESL Dashboard</h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto text-gray-400 hover:text-gray-100"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-2 p-2">
          {visibleLinks.map((link) => (
            <NavLink key={link.href} link={link} />
          ))}
        </nav>
      </ScrollArea>

      <div className="mt-auto border-t border-gray-700 p-2">
        <nav className="flex flex-col gap-2">
          <Link href="/dashboard/settings">
            <span className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-400 transition-all hover:text-gray-100 hover:bg-gray-700 group">
              <Settings size={20} className="group-hover:text-blue-400" />
              {!isCollapsed && <span>Settings</span>}
            </span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-400 transition-all hover:text-gray-100 hover:bg-gray-700 w-full text-left group"
          >
            <LogOut size={20} className="group-hover:text-blue-400" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </nav>
      </div>
    </div>
  )
}