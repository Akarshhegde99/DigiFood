"use client";

import { useState } from "react";
import { adminLogin } from "@/actions/auth";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowLeft, Key, User } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function AdminLoginPage() {
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        const result = await adminLogin(formData);
        if (result?.error) {
            toast.error(result.error);
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#1c1c1c] p-6 font-sans text-white">
            <div className="absolute top-8 left-8">
                <Link href="/" className="flex items-center gap-2 text-neutral-500 hover:text-amber-500 transition-colors font-bold uppercase tracking-widest text-[10px]">
                    <ArrowLeft className="w-4 h-4" /> Public Domain
                </Link>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-[#262626] p-10 md:p-12 rounded-[50px] shadow-2xl border border-neutral-800"
            >
                <div className="flex flex-col items-center mb-10 text-center">
                    <div className="bg-amber-600/10 p-4 rounded-[24px] mb-6 text-amber-500 border border-amber-600/20">
                        <ShieldCheck className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-serif font-bold italic mb-2 tracking-tight">Admin Gateway</h1>
                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-[0.3em]">Restricted Access Protocol</p>
                </div>

                <form action={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-neutral-500 ml-1">Administrator ID</label>
                        <div className="relative">
                            <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                            <input
                                name="username"
                                type="text"
                                required
                                autoComplete="off"
                                className="w-full pl-14 pr-6 py-4 rounded-2xl border border-neutral-700 bg-[#1c1c1c] focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-sm font-medium placeholder:text-neutral-700"
                                placeholder="Identification Code"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-neutral-500 ml-1">Override Key</label>
                        <div className="relative">
                            <Key className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                            <input
                                name="password"
                                type="password"
                                required
                                autoComplete="new-password"
                                className="w-full pl-14 pr-6 py-4 rounded-2xl border border-neutral-700 bg-[#1c1c1c] focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-sm font-medium placeholder:text-neutral-700"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-amber-600 text-white py-5 rounded-[24px] font-bold text-xs uppercase tracking-[0.2em] hover:bg-amber-500 transition-all shadow-xl active:scale-[0.98] disabled:opacity-50"
                    >
                        {loading ? "Authenticating..." : "Establish Command"}
                    </button>
                </form>

                <div className="mt-10 text-center">
                    <p className="text-[9px] text-neutral-600 font-bold uppercase tracking-[0.2em]">
                        All operations are encrypted & logged
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
