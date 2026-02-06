"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ChevronRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { usePathname } from "next/navigation";

export const FloatingCart = () => {
    const [count, setCount] = useState(0);
    const [user, setUser] = useState<any>(null);
    const pathname = usePathname();
    const supabase = createClient();

    useEffect(() => {
        // Init user
        const init = async () => {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            setUser(currentUser);
        };
        init();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT' || event === 'USER_UPDATED' && !session) {
                setUser(null);
                setCount(0);
            } else if (session?.user) {
                setUser(session.user);
            } else {
                setUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        const updateCount = () => {
            // CRITICAL: If no user ID, forcefully hide by setting count to 0
            if (!user?.id) {
                setCount(0);
                return;
            }
            const cart = JSON.parse(localStorage.getItem(`cart_${user.id}`) || "[]");
            const total = cart.reduce((acc: number, item: any) => acc + item.quantity, 0);
            setCount(total);
        };

        updateCount();
        const interval = setInterval(updateCount, 1000);
        window.addEventListener("storage", updateCount);

        return () => {
            clearInterval(interval);
            window.removeEventListener("storage", updateCount);
        };
    }, [user?.id]);

    // Conditions: Must be LOGGED IN (valid user ID), count > 0, and NOT on admin/cart/checkout pages
    const isVisible = !!user?.id && count > 0 &&
        !pathname.startsWith("/admin") &&
        pathname !== "/cart" &&
        pathname !== "/checkout";

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.8 }}
                className="fixed bottom-10 right-10 z-[100]"
            >
                <Link href="/cart" className="group bg-black text-white px-8 py-5 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-5 hover:bg-amber-600 transition-all border border-white/10 active:scale-95">
                    <div className="relative">
                        <ShoppingBag className="w-5 h-5" />
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            key={count}
                            className="absolute -top-3 -right-3 bg-amber-500 text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-black"
                        >
                            {count}
                        </motion.span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-none">Selection</span>
                        <span className="text-[8px] text-white/40 uppercase mt-1 font-bold">Review Ritual</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-amber-500 group-hover:translate-x-1 transition-transform" />
                </Link>
            </motion.div>
        </AnimatePresence>
    );
};
