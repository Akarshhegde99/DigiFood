"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Order, OrderItem } from "@/types";
import { motion } from "framer-motion";
import { CheckCircle2, Download, Calendar, ArrowRight, Utensils, Star } from "lucide-react";
import Link from "next/link";
import { generateInvoicePdf } from "@/utils/invoice";
import { getOrderById } from "@/actions/orders";

export default function OrderSuccessPage() {
    const params = useParams();
    const orderId = params.id as string;
    const [order, setOrder] = useState<Order | null>(null);
    const [items, setItems] = useState<OrderItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchOrder() {
            const result = await getOrderById(orderId);
            if (result.order) {
                setOrder(result.order);
                setItems(result.order.order_items || []);
            }
            setLoading(false);
        }
        if (orderId) fetchOrder();
    }, [orderId]);

    const downloadInvoice = async () => {
        if (!order) return;
        const pdfBytes = await generateInvoicePdf(order, items);
        const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `digifood-invoice-${order.id.slice(0, 8)}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
    };

    if (loading) return null;
    if (!order) return <div className="min-h-screen flex items-center justify-center font-serif">Order not found.</div>;

    return (
        <div className="min-h-screen bg-[#fdfaf5] p-6 md:p-12 flex items-center justify-center font-sans">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-2xl w-full bg-white p-12 md:p-16 rounded-[60px] shadow-2xl border border-neutral-100 text-center relative overflow-hidden"
            >
                {/* Decorative background stars */}
                <div className="absolute top-10 left-10 opacity-5 rotate-12">
                    <Star className="w-24 h-24 text-amber-500 fill-amber-500" />
                </div>

                <div className="bg-green-50 w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-10 text-green-600 shadow-xl shadow-green-500/10">
                    <CheckCircle2 className="w-14 h-14" />
                </div>

                <h1 className="text-5xl font-serif font-bold italic mb-4">You're Invited</h1>
                <p className="text-neutral-400 mb-12 text-lg font-serif italic">
                    Your table is secured and your curated selection is being prepared.
                </p>

                <div className="bg-neutral-50 rounded-[40px] p-10 mb-12 grid grid-cols-1 sm:grid-cols-2 gap-8 text-left border border-neutral-100">
                    <div>
                        <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-[0.2em] mb-3">Scheduled Arrival</p>
                        <div className="flex items-center gap-3 font-bold text-[#1c1c1c]">
                            <Calendar className="w-5 h-5 text-amber-600" />
                            {new Date(order.visit_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-[0.2em] mb-3">Total Ritual Value</p>
                        <div className="flex items-center gap-3 font-bold text-[#1c1c1c] text-xl tracking-tighter">
                            <Utensils className="w-5 h-5 text-amber-600" />
                            ₹{order.total_amount.toFixed(0)}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-6">
                    <button
                        onClick={downloadInvoice}
                        className="flex-1 bg-[#1c1c1c] text-white py-5 rounded-[24px] font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-amber-600 transition-all shadow-xl active:scale-[0.98]"
                    >
                        <Download className="w-4 h-4" /> Download Statement
                    </button>
                    <Link
                        href="/menu"
                        className="flex-1 bg-neutral-100 text-[#1c1c1c] py-5 rounded-[24px] font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-neutral-200 transition-all active:scale-[0.98]"
                    >
                        Explore More <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="mt-12 flex flex-col items-center gap-4">
                    <Link href="/orders" className="text-[10px] text-amber-600 font-black uppercase tracking-[0.22em] hover:text-amber-700 transition-colors border-b-2 border-amber-600/20 pb-1">
                        View Ritual History
                    </Link>
                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-[0.2em]">
                        A formal invitation has been sent to your registry.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
