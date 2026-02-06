"use client";

import { useEffect, useState } from "react";
import { CartItem } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Trash2, Calendar, Clock, ChevronRight, ShoppingBag } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { getDailyAvailability } from "@/actions/orders";
import { createClient } from "@/utils/supabase/client";

export default function CartPage() {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [visitDate, setVisitDate] = useState("");
    const [visitTime, setVisitTime] = useState("");
    const [loading, setLoading] = useState(true);
    const [timeError, setTimeError] = useState("");
    const [availability, setAvailability] = useState<Record<string, number>>({});
    const [user, setUser] = useState<any>(null);
    const [mounted, setMounted] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        setMounted(true);
        const fetchInitialData = async () => {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (!currentUser) {
                window.location.href = "/login";
                return;
            }
            setUser(currentUser);

            const cartKey = `cart_${currentUser.id}`;
            const savedCartString = localStorage.getItem(cartKey);
            const availRes = await getDailyAvailability();
            if (availRes.availability) setAvailability(availRes.availability);

            if (savedCartString) {
                const localCart: CartItem[] = JSON.parse(savedCartString);

                // Fetch current menu items to validate IDs
                const { data: currentItems } = await supabase.from('menu_items').select('id');
                const validIds = new Set(currentItems?.map(i => i.id) || []);

                // Filter out stale items
                const validCart = localCart.filter(item => validIds.has(item.id));

                if (validCart.length !== localCart.length) {
                    toast.error("Some items in your ritual are no longer available and were removed.", {
                        duration: 4000,
                        icon: '✨'
                    });
                    localStorage.setItem(cartKey, JSON.stringify(validCart));
                }

                setCart(validCart);
            }
            setLoading(false);
        };
        fetchInitialData();
    }, []);

    const updateQuantity = (id: string, delta: number) => {
        const newCart = cart.map(item => {
            if (item.id === id) {
                const totalOrderedToday = availability[id] || 0;
                // Since this item is already in 'cart', its current quantity is NOT yet in 'availability' (which tracks finalized orders)
                // So we just check if totalOrderedToday + new quantity <= 10
                const nextQty = Math.min(5, Math.max(1, item.quantity + delta));

                if (delta > 0 && totalOrderedToday + nextQty > 10) {
                    toast.error(`Sold Out: Only ${10 - totalOrderedToday} portions left for today across all orders.`, {
                        icon: '⚠️',
                        style: { borderRadius: '10px', background: '#333', color: '#fff' }
                    });
                    return item;
                }

                if (nextQty === 5 && delta > 0) {
                    toast.error("Limit: 5 portions per masterpiece", {
                        icon: '⚠️',
                        style: { borderRadius: '10px', background: '#333', color: '#fff' }
                    });
                }
                return { ...item, quantity: nextQty };
            }
            return item;
        });
        setCart(newCart);
        if (user) {
            localStorage.setItem(`cart_${user.id}`, JSON.stringify(newCart));
        }
    };

    const removeItem = (id: string) => {
        const newCart = cart.filter(item => item.id !== id);
        setCart(newCart);
        if (user) {
            localStorage.setItem(`cart_${user.id}`, JSON.stringify(newCart));
        }
        toast.error("Item removed from cart");
    };

    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const discount = subtotal * 0.10;
    const total = subtotal - discount;
    const payNow = total * 0.5;
    const payLater = total * 0.5;

    const today = new Date().toISOString().split('T')[0];

    const validateTime = (date: string, time: string) => {
        if (!time) return "";
        const [hours, minutes] = time.split(':').map(Number);
        const selectedTimeValue = hours + minutes / 60;

        // Hotel is Open Only Till 11am to 11pm
        if (selectedTimeValue < 11 || selectedTimeValue > 23) {
            return "Our kitchen creates rituals from 11:00 AM to 11:00 PM only.";
        }

        if (date === today) {
            const now = new Date();
            const currentHours = now.getHours();
            const currentMinutes = now.getMinutes();
            if (hours < currentHours || (hours === currentHours && minutes <= currentMinutes)) {
                return "The past has already faded. Please select a future time.";
            }
        }
        return "";
    };

    const handleTimeChange = (time: string) => {
        const error = validateTime(visitDate, time);
        setTimeError(error);
        setVisitTime(time);
    };

    const handleDateChange = (date: string) => {
        const error = validateTime(date, visitTime);
        setTimeError(error);
        setVisitDate(date);
    };

    if (!mounted || loading) return null;

    return (
        <div className="min-h-screen bg-[#fdfaf5] px-4 py-12 md:py-24 font-sans text-[#1c1c1c]">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-4 mb-12">
                    <div className="bg-[#1c1c1c] p-3 rounded-2xl">
                        <ShoppingBag className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-serif font-bold italic">Your Selection</h1>
                        <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-1">Review your order before the ritual</p>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-12">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-6">
                        {cart.length === 0 ? (
                            <div className="bg-white p-20 rounded-[40px] text-center border border-neutral-100 shadow-sm">
                                <p className="text-neutral-400 mb-8 font-serif italic text-lg">Your basket is waiting for inspiration...</p>
                                <Link
                                    href="/menu"
                                    className="inline-flex items-center gap-2 bg-[#1c1c1c] text-white px-10 py-4 rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-amber-600 transition-all shadow-xl shadow-black/5"
                                >
                                    Browse Our Menu
                                </Link>
                            </div>
                        ) : (
                            <>
                                <AnimatePresence mode="popLayout">
                                    {cart.map((item) => (
                                        <motion.div
                                            key={item.id}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="bg-white p-6 rounded-[32px] flex items-center gap-6 border border-neutral-100 shadow-sm hover:shadow-md transition-shadow"
                                        >
                                            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-neutral-50 flex-shrink-0">
                                                <img src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200'} alt={item.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-grow">
                                                <h3 className="text-lg font-serif font-bold">{item.name}</h3>
                                                <div className="flex items-center gap-3">
                                                    <p className="text-amber-600 font-bold">₹{item.price}</p>
                                                    <span className="text-[9px] font-black uppercase tracking-[0.1em] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-400 border border-neutral-200">
                                                        {10 - (availability[item.id] || 0)} left today
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 bg-neutral-50 rounded-2xl px-3 py-2 border border-neutral-100">
                                                <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-amber-600 transition-colors">
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                                <span className="w-6 text-center font-bold text-sm tracking-tighter">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-amber-600 transition-colors">
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <button onClick={() => removeItem(item.id)} className="p-3 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {/* Visit Scheduling */}
                                <div className="bg-white p-10 rounded-[40px] border border-neutral-100 shadow-sm space-y-8">
                                    <h2 className="text-2xl font-serif font-bold flex items-center gap-3">
                                        <Calendar className="w-6 h-6 text-amber-600" />
                                        Scheduling Your Visit
                                    </h2>
                                    <div className="grid sm:grid-cols-2 gap-8">
                                        <div>
                                            <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-neutral-400 mb-3 block ml-1">Preferred Date</label>
                                            <input
                                                type="date"
                                                min={today}
                                                value={visitDate}
                                                onChange={(e) => handleDateChange(e.target.value)}
                                                className="w-full p-4 rounded-2xl border border-neutral-100 bg-neutral-50 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase font-bold tracking-[0.2em] text-neutral-400 mb-3 block ml-1">Preferred Time</label>
                                            <input
                                                type="time"
                                                value={visitTime}
                                                onChange={(e) => handleTimeChange(e.target.value)}
                                                className={`w-full p-4 rounded-2xl border bg-neutral-50 outline-none focus:ring-2 focus:ring-amber-500/20 transition-all font-medium ${timeError ? 'border-red-200 focus:border-red-500' : 'border-neutral-100 focus:border-amber-500'}`}
                                            />
                                            {timeError && (
                                                <motion.p
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="text-[10px] font-bold text-red-500 uppercase tracking-wider mt-3 ml-1"
                                                >
                                                    ⚠️ {timeError}
                                                </motion.p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Checkout Summary */}
                    <div className="relative">
                        <div className="sticky top-12 bg-[#1c1c1c] text-white p-10 rounded-[50px] shadow-2xl overflow-hidden group">
                            {/* Decorative glow */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />

                            <h2 className="text-3xl font-serif font-bold mb-8">Summary</h2>
                            <div className="space-y-6 mb-10 pb-8 border-b border-white/10">
                                <div className="flex justify-between text-neutral-400 text-sm">
                                    <span className="font-medium">Subtotal</span>
                                    <span className="font-bold text-white tracking-tighter">₹{subtotal.toFixed(0)}</span>
                                </div>
                                <div className="flex justify-between text-neutral-400 text-sm">
                                    <span className="font-medium text-green-500">Gourmet Discount (10%)</span>
                                    <span className="font-bold text-green-500 tracking-tighter">-₹{discount.toFixed(0)}</span>
                                </div>
                                <div className="pt-2 flex justify-between text-2xl font-serif">
                                    <span className="font-bold italic">Total</span>
                                    <span className="font-bold text-amber-500">₹{total.toFixed(0)}</span>
                                </div>
                            </div>

                            <div className="space-y-4 mb-10">
                                <div className="bg-white/5 p-5 rounded-3xl flex justify-between items-center border border-white/5">
                                    <div>
                                        <span className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest block mb-1">Ritual Deposit (50%)</span>
                                        <span className="font-serif text-2xl font-bold tracking-tighter text-amber-500">₹{payNow.toFixed(0)}</span>
                                    </div>
                                    <div className="bg-amber-500/10 p-2 rounded-xl">
                                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                                    </div>
                                </div>
                                <div className="bg-white/5 p-5 rounded-3xl flex justify-between items-center border border-white/5">
                                    <div>
                                        <span className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest block mb-1">Final Payment</span>
                                        <span className="font-serif text-2xl font-bold tracking-tighter">₹{payLater.toFixed(0)}</span>
                                    </div>
                                    <span className="text-[8px] font-bold text-neutral-500 uppercase">At Desk</span>
                                </div>
                            </div>

                            <button
                                disabled={cart.length === 0 || !visitDate || !visitTime || !!timeError}
                                onClick={() => {
                                    sessionStorage.setItem("visit_date", visitDate);
                                    sessionStorage.setItem("visit_time", visitTime);
                                    window.location.href = "/checkout";
                                }}
                                className="w-full bg-white text-[#1c1c1c] hover:bg-amber-600 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed py-5 rounded-3xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-xl"
                            >
                                Confirm Arrival <ChevronRight size={16} />
                            </button>

                            <p className="mt-6 text-center text-[10px] text-neutral-500 font-bold uppercase tracking-[0.1em]">
                                Secure Transmission Guaranteed
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
