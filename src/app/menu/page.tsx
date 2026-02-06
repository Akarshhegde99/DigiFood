"use client";

import { useEffect, useState } from "react";
import { MenuItem, Category } from "@/types";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ShoppingCart, Search, Database, LogOut, X, Info, ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";
import { seedMenu } from "@/actions/seed";
import { signOut } from "@/actions/auth";
import { getDailyAvailability } from "@/actions/orders";
import { GoldenParticles } from "@/components/ui/GoldenParticles";

export default function MenuPage() {
    const [items, setItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isSeeding, setIsSeeding] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
    const [availability, setAvailability] = useState<Record<string, number>>({});
    const [cartCount, setCartCount] = useState(0);
    const [mounted, setMounted] = useState(false);

    const supabase = createClient();

    const fetchData = async () => {
        setLoading(true);
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        const [catRes, itemRes, availRes] = await Promise.all([
            supabase.from('categories').select('*').order('display_order'),
            supabase.from('menu_items').select('*').eq('is_available', true),
            getDailyAvailability()
        ]);

        if (catRes.data) setCategories(catRes.data);
        if (itemRes.data) {
            // Safety Filter: Ensure only unique items by name are displayed
            const seen = new Set();
            const uniqueItems = itemRes.data.filter((item: any) => {
                if (seen.has(item.name)) return false;
                seen.add(item.name);
                return true;
            });
            setItems(uniqueItems);
        }
        if (availRes.availability) setAvailability(availRes.availability);

        setLoading(false);
    };

    useEffect(() => {
        setMounted(true);
        fetchData();

        const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user || null);
        });

        // Real-time Menu Sync
        const menuSub = supabase
            .channel('menu-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => {
                fetchData();
            })
            .subscribe();

        return () => {
            authSub.unsubscribe();
            supabase.removeChannel(menuSub);
        };
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

    const filteredItems = items.filter(item => {
        const matchesCategory = selectedCategory ? item.category_id === selectedCategory : true;
        const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
            (item.description?.toLowerCase().includes(search.toLowerCase()) ?? false);
        return matchesCategory && matchesSearch;
    });

    const requireAuth = (callback: () => void) => {
        if (!user) {
            toast.error("Please sign in to interact with our selection", {
                icon: '🔒',
                style: {
                    borderRadius: '10px',
                    background: '#1c1c1c',
                    color: '#fff',
                },
            });
            setTimeout(() => window.location.href = '/login', 1500);
            return;
        }
        callback();
    };

    const handleSeed = async () => {
        setIsSeeding(true);
        const res = await seedMenu();
        if (res.success) {
            toast.success("Menu seeded with 5-star items!");
            await fetchData();
        } else {
            toast.error("Seeding failed: " + res.error);
        }
        setIsSeeding(false);
    };

    const addToCart = (item: MenuItem) => {
        requireAuth(() => {
            const cartKey = `cart_${user.id}`;
            const cart = JSON.parse(localStorage.getItem(cartKey) || "[]");
            const existing = cart.find((i: any) => i.id === item.id);
            const totalOrdered = availability[item.id] || 0;
            const currentInCart = existing?.quantity || 0;

            if (totalOrdered + currentInCart >= 10) {
                toast.error("Sold Out: Today's ritual for this dish is complete", {
                    icon: '🥘',
                    style: { borderRadius: '10px', background: '#333', color: '#fff' }
                });
                return;
            }

            if (existing) {
                if (existing.quantity >= 5) {
                    toast.error("Limit: 5 portions per masterpiece", {
                        icon: '⚠️',
                        style: { borderRadius: '10px', background: '#333', color: '#fff' }
                    });
                    return;
                }
                existing.quantity += 1;
            } else {
                cart.push({ ...item, quantity: 1 });
            }
            localStorage.setItem(cartKey, JSON.stringify(cart));
            toast.success(`${item.name} added to cart!`, {
                icon: '🍽️',
                style: {
                    borderRadius: '10px',
                    background: '#333',
                    color: '#fff',
                },
            });
        });
    };

    if (!mounted || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#fdfaf5]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-amber-600"></div>
                    <p className="text-neutral-500 font-medium font-serif italic">Preparing the kitchen...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fdfaf5] pb-20 font-sans text-[#1c1c1c] relative">
            <GoldenParticles />
            {/* Header */}
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-neutral-100">
                <div className="max-w-7xl mx-auto px-4 h-24 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:block">
                            <h1 className="text-3xl font-serif font-bold">Our Menu</h1>
                            <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-1">Exquisite 5-Star Selection</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-6">
                        <div className="relative hidden lg:block group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-amber-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search our creations..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-12 pr-6 py-3 rounded-full bg-neutral-50 border border-neutral-100 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm w-72 transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4">
                            <a href="/cart" className="relative p-3 bg-[#1c1c1c] text-white rounded-full hover:bg-amber-600 transition-all shadow-lg hover:shadow-amber-500/20 active:scale-95">
                                <ShoppingCart className="w-5 h-5" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-[#1c1c1c]">
                                        {cartCount}
                                    </span>
                                )}
                            </a>
                            {user ? (
                                <div className="flex items-center gap-3">
                                    <a
                                        href="/orders"
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-neutral-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-100 transition-all text-xs font-bold uppercase tracking-widest"
                                    >
                                        <ShoppingBag className="w-4 h-4" /> <span className="hidden sm:inline">History</span>
                                    </a>
                                    <button
                                        onClick={() => signOut()}
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-neutral-200 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all text-xs font-bold uppercase tracking-widest"
                                    >
                                        <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Sign Out</span>
                                    </button>
                                </div>
                            ) : (
                                <a
                                    href="/login"
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#1c1c1c] text-white hover:bg-amber-600 transition-all text-xs font-bold uppercase tracking-widest shadow-lg"
                                >
                                    Sign In
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Categories Bar */}
                <div className="max-w-7xl mx-auto px-4 py-4 flex gap-3 overflow-x-auto no-scrollbar scroll-smooth">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-8 py-2.5 rounded-full whitespace-nowrap text-xs font-bold uppercase tracking-widest transition-all ${selectedCategory === null
                            ? "bg-[#1c1c1c] text-white shadow-lg"
                            : "bg-white border border-neutral-100 text-neutral-400 hover:text-[#1c1c1c] hover:bg-neutral-50"
                            }`}
                    >
                        Everything
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`px-8 py-2.5 rounded-full whitespace-nowrap text-xs font-bold uppercase tracking-widest transition-all ${selectedCategory === cat.id
                                ? "bg-[#1c1c1c] text-white shadow-lg"
                                : "bg-white border border-neutral-100 text-neutral-400 hover:text-[#1c1c1c] hover:bg-neutral-50"
                                }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </header>

            {/* Mobile Search */}
            <div className="lg:hidden px-4 py-6">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Search our creations..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 rounded-2xl bg-white border border-neutral-100 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm shadow-sm"
                    />
                </div>
            </div>

            {/* Menu Grid */}
            <div className="max-w-7xl mx-auto px-4 mt-8">
                <motion.div
                    layout
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                >
                    <AnimatePresence mode="popLayout">
                        {filteredItems.map((item) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white rounded-[32px] overflow-hidden border border-neutral-100 shadow-sm hover:shadow-2xl hover:shadow-black/5 transition-all group border-b-4 border-b-transparent hover:border-b-amber-500"
                            >
                                <div className="h-56 bg-neutral-50 relative overflow-hidden cursor-pointer" onClick={() => requireAuth(() => setSelectedItem(item))}>
                                    <div className="absolute top-4 left-4 z-10 transition-transform duration-500 group-hover:scale-110">
                                        <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-xl backdrop-blur-md border ${(availability[item.id] || 0) >= 10
                                            ? "bg-red-500/20 text-red-500 border-red-500/20"
                                            : (availability[item.id] || 0) > 7
                                                ? "bg-amber-500/20 text-amber-500 border-amber-500/20"
                                                : "bg-black/40 text-white border-white/10"
                                            }`}>
                                            {(availability[item.id] || 0) >= 10
                                                ? "Sold Out for Today"
                                                : `${10 - (availability[item.id] || 0)} Rituals Remaining`}
                                        </div>
                                    </div>
                                    <img
                                        src={item.image_url || `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800`}
                                        alt={item.name}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800';
                                        }}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="bg-white/90 backdrop-blur p-2 rounded-full shadow-lg text-amber-600">
                                            <Info className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <div className="absolute bottom-6 left-6">
                                        <span className="bg-white/95 backdrop-blur px-4 py-2 rounded-2xl text-sm font-bold shadow-xl flex items-center gap-1">
                                            <span className="text-amber-600">₹</span>{item.price}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-8">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="text-xl font-serif font-bold group-hover:text-amber-600 transition-colors cursor-pointer" onClick={() => requireAuth(() => setSelectedItem(item))}>{item.name}</h3>
                                    </div>
                                    <p className="text-neutral-400 text-sm line-clamp-2 mb-6 leading-relaxed italic">
                                        &quot;{item.description}&quot;
                                    </p>
                                    <button
                                        onClick={() => addToCart(item)}
                                        disabled={(availability[item.id] || 0) >= 10}
                                        className={`w-full transition-all py-4 rounded-2xl flex items-center justify-center gap-2 font-bold uppercase tracking-widest text-[10px] shadow-sm active:scale-95 ${(availability[item.id] || 0) >= 10
                                            ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                                            : "bg-neutral-50 hover:bg-[#1c1c1c] hover:text-white text-[#1c1c1c]"
                                            }`}
                                    >
                                        {(availability[item.id] || 0) >= 10 ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                        {(availability[item.id] || 0) >= 10 ? "Kitchen Closed" : "Add to Ritual"}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>

                {filteredItems.length === 0 && (
                    <div className="text-center py-32 bg-white rounded-[40px] border border-dashed border-neutral-200">
                        <div className="max-w-md mx-auto px-4">
                            <h3 className="text-2xl font-serif font-bold mb-4">A Quiet Kitchen</h3>
                            <p className="text-neutral-400 mb-10 leading-relaxed italic">
                                We couldn&apos;t find any dishes matching your criteria. Perhaps you&apos;d like to help us prepare?
                            </p>

                            {items.length === 0 && (
                                <button
                                    onClick={handleSeed}
                                    disabled={isSeeding}
                                    className="inline-flex items-center gap-3 bg-amber-600 text-white px-10 py-4 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-amber-700 transition-all shadow-xl shadow-amber-500/20 disabled:opacity-50"
                                >
                                    <Database className="w-4 h-4" />
                                    {isSeeding ? "Seeding..." : "Seed 5-Star Menu"}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Item Details Modal */}
            <AnimatePresence>
                {selectedItem && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedItem(null)}
                            className="absolute inset-0 bg-[#1c1c1c]/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-[40px] overflow-hidden max-w-4xl w-full relative z-10 shadow-2xl flex flex-col md:flex-row"
                        >
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="absolute top-6 right-6 z-20 p-2 bg-white/90 backdrop-blur rounded-full shadow-lg hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="md:w-1/2 h-72 md:h-auto relative">
                                <img
                                    src={selectedItem.image_url || `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800`}
                                    alt={selectedItem.name}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                            </div>

                            <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                                <div className="mb-8">
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
                                            Signature Selection
                                        </span>
                                    </div>
                                    <h2 className="text-4xl font-serif font-bold mb-4">{selectedItem.name}</h2>
                                    <p className="text-2xl font-bold text-amber-600 mb-6">₹{selectedItem.price}</p>
                                    <p className="text-neutral-500 leading-relaxed font-serif italic text-lg">
                                        {selectedItem.description}
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <button
                                        onClick={() => {
                                            addToCart(selectedItem);
                                            setSelectedItem(null);
                                        }}
                                        className="w-full bg-[#1c1c1c] text-white py-5 rounded-[24px] font-bold text-xs uppercase tracking-[0.2em] hover:bg-amber-600 transition-all shadow-xl active:scale-[0.98]"
                                    >
                                        Add to Ritual
                                    </button>
                                    <p className="text-center text-[10px] text-neutral-400 font-bold uppercase tracking-widest">
                                        Prepared fresh upon your arrival
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
