// app/api/auth/register/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export const POST = async (request: Request) => {
  console.log('Registration endpoint hit')
  
  try {
    const { firstName, lastName, email, password } = await request.json()
    console.log('Received data:', { firstName, lastName, email })

    // Create auth user
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (signUpError) {
      console.error('Auth creation error:', signUpError)
      return NextResponse.json({ error: signUpError.message }, { status: 400 })
    }

    if (authData.user) {
      // Use raw SQL query
      const { error: profileError } = await supabaseAdmin.rpc('insert_user', {
        user_id: authData.user.id,
        user_email: email,
        user_first_name: firstName,
        user_last_name: lastName
      })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        return NextResponse.json({ error: profileError.message }, { status: 400 })
      }

      return NextResponse.json({ success: true, user: authData.user })
    }

    return NextResponse.json({ error: 'Failed to create user' }, { status: 400 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Registration failed' 
    }, { status: 500 })
  }
}