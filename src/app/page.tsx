"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ShoppingBag, ChevronRight, Menu as MenuIcon, UtensilsCrossed, ShoppingCart } from "lucide-react";
import { PageTransition } from "@/components/layout/PageTransition";
import { GoldenParticles } from "@/components/ui/GoldenParticles";
import { FloatingCart } from "@/components/ui/FloatingCart";

import { createClient } from "@/utils/supabase/client";
import { signOut as authSignOut } from "@/actions/auth";

export default function Home() {
    const [cartCount, setCartCount] = useState(0);
    const [user, setUser] = useState<any>(null);
    const [mounted, setMounted] = useState(false);

    const handleSignOut = async () => {
        if (user) {
            localStorage.removeItem(`cart_${user.id}`);
        }
        await authSignOut();
    };
    const { scrollYProgress } = useScroll();

    // Parallax values for falling squares
    const square1Y = useTransform(scrollYProgress, [0, 1], [0, 800]);
    const square2Y = useTransform(scrollYProgress, [0, 1], [0, 1200]);

    const supabase = createClient();

    useEffect(() => {
        setMounted(true);
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        fetchUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
        });

        return () => subscription.unsubscribe();
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
        window.addEventListener("storage", updateCartCount);

        return () => {
            clearInterval(interval);
            window.removeEventListener("storage", updateCartCount);
        };
    }, [user?.id]);
    return (
        <PageTransition>
            <main className="min-h-screen bg-[#fdfaf5] text-[#1c1c1c] font-sans overflow-x-hidden relative">
                <GoldenParticles />

                {/* Falling Squares (Scroll Responsive) */}
                <motion.div
                    style={{ y: square1Y }}
                    className="absolute top-40 left-[10%] w-16 h-16 border-2 border-amber-500/20 rotate-12 -z-10"
                />
                <motion.div
                    style={{ y: square2Y }}
                    className="absolute top-80 right-[15%] w-24 h-24 border-2 border-neutral-900/10 -rotate-12 -z-10"
                />

                {/* Minimalist Professional Navbar */}
                <header className="absolute top-0 left-0 right-0 z-50 px-8 py-8 max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3 group">
                        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-amber-500 shadow-lg group-hover:rotate-[15deg] transition-transform duration-500">
                            <UtensilsCrossed className="w-4 h-4" />
                        </div>
                        <span className="text-lg font-black tracking-tighter uppercase italic">Digi<span className="text-amber-600">FOOD</span></span>
                    </div>

                    <nav className="hidden md:flex items-center gap-12">
                        {mounted && (
                            <>
                                {user ? (
                                    <>
                                        <Link href="/menu" className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400 hover:text-black transition-all">Menu</Link>
                                        <button onClick={handleSignOut} className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400 hover:text-red-600 transition-all">Sign Out</button>
                                        <Link href="/menu" className="px-8 py-3 bg-black text-white text-[10px] font-bold uppercase tracking-[0.3em] rounded-full hover:bg-amber-600 transition-all shadow-xl shadow-black/10">
                                            Begin the Discovery
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <Link href="/signup" className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400 hover:text-black transition-all">Join us</Link>
                                        <Link href="/admin" className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400 hover:text-black transition-all">Staff Login</Link>
                                        <Link href="/login" className="px-8 py-3 bg-black text-white text-[10px] font-bold uppercase tracking-[0.3em] rounded-full hover:bg-amber-600 transition-all shadow-xl shadow-black/10">
                                            Sign In
                                        </Link>
                                    </>
                                )}
                            </>
                        )}
                    </nav>
                </header>

                {mounted && <FloatingCart />}

                {/* Hero Section */}
                <section className="pt-32 pb-20 px-4 min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
                    {/* Background Soft Glows (Animated) */}
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.08, 0.05] }}
                        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-amber-500 rounded-full blur-[120px] -z-10"
                    />


                    {/* Asymmetric Floating Composition */}
                    <div className="relative w-full max-w-6xl mx-auto h-[500px] md:h-[650px] mb-24 flex items-center justify-center">

                        {/* 1. Atmosphere (Floating) */}
                        <motion.div
                            animate={{ y: [0, -20, 0], rotate: [-4, -2, -4] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute left-[5%] top-[10%] w-[32%] aspect-[4/5] rounded-[60px] overflow-hidden shadow-2xl border border-white/20 grayscale"
                        >
                            <img
                                src="https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=800"
                                alt="Culinary art"
                                className="w-full h-full object-cover"
                            />
                        </motion.div>

                        {/* 2. Ritual (Floating) */}
                        <motion.div
                            animate={{ y: [0, 30, 0], rotate: [0, 4, 0] }}
                            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute right-[8%] bottom-[5%] w-[35%] aspect-[3/4] rounded-[50px] overflow-hidden shadow-2xl border border-transparent"
                        >
                            <img
                                src="https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?auto=format&fit=crop&q=80&w=1200"
                                alt="Dining Area"
                                className="w-full h-full object-cover"
                            />
                        </motion.div>

                        {/* 3. Masterpiece (Floating) */}
                        <motion.div
                            animate={{ scale: [1, 1.02, 1], y: [0, -10, 0] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                            className="relative w-[45%] md:w-[32%] aspect-[3/4.5] rounded-[80px] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] z-20 border-[16px] border-white"
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-10" />
                            <img
                                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800"
                                alt="Modern restaurant"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-10 left-0 right-0 text-center z-20">
                                <span className="text-white/80 text-[10px] uppercase font-bold tracking-[0.3em]">Signature Selection</span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Content Section */}
                    <div className="text-center max-w-4xl mx-auto z-30">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="inline-block px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-black uppercase tracking-[0.25em] mb-8"
                        >
                            Est. 2026 • Private Dining
                        </motion.div>

                        <motion.h1
                            className="text-5xl md:text-8xl font-serif font-medium leading-[0.9] mb-10 tracking-tighter"
                        >
                            {["Elevating", "the", "Kitchen", "Ritual"].map((word, i) => (
                                <motion.span
                                    key={i}
                                    initial={{ opacity: 0, y: 50, rotateX: -90 }}
                                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                                    transition={{
                                        duration: 0.8,
                                        delay: i * 0.1,
                                        ease: [0.215, 0.61, 0.355, 1]
                                    }}
                                    className={`inline-block mr-4 ${word === "Kitchen" || word === "Ritual" ? "text-amber-600 italic" : ""}`}
                                >
                                    {word}
                                    {i === 1 && <br />}
                                </motion.span>
                            ))}
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className="text-neutral-500 text-base md:text-lg mb-14 leading-relaxed max-w-2xl mx-auto font-serif italic"
                        >
                            where avant-garde interior design meets the absolute precision of digital curation. <br />
                            <span className="text-neutral-300 not-italic text-sm font-sans font-bold uppercase tracking-[0.1em] mt-4 block">secure your curated transition below</span>
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.8 }}
                            className="flex flex-col items-center gap-6"
                        >
                            <Link href="/menu" className="group relative px-16 py-6 bg-[#1c1c1c] text-white rounded-full font-bold uppercase tracking-[0.3em] text-[11px] overflow-hidden shadow-2xl">
                                <span className="relative z-10 flex items-center gap-4">
                                    Begin the Discovery <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-500" />
                                </span>
                                <div className="absolute inset-0 bg-amber-600 -translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-in-out" />
                            </Link>

                            <div className="flex items-center gap-4 opacity-30 deals-bar">
                                <div className="h-[1px] w-12 bg-neutral-900" />
                                <span className="text-[8px] font-black uppercase tracking-[0.5em]">Selected Menus Only</span>
                                <div className="h-[1px] w-12 bg-neutral-900" />
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Simple Footer */}
                <footer className="py-20 px-8 border-t border-neutral-100 flex flex-col items-center">
                    <div className="flex gap-12 mb-12">
                        <Link href="/signup" className="text-[10px] font-bold uppercase tracking-[0.2em] hover:text-amber-600 transition-colors">Join Us</Link>
                        <Link href="/admin" className="text-[10px] font-bold uppercase tracking-[0.2em] hover:text-amber-600 transition-colors">Staff Portal</Link>
                    </div>
                    <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-[0.4em]">
                        © 2026 DIGIFOOD SELECTION
                    </div>
                </footer>
            </main>
        </PageTransition>
    );
}
