'use server'

import { createAdminClient } from '@/utils/supabase/server'
import { MenuItem } from '@/types'

export async function addMenuItem(item: any) {
    const supabase = await createAdminClient()

    const { data, error } = await supabase
        .from('menu_items')
        .insert(item)
        .select()

    if (error) return { error: error.message }
    return { success: true, data }
}

export async function updateMenuItem(id: string, updates: any) {
    const supabase = await createAdminClient()

    const { data, error } = await supabase
        .from('menu_items')
        .update(updates)
        .eq('id', id)
        .select()

    if (error) return { error: error.message }
    return { success: true, data }
}

export async function deleteMenuItem(id: string) {
    const supabase = await createAdminClient()

    const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id)

    if (error) return { error: error.message }
    return { success: true }
}
