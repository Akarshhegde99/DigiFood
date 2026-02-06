'use server'

import { createClient, createAdminClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { CartItem } from '@/types'

export async function createOrder(cart: CartItem[], visitTime: string) {
    const supabase = await createClient()

    // 1. Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'You must be logged in to place an order.' }
    }

    // Use admin client for DB operations to ensure RLS doesn't block valid orders
    const adminSupabase = await createAdminClient()

    const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)
    const paidAmount = totalAmount * 0.5 // 50% simulation

    // 2. Create Order
    const { data: order, error: orderError } = await adminSupabase
        .from('orders')
        .insert({
            user_id: user.id,
            total_amount: totalAmount,
            paid_amount: paidAmount,
            visit_time: visitTime,
            status: 'pending',
            payment_status: 'partially_paid',
            customer_name: user.user_metadata?.full_name || user.email,
        })
        .select()
        .single()

    if (orderError) {
        return { error: orderError.message }
    }

    // 3. Create Order Items
    const orderItems = cart.map(item => ({
        order_id: order.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        price_at_time: item.price,
    }))

    const { error: itemsError } = await adminSupabase
        .from('order_items')
        .insert(orderItems)

    if (itemsError) {
        if (itemsError.message?.includes('violates foreign key constraint "order_items_menu_item_id_fkey"')) {
            return { error: 'Gourmet Selection Update: The menu has been recently refined. Some items in your ritual are no longer in our current reserve. Please refresh your selection.' }
        }
        return { error: itemsError.message }
    }

    return { orderId: order.id }
}

export async function updateOrderStatus(orderId: string, status: string) {
    const adminSupabase = await createAdminClient()

    const { error } = await adminSupabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)

    if (error) return { error: error.message }
    return { success: true }
}

export async function getAdminData() {
    const adminSupabase = await createAdminClient()

    const [ordersRes, itemsRes, catsRes] = await Promise.all([
        adminSupabase.from('orders').select('*, order_items(*, menu_items(*))').order('created_at', { ascending: false }),
        adminSupabase.from('menu_items').select('*').order('name'),
        adminSupabase.from('categories').select('*').order('display_order')
    ])

    const seen = new Set();
    const uniqueMenu = (itemsRes.data || []).filter((item: any) => {
        if (seen.has(item.name)) return false;
        seen.add(item.name);
        return true;
    });

    return {
        orders: ordersRes.data || [],
        menuItems: uniqueMenu,
        categories: catsRes.data || []
    }
}

export async function getUserOrders() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated' }

    const adminSupabase = await createAdminClient()
    const { data, error } = await adminSupabase
        .from('orders')
        .select('*, order_items(*, menu_items(*))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) return { error: error.message }
    return { orders: data || [] }
}

export async function getDailyAvailability() {
    const adminSupabase = await createAdminClient()
    const today = new Date().toISOString().split('T')[0]

    // Fetch all active orders created today (exclude cancelled)
    const { data: ordersToday, error: orderError } = await adminSupabase
        .from('orders')
        .select('id')
        .neq('status', 'cancelled')
        .gte('created_at', `${today}T00:00:00Z`)
        .lte('created_at', `${today}T23:59:59Z`)

    if (orderError) return { error: orderError.message }
    if (!ordersToday || ordersToday.length === 0) return { availability: {} }

    const orderIds = ordersToday.map(o => o.id)

    // Sum quantities per menu item
    const { data: items, error: itemError } = await adminSupabase
        .from('order_items')
        .select('menu_item_id, quantity')
        .in('order_id', orderIds)

    if (itemError) return { error: itemError.message }

    const counts: Record<string, number> = {}
    items?.forEach(item => {
        counts[item.menu_item_id] = (counts[item.menu_item_id] || 0) + item.quantity
    })

    return { availability: counts }
}

export async function getOrderById(orderId: string) {
    const adminSupabase = await createAdminClient()
    const { data, error } = await adminSupabase
        .from('orders')
        .select('*, order_items(*, menu_items(*))')
        .eq('id', orderId)
        .single()

    if (error) return { error: error.message }
    return { order: data }
}

export async function cancelOrder(orderId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const adminSupabase = await createAdminClient()

    // 1. Fetch the order
    const { data: order, error: fetchError } = await adminSupabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('user_id', user.id) // Ensure security
        .single()

    if (fetchError || !order) return { error: 'Order not found' }

    // 2. Policy: Can only cancel 3hrs ago
    const visitTime = new Date(order.visit_time).getTime()
    const now = new Date().getTime()
    const diffHours = (visitTime - now) / (1000 * 60 * 60)

    if (diffHours < 3) {
        return { error: 'Orders can only be cancelled at least 3 hours before the scheduled arrival.' }
    }

    // 3. Update status
    const { error: updateError } = await adminSupabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId)

    if (updateError) return { error: updateError.message }
    return { success: true }
}
