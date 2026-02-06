"use client";

import { useState } from "react";
import Link from "next/link";
import { signup } from "@/actions/auth";
import { motion } from "framer-motion";
import { Utensils, ArrowLeft, Mail, Lock, User } from "lucide-react";
import toast from "react-hot-toast";

export default function SignupPage() {
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        const result = await signup(formData);
        if (result?.error) {
            toast.error(result.error);
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#fdfaf5] p-6 font-sans text-[#1c1c1c]">
            <div className="absolute top-8 left-8">
                <Link href="/" className="flex items-center gap-2 text-neutral-400 hover:text-amber-600 transition-colors font-bold uppercase tracking-widest text-[10px]">
                    <ArrowLeft className="w-4 h-4" /> Back to Essence
                </Link>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-white p-10 md:p-12 rounded-[50px] shadow-2xl shadow-black/5 border border-neutral-100"
            >
                <div className="flex flex-col items-center mb-10 text-center">
                    <div className="bg-[#1c1c1c] p-4 rounded-[24px] mb-6 text-white shadow-xl shadow-black/10">
                        <Utensils className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-serif font-bold italic mb-2">Create Registry</h1>
                    <p className="text-xs text-neutral-400 font-bold uppercase tracking-[0.2em]">Join the Curated Experience</p>
                </div>

                <form action={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 ml-1">Full Designation</label>
                        <div className="relative">
                            <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                                name="fullName"
                                type="text"
                                required
                                className="w-full pl-14 pr-6 py-4 rounded-2xl border border-neutral-100 bg-neutral-50 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-sm font-medium"
                                placeholder="E.g., Julian Alexander"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 ml-1">Identity (Email)</label>
                        <div className="relative">
                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                                name="email"
                                type="email"
                                required
                                autoComplete="off"
                                className="w-full pl-14 pr-6 py-4 rounded-2xl border border-neutral-100 bg-neutral-50 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-sm font-medium"
                                placeholder="name@domain.com"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 ml-1">Access Key</label>
                        <div className="relative">
                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                                name="password"
                                type="password"
                                required
                                autoComplete="new-password"
                                className="w-full pl-14 pr-6 py-4 rounded-2xl border border-neutral-100 bg-neutral-50 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-sm font-medium"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#1c1c1c] text-white py-5 rounded-[24px] font-bold text-xs uppercase tracking-[0.2em] hover:bg-amber-600 transition-all shadow-xl active:scale-[0.98] disabled:opacity-50"
                    >
                        {loading ? "Establishing..." : "Complete Registry"}
                    </button>
                </form>

                <div className="mt-10 pt-8 border-t border-neutral-50 text-center">
                    <p className="text-neutral-400 text-xs font-serif italic mb-4">
                        Already have an established identity?
                    </p>
                    <Link href="/login" className="inline-block px-8 py-3 rounded-full border border-neutral-200 text-[#1c1c1c] font-bold text-[10px] uppercase tracking-widest hover:bg-neutral-50 transition-all">
                        Sign In Instead
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
