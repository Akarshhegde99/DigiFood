"use client";

import { useEffect, useState } from "react";
import { createOrder } from "@/actions/orders";
import { CartItem } from "@/types";
import { motion } from "framer-motion";
import { CreditCard, Lock, CheckCircle2, ChevronLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

import { createClient } from "@/utils/supabase/client";

export default function CheckoutPage() {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [visitDateTime, setVisitDateTime] = useState("");
    const [user, setUser] = useState<any>(null);

    const supabase = createClient();

    // QR Auth State
    const [generatedCode, setGeneratedCode] = useState("");
    const [userCode, setUserCode] = useState("");
    const [attempts, setAttempts] = useState(0);
    const [showInput, setShowInput] = useState(false);

    const generateCode = () => {
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        setGeneratedCode(code);
        setUserCode("");
        setAttempts(0);
        setShowInput(true);
    };

    useEffect(() => {
        const init = async () => {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (!currentUser) {
                window.location.href = "/login";
                return;
            }
            setUser(currentUser);

            const savedCart = localStorage.getItem(`cart_${currentUser.id}`);
            const date = sessionStorage.getItem("visit_date");
            const time = sessionStorage.getItem("visit_time");

            if (savedCart) setCart(JSON.parse(savedCart));
            if (date && time) {
                // Create a proper local date object and convert to ISO for consistent DB storage
                const localDateTime = new Date(`${date}T${time}`);
                setVisitDateTime(localDateTime.toISOString());
            } else {
                window.location.href = "/cart";
            }
        };
        init();
    }, []);

    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const deposit = total * 0.5;

    const handlePay = async () => {
        if (userCode !== generatedCode) {
            const nextAttempts = attempts + 1;
            setAttempts(nextAttempts);
            if (nextAttempts >= 3) {
                toast.error("Security Lock: Too many failed attempts. Please refresh QR.");
                setGeneratedCode("");
                setShowInput(false);
            } else {
                toast.error(`Invalid Code. ${3 - nextAttempts} attempts remaining.`);
            }
            return;
        }

        setLoading(true);
        const result = await createOrder(cart, visitDateTime);

        if (result.error) {
            toast.error(result.error);
            if (result.error.includes("Gourmet Selection Update") && user) {
                localStorage.removeItem(`cart_${user.id}`);
                setTimeout(() => window.location.href = "/cart", 2000);
            }
            setLoading(false);
            return;
        }

        setPaymentSuccess(true);
        if (user) {
            localStorage.removeItem(`cart_${user.id}`);
        }
        sessionStorage.removeItem("visit_date");
        sessionStorage.removeItem("visit_time");

        toast.success("Deposit processed successfully!");

        setTimeout(() => {
            window.location.href = `/order-success/${result.orderId}`;
        }, 2000);
    };

    if (paymentSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#fdfaf5]">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                >
                    <div className="bg-green-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 text-green-600 shadow-xl shadow-green-500/10">
                        <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <h1 className="text-4xl font-serif font-bold italic mb-4">Payment Secured</h1>
                    <p className="text-neutral-400 font-serif italic text-lg">Curating your experience. Redirecting...</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fdfaf5] p-6 md:p-12 font-sans text-[#1c1c1c]">
            <div className="max-w-6xl mx-auto">
                <Link href="/cart" className="inline-flex items-center gap-3 text-neutral-400 hover:text-amber-600 mb-12 transition-all font-bold uppercase tracking-widest text-[10px] group">
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Selection
                </Link>

                <div className="grid lg:grid-cols-2 gap-16 items-start">
                    {/* Simulation UI */}
                    <div className="space-y-10">
                        <div>
                            <h1 className="text-4xl font-serif font-bold italic mb-2">Secure Deposit</h1>
                            <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest">Digital Authentication Gateway</p>
                        </div>

                        <div className="bg-white p-10 md:p-12 rounded-[50px] border border-neutral-100 shadow-2xl relative overflow-hidden">
                            {/* Decorative element */}
                            <div className="absolute top-0 right-0 p-10 opacity-5">
                                <ShieldCheck className="w-48 h-48" />
                            </div>

                            <div className="space-y-8 relative z-10">
                                <div className="flex items-center gap-5 mb-10">
                                    <div className="bg-[#1c1c1c] p-4 rounded-[20px] text-white shadow-lg">
                                        <Lock className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold tracking-widest text-[#1c1c1c]">Encrypted Portal</p>
                                        <p className="text-neutral-400 text-xs">Simulated Transaction Protocol</p>
                                    </div>
                                </div>

                                <div className="p-8 bg-neutral-50 rounded-[40px] border border-dashed border-neutral-200">
                                    <div className="relative group mx-auto w-fit mb-8">
                                        <div className="absolute -inset-4 bg-amber-500/10 rounded-[40px] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="w-64 h-64 bg-white mx-auto flex items-center justify-center border-8 border-[#1c1c1c] rounded-[48px] shadow-2xl overflow-hidden relative">
                                            {generatedCode ? (
                                                <img
                                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${generatedCode}`}
                                                    alt="Payment QR"
                                                    className="w-full h-full p-4"
                                                />
                                            ) : (
                                                <div className="grid grid-cols-4 gap-2 opacity-10 p-8">
                                                    {[...Array(16)].map((_, i) => (
                                                        <div key={i} className="w-7 h-7 bg-[#1c1c1c] rounded-sm"></div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {!showInput ? (
                                        <div className="text-center">
                                            <p className="text-neutral-400 mb-6 italic text-sm font-serif">
                                                Scan to reveal your unique authentication code
                                            </p>
                                            <button
                                                onClick={generateCode}
                                                className="bg-[#1c1c1c] text-white px-8 py-4 rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-amber-600 transition-all flex items-center gap-3 mx-auto shadow-xl"
                                            >
                                                Generate Ritual QR
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <div className="text-center">
                                                <p className="text-[10px] uppercase font-black tracking-[0.2em] text-amber-600 mb-4 animate-pulse">Waiting for Code Extraction</p>
                                                <input
                                                    type="text"
                                                    maxLength={4}
                                                    value={userCode}
                                                    onChange={(e) => setUserCode(e.target.value.replace(/\D/g, ''))}
                                                    placeholder="____"
                                                    className="w-full bg-white text-center text-4xl font-serif font-bold tracking-[1em] py-6 rounded-3xl border border-neutral-100 shadow-inner focus:border-amber-500 outline-none transition-all placeholder:opacity-20"
                                                />
                                            </div>

                                            <div className="flex gap-4">
                                                <button
                                                    onClick={() => {
                                                        setGeneratedCode("");
                                                        setShowInput(false);
                                                    }}
                                                    className="flex-1 bg-neutral-100 text-[#1c1c1c] py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-neutral-200 transition-all"
                                                >
                                                    Refresh QR
                                                </button>
                                                <button
                                                    onClick={handlePay}
                                                    disabled={userCode.length !== 4 || loading}
                                                    className="flex-[2] bg-[#1c1c1c] text-white py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-amber-600 transition-all shadow-xl active:scale-[0.98] disabled:opacity-50"
                                                >
                                                    {loading ? "Authenticating..." : "Establish Ritual"}
                                                </button>
                                            </div>

                                            <p className="text-center text-[9px] text-neutral-400 font-bold uppercase tracking-widest">
                                                {3 - attempts} Verification attempts remaining
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Details */}
                    <div className="bg-white p-10 md:p-12 rounded-[50px] border border-neutral-100 shadow-sm h-fit">
                        <h2 className="text-2xl font-serif font-bold italic mb-10 border-b border-neutral-50 pb-6">Order Statement</h2>
                        <div className="space-y-6 mb-10">
                            {cart.map(item => (
                                <div key={item.id} className="flex justify-between items-center text-sm">
                                    <span className="text-neutral-400 font-medium font-serif italic">{item.quantity}x {item.name}</span>
                                    <span className="font-bold tracking-tighter">₹{(item.price * item.quantity).toFixed(0)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="pt-6 space-y-6">
                            <div className="flex justify-between text-2xl font-serif">
                                <span className="font-bold italic">Total Value</span>
                                <span className="font-bold tracking-tighter">₹{total.toFixed(0)}</span>
                            </div>
                            <div className="bg-amber-50 p-6 rounded-[32px] border border-amber-100/50">
                                <p className="text-[10px] uppercase font-bold tracking-widest text-amber-800 mb-2">Deposit Payable Now</p>
                                <p className="text-4xl font-black text-amber-600 tracking-tighter">₹{deposit.toFixed(0)}</p>
                            </div>
                        </div>

                        <div className="mt-12 p-6 rounded-[24px] bg-neutral-50 flex items-start gap-4">
                            <div className="bg-white p-2 rounded-xl border border-neutral-100 mt-1">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                            </div>
                            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest leading-relaxed">
                                By authenticating, you confirm your curated visit
                                scheduled for <span className="text-[#1c1c1c]">{new Date(visitDateTime).toLocaleString()}</span>.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
