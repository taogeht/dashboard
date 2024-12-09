// app/layout.tsx
import './globals.css'
import { Inter } from 'next/font/google'
import SupabaseProvider from '@/components/supabase-provider'
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
  const supabaseServer = createServerComponentClient<Database>({ 
    cookies: () => cookieStore 
  })
  
  const {
    data: { user },
  } = await supabaseServer.auth.getUser()

  return (
    <html lang="en">
          <body className="bg-black min-h-screen">
        <SupabaseProvider serverSession={user}>
          {children}
        </SupabaseProvider>
      </body>
    </html>
  )
}