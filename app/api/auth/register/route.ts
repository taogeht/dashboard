// app/api/auth/register/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

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
  try {
    // Get current user's session
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user's role
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role, school_id')
      .eq('id', currentUser.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { firstName, lastName, email, password, role, schoolId } = await request.json();

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Role-based permission checks
    switch (userData.role) {
      case 'super_admin':
        // Super admins can create any type of user
        break;
      
      case 'school_admin':
        // School admins can only create teachers in their school
        if (role !== 'teacher') {
          return NextResponse.json(
            { error: 'School admins can only create teacher accounts' },
            { status: 403 }
          );
        }
        if (schoolId !== userData.school_id) {
          return NextResponse.json(
            { error: 'Cannot create users for other schools' },
            { status: 403 }
          );
        }
        break;
      
      case 'teacher':
        // Teachers cannot create users
        return NextResponse.json(
          { error: 'Teachers are not authorized to create users' },
          { status: 403 }
        );
      
      default:
        return NextResponse.json(
          { error: 'Invalid user role' },
          { status: 403 }
        );
    }

    // Create auth user
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (signUpError) {
      console.error('Auth creation error:', signUpError);
      return NextResponse.json({ error: signUpError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 400 });
    }

    // Create user profile
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        role,
        school_id: schoolId || null
      });

    if (profileError) {
      // Clean up auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      console.error('Profile creation error:', profileError);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Registration failed' 
    }, { status: 500 });
  }
}