'use server'

import { createClient, createAdminClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    redirect('/menu')
}

export async function signup(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string

    const adminSupabase = await createAdminClient()

    // 1. Create user via Admin API to bypass email confirmation/limits
    const { data: userData, error: userError } = await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm the email
        user_metadata: { full_name: fullName }
    })

    if (userError) {
        return { error: userError.message }
    }

    // 2. Create profile
    if (userData.user) {
        const { error: profileError } = await adminSupabase.from('profiles').insert({
            id: userData.user.id,
            full_name: fullName,
            email: email,
        })

        if (profileError) {
            console.error('Error creating profile:', profileError)
        }
    }

    // 3. Log them in manually since Admin API doesn't create a session
    const supabase = await createClient()
    const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (loginError) {
        return { error: loginError.message }
    }

    redirect('/menu')
}

export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/')
}

export async function adminLogin(formData: FormData) {
    const username = formData.get('username') as string
    const password = formData.get('password') as string

    if (
        username === process.env.ADMIN_USERNAME &&
        password === process.env.ADMIN_PASSWORD
    ) {
        const supabase = await createClient()
        // For admin, we use a simple cookie-based approach or a special session
        // In this demo, we'll set a cookie manually or just use the admin credentials in middleware
        // Actually, let's just set a cookie "is_admin=true" for simplicity in this free demo
        const response = redirect('/admin/dashboard')
        return response
    }

    return { error: 'Invalid admin credentials' }
}
