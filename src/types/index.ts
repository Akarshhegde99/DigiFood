export interface Profile {
    id: string;
    full_name: string | null;
    email: string;
    created_at: string;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    image_url: string | null;
    display_order: number;
}

export interface MenuItem {
    id: string;
    category_id: string;
    name: string;
    description: string | null;
    price: number;
    image_url: string | null;
    is_available: boolean;
    created_at: string;
}

export interface CartItem extends MenuItem {
    quantity: number;
}

export interface Order {
    id: string;
    user_id: string | null;
    total_amount: number;
    paid_amount: number;
    visit_time: string;
    status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
    payment_status: 'pending' | 'partially_paid' | 'fully_paid';
    customer_name: string | null;
    customer_phone: string | null;
    created_at: string;
}

export interface OrderItem {
    id: string;
    order_id: string;
    menu_item_id: string;
    quantity: number;
    price_at_time: number;
    menu_item?: MenuItem;
}
