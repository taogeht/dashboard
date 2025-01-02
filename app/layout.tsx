// app/layout.tsx

import './globals.css'
import { Inter } from 'next/font/google'
import SupabaseProvider from '@/components/supabase-provider'
import { SchoolProvider } from '@/context/SchoolContext'
import { headers, cookies } from 'next/headers'
import { Database } from '@/lib/types/supabase'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'ESL Teacher Dashboard',
  description: 'Manage your ESL classes, attendance, and grades',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()  
  const supabase = createServerComponentClient<Database>({ 
    cookies: () => cookieStore 
  })
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <html lang="en">
      <body className="bg-black min-h-screen">
        <SupabaseProvider serverSession={user}>
          <SchoolProvider>
            {children}
          </SchoolProvider>
        </SupabaseProvider>
      </body>
    </html>
  )
}