'use server'

import { createAdminClient } from '@/utils/supabase/server'

/**
 * MASTER GOURMET SEED (v4)
 * Guarantees zero duplicates and high-precision unique imagery.
 */
export async function seedMenu() {
    const supabase = await createAdminClient()

    try {
        // 0. NUCLEAR PURGE: Clear orders first to break FK constraints
        await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000')

        // 1. CLEAR MENU: Safe to delete now
        await supabase.from('menu_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000')

        // 2. ALL-NEW CATEGORIES
        const categories = [
            { name: 'Appetizers', slug: 'starters', display_order: 1 },
            { name: 'Signature Mains', slug: 'main-course', display_order: 2 },
            { name: 'Artisan Drinks', slug: 'drinks', display_order: 3 },
            { name: 'Grand Finales', slug: 'desserts', display_order: 4 },
        ]

        const { data: catData, error: catError } = await supabase
            .from('categories')
            .upsert(categories, { onConflict: 'slug' })
            .select()

        if (catError) throw new Error(`Cat Error: ${catError.message}`)

        const startersId = catData.find(c => c.slug === 'starters')?.id
        const mainId = catData.find(c => c.slug === 'main-course')?.id
        const drinksId = catData.find(c => c.slug === 'drinks')?.id
        const dessertsId = catData.find(c => c.slug === 'desserts')?.id

        // 3. UNIQUE CULINARY MASTERPIECES (15 Items)
        // Each ID is curated to be distinct and relevant.
        const items = [
            // --- APPETIZERS ---
            {
                category_id: startersId,
                name: 'Honey Glazed Halloumi',
                price: 850,
                description: 'Caramelized Cypriot cheese with wildflower honey and toasted sesame.',
                image_url: 'https://images.unsplash.com/photo-1691200007743-0652bbbc1d7d?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                is_available: true
            },
            {
                category_id: startersId,
                name: 'Mediterranean Octopus',
                price: 1450,
                description: 'Tender charred tentacles with lemon-infused olive oil and paprika silk.',
                image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=800&auto=format&fit=crop',
                is_available: true
            },
            {
                category_id: startersId,
                name: 'Golden Truffle Arancini',
                price: 750,
                description: 'Crispy risotto spheres with a wild mushroom and truffle heart.',
                image_url: 'https://images.unsplash.com/photo-1541529086526-db283c563270?q=80&w=800&auto=format&fit=crop',
                is_available: true
            },
            {
                category_id: startersId,
                name: 'Ahi Tuna Tartare',
                price: 1250,
                description: 'Hand-cut yellowfin tuna with avocado and ginger-soy reduction.',
                image_url: 'https://images.unsplash.com/photo-1546039907-7fa05f864c02?q=80&w=800&auto=format&fit=crop',
                is_available: true
            },

            // --- SIGNATURE MAINS ---
            {
                category_id: mainId,
                name: 'Miso Glazed Black Cod',
                price: 3200,
                description: 'Sweet miso-marinated cod seared to a buttery finish.',
                image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=800&auto=format&fit=crop',
                is_available: true
            },
            {
                category_id: mainId,
                name: 'Butter Poached Lobster',
                price: 4500,
                description: 'Maine lobster poaching in cultured butter with saffron bisque.',
                image_url: 'https://images.unsplash.com/photo-1533682805518-48d1f5b8cd3a?q=80&w=800&auto=format&fit=crop',
                is_available: true
            },
            {
                category_id: mainId,
                name: 'Black Truffle Tagliatelle',
                price: 1950,
                description: 'Silky pasta ribbons tossed in a decadent parmesan-truffle cream.',
                image_url: 'https://images.unsplash.com/photo-1473093226795-af9932fe5856?q=80&w=800&auto=format&fit=crop',
                is_available: true
            },
            {
                category_id: mainId,
                name: 'Pan Roasted Sea Bream',
                price: 2400,
                description: 'Crispy skin white fish with fennel salad and aromatic herb oil.',
                image_url: 'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?q=80&w=800&auto=format&fit=crop',
                is_available: true
            },
            {
                category_id: mainId,
                name: 'Slow Cooked Lamb Shank',
                price: 2800,
                description: 'Tender braised lamb in a rich rosemary and port wine reduction.',
                image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop',
                is_available: true
            },
            {
                category_id: mainId,
                name: 'Sea Bass Pao',
                price: 2600,
                description: 'Gourmet sea bass steamed with soy-ginger glaze and Asian greens.',
                image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop',
                is_available: true
            },

            // --- ARTISAN DRINKS ---
            {
                category_id: drinksId,
                name: 'Sparkling Yuzu Soda',
                price: 450,
                description: 'Effervescent Japanese citrus with organic cane syrup.',
                image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=800&auto=format&fit=crop',
                is_available: true
            },
            {
                category_id: drinksId,
                name: 'Matcha Rose Frappé',
                price: 550,
                description: 'Ceremonial grade matcha blended with rose and oat milk.',
                image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=800&auto=format&fit=crop',
                is_available: true
            },

            // --- GRAND FINALES ---
            {
                category_id: dessertsId,
                name: '24K Gold Chocolate Fondant',
                price: 950,
                description: 'Molten chocolate center with 24k edible gold leaf.',
                image_url: 'https://images.unsplash.com/photo-1481391243133-f96216dcb5d2?q=80&w=800&auto=format&fit=crop',
                is_available: true
            },
            {
                category_id: dessertsId,
                name: 'Berry Blush Cheesecake',
                price: 750,
                description: 'Madagascar vanilla cheesecake with vibrant forest berry reduction.',
                image_url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=800&auto=format&fit=crop',
                is_available: true
            },
            {
                category_id: dessertsId,
                name: 'Vanilla Bean Pannacotta',
                price: 850,
                description: 'Silky cream infused with vanilla beans and passionfruit coulis.',
                image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?q=80&w=800&auto=format&fit=crop',
                is_available: true
            }
        ]

        const { error: itemError } = await supabase.from('menu_items').insert(items)
        if (itemError) throw new Error(`Item Error: ${itemError.message}`)

        return { success: true }
    } catch (e: any) {
        console.error('Seed Failed:', e)
        return { error: e.message }
    }
}
