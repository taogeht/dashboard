// lib/users.ts
import { supabase } from '@/lib/supabase'

interface CreateUserParams {
  email: string
  password: string
  first_name: string
  last_name: string
  role: 'teacher' | 'admin'
}

export async function createUser({
  email,
  password,
  first_name,
  last_name,
  role
}: CreateUserParams) {
  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Automatically confirms the email
    })

    if (authError) throw authError

    // 2. Add user details to users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id, // Use the same ID as auth
        email,
        first_name,
        last_name,
        role,
      })
      .select()
      .single()

    if (userError) throw userError

    return userData
  } catch (error) {
    console.error('Error creating user:', error)
    throw error
  }
}