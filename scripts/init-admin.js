// scripts/init-admin.js
require('dotenv').config({ path: '.env.local' }) // Specifically load .env.local

const { createClient } = require('@supabase/supabase-js')

// Debug log to see what values we're getting
console.log('Environment Variables:', {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 5) + '...', // Only show first 5 chars for security
  adminEmail: process.env.INITIAL_ADMIN_EMAIL
})

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function initializeAdmin() {
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD
  
  if (!adminEmail || !adminPassword) {
    throw new Error('Missing admin credentials in environment variables')
  }

  try {
    // 1. Create the auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true
    })

    if (authError) throw authError

    // 2. Add admin details to users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: adminEmail,
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
      })
      .select()
      .single()

    if (userError) throw userError

    console.log('Admin account created successfully:', userData)
  } catch (error) {
    console.error('Failed to create admin account:', error)
    process.exit(1)
  }
}

initializeAdmin()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Initialization failed:', error)
    process.exit(1)
  })