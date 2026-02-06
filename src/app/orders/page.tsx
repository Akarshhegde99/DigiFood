"use client";

import { useEffect, useState } from "react";
import { getUserOrders, cancelOrder } from "@/actions/orders";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Calendar, Clock, ChevronRight, Package, ArrowLeft, Loader2, XCircle, ShoppingCart } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

import { createClient } from "@/utils/supabase/client";

export default function OrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [cartCount, setCartCount] = useState(0);
    const [user, setUser] = useState<any>(null);
    const [mounted, setMounted] = useState(false);
    const supabase = createClient();

    const fetchOrders = async () => {
        setOrders([]);
        setLoading(true);
        const res = await getUserOrders();
        if (res.error) {
            toast.error(res.error);
        } else {
            setOrders(res.orders || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        setMounted(true);
        const init = async () => {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            setUser(currentUser);
            fetchOrders();
        };
        init();
    }, []);

    useEffect(() => {
        const updateCartCount = () => {
            if (!user?.id) {
                setCartCount(0);
                return;
            }
            const cart = JSON.parse(localStorage.getItem(`cart_${user.id}`) || "[]");
            const count = cart.reduce((acc: number, item: any) => acc + item.quantity, 0);
            setCartCount(count);
        };
        updateCartCount();
        const interval = setInterval(updateCartCount, 1000);
        return () => clearInterval(interval);
    }, [user?.id]);

    const handleCancel = async (orderId: string) => {
        if (!confirm("Are you sure you want to cancel this culinary ritual?")) return;

        const res = await cancelOrder(orderId);
        if (res.success) {
            toast.success("Ritual cancelled. Your refund token is being processed.", {
                icon: '🚫',
                style: { borderRadius: '10px', background: '#333', color: '#fff' }
            });
            fetchOrders();
        } else {
            toast.error(res.error || "Cancellation failed");
        }
    };

    if (!mounted || loading) {
        return (
            <div className="min-h-screen bg-[#fdfaf5] flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-amber-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fdfaf5] px-4 py-12 md:py-24 font-sans text-[#1c1c1c]">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-16">
                    <div className="flex items-center gap-4">
                        <Link href="/menu" className="p-3 rounded-2xl bg-white border border-neutral-100 hover:border-amber-500 transition-all shadow-sm">
                            <ArrowLeft className="w-5 h-5 text-neutral-400" />
                        </Link>
                        <div>
                            <h1 className="text-4xl font-serif font-bold italic">Your Rituals</h1>
                            <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-1">History of your digital dining</p>
                        </div>
                    </div>

                    <Link href="/cart" className="relative p-3 bg-[#1c1c1c] text-white rounded-2xl hover:bg-amber-600 transition-all shadow-lg active:scale-95">
                        <ShoppingCart className="w-5 h-5" />
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-[#1c1c1c]">
                                {cartCount}
                            </span>
                        )}
                    </Link>
                </div>

                {orders.length === 0 ? (
                    <div className="bg-white p-20 rounded-[40px] text-center border border-neutral-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="bg-neutral-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8">
                            <ShoppingBag className="w-10 h-10 text-neutral-200" />
                        </div>
                        <p className="text-neutral-400 mb-8 font-serif italic text-lg text-pretty max-w-sm mx-auto">Your culinary journey is just beginning. Every masterpiece leaves a memory...</p>
                        <Link
                            href="/menu"
                            className="inline-flex items-center gap-2 bg-[#1c1c1c] text-white px-10 py-4 rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-amber-600 transition-all shadow-xl shadow-black/5"
                        >
                            Explore creations
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {orders.map((order, idx) => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="group bg-white rounded-[40px] border border-neutral-100 shadow-sm hover:shadow-xl hover:shadow-amber-500/5 transition-all overflow-hidden"
                            >
                                <div className="p-8 md:p-10">
                                    <div className="flex flex-wrap justify-between items-start gap-4 mb-10 pb-8 border-b border-neutral-50">
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-neutral-400 uppercase font-black tracking-[0.2em]">Ritual Recorded</p>
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-xl font-bold font-serif italic">#{order.id.slice(0, 8).toUpperCase()}</h3>
                                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${order.status === 'approved' ? 'bg-green-50 text-green-600' :
                                                    order.status === 'rejected' ? 'bg-red-50 text-red-600' :
                                                        'bg-amber-50 text-amber-600'
                                                    }`}>
                                                    {order.status}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-[10px] text-neutral-400 uppercase font-black tracking-[0.2em] mb-1">Scheduled Date</p>
                                                <p className="text-sm font-bold flex items-center justify-end gap-2">
                                                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                                                    {new Date(order.visit_time).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-neutral-400 uppercase font-black tracking-[0.2em] mb-1">Preferred Time</p>
                                                <p className="text-sm font-bold flex items-center justify-end gap-2 text-amber-600">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {new Date(order.visit_time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-12">
                                        <div className="space-y-6">
                                            <p className="text-[10px] text-neutral-400 uppercase font-black tracking-[0.2em] mb-4 flex items-center gap-2">
                                                <Package className="w-3 h-3" />
                                                Selected Creations
                                            </p>
                                            <div className="space-y-4">
                                                {order.order_items?.map((item: any) => (
                                                    <div key={item.id} className="flex items-center gap-4 group/item">
                                                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0 group-hover/item:scale-110 transition-transform">
                                                            <img
                                                                src={item.menu_items?.image_url}
                                                                className="w-full h-full object-cover"
                                                                alt={item.menu_items?.name}
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200';
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="flex-grow">
                                                            <p className="text-sm font-bold">{item.menu_items?.name}</p>
                                                            <p className="text-xs text-neutral-400 font-serif italic">{item.quantity} portions</p>
                                                        </div>
                                                        <p className="text-sm font-bold tracking-tighter">₹{item.price_at_time * item.quantity}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-neutral-50/50 rounded-[32px] p-8 border border-neutral-100/50 flex flex-col justify-between">
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-neutral-400 font-bold uppercase tracking-widest">Total Value</span>
                                                    <span className="font-bold tracking-tighter">₹{order.total_amount}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-bold uppercase tracking-widest text-[#1c1c1c]">Deposit Cleared</span>
                                                    <span className="text-2xl font-serif font-black italic text-amber-600 tracking-tighter">₹{order.paid_amount}</span>
                                                </div>
                                            </div>

                                            <div className="mt-8 flex flex-col gap-4">
                                                <div className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-white flex items-center justify-between">
                                                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest italic">Payment Status</span>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${order.status === 'cancelled' ? 'text-red-600' : 'text-emerald-600'
                                                        }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${order.status === 'cancelled' ? 'bg-red-500' : 'bg-emerald-500'
                                                            }`} />
                                                        {order.status === 'cancelled' ? 'REFUNDED' : order.payment_status?.replace('_', ' ')}
                                                    </span>
                                                </div>

                                                {order.status !== 'cancelled' && order.status !== 'completed' && (
                                                    <div className="pt-2">
                                                        {(() => {
                                                            const visitTime = new Date(order.visit_time).getTime();
                                                            const now = new Date().getTime();
                                                            const isCancellable = (visitTime - now) > (3 * 60 * 60 * 1000);

                                                            return isCancellable ? (
                                                                <button
                                                                    onClick={() => handleCancel(order.id)}
                                                                    className="w-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all py-3 rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 border border-red-100 shadow-sm"
                                                                >
                                                                    <XCircle className="w-3.5 h-3.5" /> Cancel Ritual
                                                                </button>
                                                            ) : (
                                                                <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest text-center italic">
                                                                    Cancellation period expired (3hr policy)
                                                                </p>
                                                            );
                                                        })()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
