// components/Sidebar.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { BookOpen, Calendar, ClipboardList, FileSpreadsheet, Home, LogOut, Settings, Users, Building } from 'lucide-react'
import { useSupabase } from '@/components/supabase-provider'

const teacherLinks = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Classes', href: '/dashboard/classes', icon: BookOpen },
  { name: 'Attendance', href: '/dashboard/attendance', icon: Calendar },
  { name: 'Grades', href: '/dashboard/grades', icon: FileSpreadsheet },
]

const adminLinks = [
  ...teacherLinks,
  { name: 'Teachers', href: '/dashboard/teachers', icon: Users },
  { name: 'Students', href: '/dashboard/students', icon: Users },
  { name: 'School Overview', href: '/dashboard/overview', icon: ClipboardList },
]

// In your Sidebar component
const superAdminLinks = [
  ...adminLinks,
  { name: 'Schools', href: '/dashboard/schools', icon: Building }
]


export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { supabase, user } = useSupabase()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSuperAdmin, setSuperAdmin] = useState(false) 

  useEffect(() => {
    if (!user) return

    const checkRole = async () => {
      try {
        const response = await fetch(`/api/user/role?userId=${user.id}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error)
        }

        setIsAdmin(data.role === 'admin')
        setSuperAdmin(data.role === 'super_admin')
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

  // Use correct links based on admin status
  const links = isAdmin
  ? adminLinks 
  : isSuperAdmin 
    ? superAdminLinks 
    : teacherLinks
  return (
    <div className={cn(
      "flex flex-col border-r border-gray-700 bg-gray-800/40 backdrop-blur-xl transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="flex h-14 items-center border-b border-gray-700 px-3">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold text-gray-100">ESL Dashboard</h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto text-gray-400 hover:text-gray-100"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? '→' : '←'}
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <nav className="flex flex-col gap-2 p-2">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              <span className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-gray-400 transition-all hover:text-gray-100",
                pathname === link.href ? "bg-gray-700 text-gray-100" : "hover:bg-gray-700"
              )}>
                <link.icon size={20} />
                {!isCollapsed && <span>{link.name}</span>}
              </span>
            </Link>
          ))}
        </nav>
      </ScrollArea>
      <div className="mt-auto border-t border-gray-700 p-2">
        <nav className="flex flex-col gap-2">
          <Link href="/dashboard/settings">
            <span className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-400 transition-all hover:text-gray-100 hover:bg-gray-700">
              <Settings size={20} />
              {!isCollapsed && <span>Settings</span>}
            </span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-400 transition-all hover:text-gray-100 hover:bg-gray-700 w-full text-left"
          >
            <LogOut size={20} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </nav>
      </div>
    </div>
  )
}