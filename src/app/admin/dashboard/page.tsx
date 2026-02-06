"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { updateOrderStatus, getAdminData } from "@/actions/orders";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bell,
    Filter,
    CheckCircle,
    XCircle,
    LogOut,
    Calendar,
    Utensils,
    Download,
    Database,
    Plus,
    Trash2,
    X,
    Edit3
} from "lucide-react";
import toast from "react-hot-toast";
import { generateInvoicePdf } from "@/utils/invoice";
import { seedMenu } from "@/actions/seed";
import { addMenuItem, deleteMenuItem, updateMenuItem } from "@/actions/menu";

export default function AdminDashboard() {
    const [orders, setOrders] = useState<any[]>([]);
    const [menuItems, setMenuItems] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [activeTab, setActiveTab] = useState("orders");
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [newItem, setNewItem] = useState({
        name: "",
        price: 0,
        description: "",
        image_url: "",
        category_id: "",
        is_available: true
    });
    const [editingItem, setEditingItem] = useState<any>(null);

    const supabase = createClient();

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await getAdminData();

            setOrders(data.orders);
            setMenuItems(data.menuItems);
            setCategories(data.categories);

            if (data.categories.length > 0 && !newItem.category_id) {
                setNewItem(prev => ({ ...prev, category_id: data.categories[0].id }));
            }
        } catch (error) {
            toast.error("Failed to fetch administrative data.");
            console.error(error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();

        // Realtime subscription for orders
        const subscription = supabase
            .channel('admin-orders')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
                toast.success("New Order Received!");
                fetchData();
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
                fetchData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    const handleStatusUpdate = async (orderId: string, status: string) => {
        setLoading(true);
        const res = await updateOrderStatus(orderId, status);
        if (res.error) {
            toast.error(res.error);
            setLoading(false);
        } else {
            toast.success(`Ritual marked as ${status.toUpperCase()}`);
            // Small delay to ensure DB reflects changes for the re-fetch
            setTimeout(async () => {
                await fetchData();
            }, 500);
        }
    };

    const handleDownloadInvoice = async (order: any) => {
        const pdfBytes = await generateInvoicePdf(order, order.order_items);
        const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-${order.id.slice(0, 8)}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleSeed = async () => {
        if (!confirm("This will reset the menu to the standard 15 items. Continue?")) return;
        setLoading(true);
        const res = await seedMenu();
        if (res.error) toast.error(res.error);
        else {
            toast.success("Gourmet selection reset successfully!");
            fetchData();
        }
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await addMenuItem(newItem);
        if (res.error) toast.error(res.error);
        else {
            toast.success("Dish added to menu!");
            setShowAddModal(false);
            setNewItem({
                name: "",
                price: 0,
                description: "",
                image_url: "",
                category_id: categories[0]?.id || "",
                is_available: true
            });
            fetchData();
        }
    };

    const handleEditItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem) return;
        const { id, ...updates } = editingItem;
        const res = await updateMenuItem(id, updates);
        if (res.error) toast.error(res.error);
        else {
            toast.success("Masterpiece refined!");
            setShowEditModal(false);
            setEditingItem(null);
            fetchData();
        }
    };

    const handleDeleteItem = async (id: string) => {
        if (!confirm("Are you sure you want to remove this dish?")) return;
        const res = await deleteMenuItem(id);
        if (res.error) toast.error(res.error);
        else {
            toast.success("Dish removed from menu");
            fetchData();
        }
    };

    const filteredOrders = orders.filter(o =>
        filter === "all" ? true : o.status === filter
    );

    return (
        <div className="min-h-screen bg-neutral-900 text-white flex">
            {/* Sidebar */}
            <aside className="w-64 border-r border-neutral-800 p-6 flex flex-col sticky top-0 h-screen">
                <div className="flex items-center gap-3 mb-12">
                    <div className="bg-amber-600 p-2 rounded-lg text-white">
                        <Utensils className="w-6 h-6" />
                    </div>
                    <span className="text-xl font-black italic tracking-tighter">DIGIFOOD</span>
                </div>

                <nav className="flex-grow space-y-2">
                    <button
                        onClick={() => setActiveTab("orders")}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${activeTab === "orders" ? "bg-amber-600 text-white shadow-lg shadow-amber-600/20" : "text-neutral-500 hover:text-white"}`}
                    >
                        <Bell className="w-4 h-4" /> Orders Monitor
                    </button>
                    <button
                        onClick={() => setActiveTab("menu")}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${activeTab === "menu" ? "bg-amber-600 text-white shadow-lg shadow-amber-600/20" : "text-neutral-500 hover:text-white"}`}
                    >
                        <Utensils className="w-4 h-4" /> Menu Curation
                    </button>
                </nav>

                <button
                    onClick={() => window.location.href = "/"}
                    className="flex items-center gap-3 p-3 text-neutral-500 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest mt-auto"
                >
                    <LogOut className="w-4 h-4" /> Return to Site
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-grow p-8 max-h-screen overflow-y-auto">
                {activeTab === "orders" ? (
                    <>
                        <header className="flex justify-between items-center mb-12">
                            <div>
                                <h1 className="text-4xl font-serif font-bold italic">Order Pulse</h1>
                                <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">Real-time digital dining flow</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="bg-neutral-800 p-3 px-5 rounded-2xl flex items-center gap-3 border border-neutral-700 hover:border-amber-500 transition-all focus-within:ring-2 focus-within:ring-amber-500/20">
                                    <Filter className="w-4 h-4 text-neutral-500" />
                                    <select
                                        value={filter}
                                        onChange={(e) => setFilter(e.target.value)}
                                        className="bg-transparent outline-none text-[10px] font-bold uppercase tracking-widest cursor-pointer text-white appearance-none pr-4"
                                    >
                                        <option value="all" className="bg-neutral-800 text-white">Every Pulse</option>
                                        <option value="pending" className="bg-neutral-800 text-white">Pending</option>
                                        <option value="approved" className="bg-neutral-800 text-white">Approved</option>
                                        <option value="rejected" className="bg-neutral-800 text-white">Rejected</option>
                                    </select>
                                </div>
                            </div>
                        </header>

                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-amber-600"></div>
                            </div>
                        ) : filteredOrders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-32 bg-neutral-800/20 rounded-[40px] border border-dashed border-neutral-700 w-full">
                                <div className="bg-neutral-800 p-6 rounded-3xl mb-6">
                                    <Bell className="w-12 h-12 text-neutral-600 animate-pulse" />
                                </div>
                                <h3 className="text-xl font-serif font-bold italic mb-2 text-neutral-400">The ritual has not yet begun</h3>
                                <p className="text-[10px] text-neutral-500 uppercase font-black tracking-widest">Awaiting the first digital heartbeat</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                <AnimatePresence mode="popLayout">
                                    {filteredOrders.map((order) => (
                                        <motion.div
                                            key={order.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="bg-neutral-800/50 border border-neutral-700 rounded-[32px] p-8 shadow-2xl relative overflow-hidden flex flex-col"
                                        >
                                            <div className="flex justify-between items-start mb-8">
                                                <div>
                                                    <p className="text-[10px] text-neutral-500 uppercase font-black tracking-widest mb-1">Ritual ID</p>
                                                    <h3 className="font-mono text-sm opacity-50">#{order.id.slice(0, 8)}</h3>
                                                </div>
                                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${order.status === 'approved' ? 'bg-green-500/20 text-green-500' :
                                                    order.status === 'rejected' ? 'bg-red-500/20 text-red-500' :
                                                        'bg-amber-500/20 text-amber-500'
                                                    }`}>
                                                    {order.status}
                                                </span>
                                            </div>

                                            <div className="space-y-6 mb-8 flex-grow">
                                                <div className="flex items-center gap-4">
                                                    <div className="bg-neutral-900 p-3 rounded-2xl">
                                                        <Calendar className="w-4 h-4 text-amber-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">Scheduled Visit</p>
                                                        <span className="text-sm font-medium">{new Date(order.visit_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                                    </div>
                                                </div>
                                                <div className="bg-neutral-900/50 p-6 rounded-[24px] border border-neutral-700/50">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs font-black uppercase tracking-widest">Ritual Total</span>
                                                        <span className="text-lg font-serif font-bold italic text-amber-500">₹{order.total_amount}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDownloadInvoice(order)}
                                                    className="w-full bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all group"
                                                >
                                                    <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" /> Digital Record
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mt-auto">
                                                {order.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleStatusUpdate(order.id, 'rejected')}
                                                            className="bg-neutral-700 hover:bg-red-900/50 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                                                        >
                                                            <XCircle className="w-4 h-4" /> Deny
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(order.id, 'approved')}
                                                            className="bg-amber-600 hover:bg-amber-700 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                                                        >
                                                            <CheckCircle className="w-4 h-4" /> Honor
                                                        </button>
                                                    </>
                                                )}
                                                {order.status !== 'pending' && (
                                                    <button
                                                        disabled
                                                        className="col-span-2 bg-neutral-700/20 cursor-not-allowed p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-neutral-700 border border-neutral-800/50"
                                                    >
                                                        Decision Finalized
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <header className="flex justify-between items-center mb-12">
                            <div>
                                <h1 className="text-4xl font-serif font-bold italic">Menu Curation</h1>
                                <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">Orchestrate the elite culinary ritual</p>
                            </div>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="bg-amber-600 hover:bg-amber-700 p-4 px-8 rounded-2xl flex items-center gap-3 transition-all font-black uppercase tracking-widest text-[10px] shadow-xl shadow-amber-600/20 active:scale-95 text-white"
                            >
                                <Plus className="w-4 h-4" /> New Creation
                            </button>
                        </header>

                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-amber-600"></div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {menuItems.map((item) => (
                                    <div key={item.id} className="bg-neutral-800/50 border border-neutral-700 rounded-[32px] overflow-hidden flex flex-col group h-[600px]">
                                        <div className="h-56 relative shrink-0">
                                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 to-transparent" />
                                            <div className="absolute top-4 right-4 flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingItem(item);
                                                        setShowEditModal(true);
                                                    }}
                                                    className="bg-neutral-900/80 backdrop-blur rounded-full p-2.5 border border-neutral-700 text-amber-500 hover:scale-110 transition-all shadow-xl"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteItem(item.id)}
                                                    className="bg-neutral-900/80 backdrop-blur rounded-full p-2.5 border border-neutral-700 text-red-500 hover:scale-110 transition-all shadow-xl"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="absolute bottom-4 left-6">
                                                <span className="text-lg font-serif font-bold italic text-amber-500">₹{item.price}</span>
                                            </div>
                                        </div>
                                        <div className="p-8 flex-grow flex flex-col">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="text-xl font-bold font-serif">{item.name}</h3>
                                            </div>
                                            <p className="text-neutral-500 text-xs leading-relaxed italic mb-6 overflow-hidden line-clamp-4">"{item.description}"</p>
                                            <div className="flex items-center gap-2 mt-auto">
                                                <span className={`w-2 h-2 rounded-full ${item.is_available ? 'bg-green-500' : 'bg-red-500'}`} />
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                                                    {item.is_available ? 'In Reserve' : 'Depleted'}
                                                </span>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-neutral-700/50">
                                                <span className="bg-neutral-700/50 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-neutral-400">
                                                    {categories.find(c => c.id === item.category_id)?.name || 'Uncategorized'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Add Item Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-[#1c1c1c] border border-neutral-800 w-full max-w-2xl rounded-[40px] p-10 overflow-hidden relative shadow-2xl"
                        >
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="absolute top-8 right-8 text-neutral-500 hover:text-white"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <h2 className="text-3xl font-serif font-bold italic mb-2">New Creation</h2>
                            <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest mb-10">Add a masterpiece to the ritual</p>

                            <form onSubmit={handleAddItem} className="grid grid-cols-2 gap-6">
                                <div className="space-y-2 col-span-2">
                                    <label className="text-[10px] uppercase font-black tracking-widest text-neutral-500 ml-1">Designation (Name)</label>
                                    <input
                                        required
                                        value={newItem.name}
                                        onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                        className="w-full bg-neutral-800 border border-neutral-700 p-4 rounded-2xl outline-none focus:border-amber-500 transition-colors text-sm text-white"
                                        placeholder="E.g., Truffle-Infused Glaze"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-black tracking-widest text-neutral-500 ml-1">Sacrifice (Price ₹)</label>
                                    <input
                                        type="number"
                                        required
                                        value={newItem.price}
                                        onChange={e => setNewItem({ ...newItem, price: Number(e.target.value) })}
                                        className="w-full bg-neutral-800 border border-neutral-700 p-4 rounded-2xl outline-none focus:border-amber-500 transition-colors text-sm text-white"
                                        placeholder="0000"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-black tracking-widest text-neutral-500 ml-1">Domain (Category)</label>
                                    <select
                                        value={newItem.category_id}
                                        onChange={e => setNewItem({ ...newItem, category_id: e.target.value })}
                                        className="w-full bg-neutral-800 border border-neutral-700 p-4 rounded-2xl outline-none focus:border-amber-500 transition-colors text-sm appearance-none text-white font-bold"
                                    >
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <label className="text-[10px] uppercase font-black tracking-widest text-neutral-500 ml-1">Visual Essence (Image URL)</label>
                                    <input
                                        required
                                        value={newItem.image_url}
                                        onChange={e => setNewItem({ ...newItem, image_url: e.target.value })}
                                        className="w-full bg-neutral-800 border border-neutral-700 p-4 rounded-2xl outline-none focus:border-amber-500 transition-colors text-sm font-mono text-[10px] text-white"
                                        placeholder="https://..."
                                    />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <label className="text-[10px] uppercase font-black tracking-widest text-neutral-500 ml-1">Narrative (Description)</label>
                                    <textarea
                                        required
                                        value={newItem.description}
                                        onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                                        className="w-full bg-neutral-800 border border-neutral-700 p-4 rounded-2xl outline-none focus:border-amber-500 transition-colors text-sm h-32 resize-none italic text-white"
                                        placeholder="Describe the essence..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="col-span-2 bg-amber-600 hover:bg-amber-700 p-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl active:scale-95 transition-all mt-4 text-white"
                                >
                                    Establish Masterpiece
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Edit Item Modal */}
            <AnimatePresence>
                {showEditModal && editingItem && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-[#1c1c1c] border border-neutral-800 w-full max-w-2xl rounded-[40px] p-10 overflow-hidden relative shadow-2xl"
                        >
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setEditingItem(null);
                                }}
                                className="absolute top-8 right-8 text-neutral-500 hover:text-white"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <h2 className="text-3xl font-serif font-bold italic mb-2">Refine Creation</h2>
                            <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest mb-10">Perfect the masterpiece details</p>

                            <form onSubmit={handleEditItem} className="grid grid-cols-2 gap-6">
                                <div className="space-y-2 col-span-2">
                                    <label className="text-[10px] uppercase font-black tracking-widest text-neutral-500 ml-1">Designation (Name)</label>
                                    <input
                                        required
                                        value={editingItem.name}
                                        onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                                        className="w-full bg-neutral-800 border border-neutral-700 p-4 rounded-2xl outline-none focus:border-amber-500 transition-colors text-sm text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-black tracking-widest text-neutral-500 ml-1">Sacrifice (Price ₹)</label>
                                    <input
                                        type="number"
                                        required
                                        value={editingItem.price}
                                        onChange={e => setEditingItem({ ...editingItem, price: Number(e.target.value) })}
                                        className="w-full bg-neutral-800 border border-neutral-700 p-4 rounded-2xl outline-none focus:border-amber-500 transition-colors text-sm text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-black tracking-widest text-neutral-500 ml-1">Domain (Category)</label>
                                    <select
                                        value={editingItem.category_id}
                                        onChange={e => setEditingItem({ ...editingItem, category_id: e.target.value })}
                                        className="w-full bg-neutral-800 border border-neutral-700 p-4 rounded-2xl outline-none focus:border-amber-500 transition-colors text-sm appearance-none text-white font-bold"
                                    >
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <label className="text-[10px] uppercase font-black tracking-widest text-neutral-500 ml-1">Visual Essence (Image URL)</label>
                                    <input
                                        required
                                        value={editingItem.image_url}
                                        onChange={e => setEditingItem({ ...editingItem, image_url: e.target.value })}
                                        className="w-full bg-neutral-800 border border-neutral-700 p-4 rounded-2xl outline-none focus:border-amber-500 transition-colors text-sm font-mono text-[10px] text-white"
                                    />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <label className="text-[10px] uppercase font-black tracking-widest text-neutral-500 ml-1">Narrative (Description)</label>
                                    <textarea
                                        required
                                        value={editingItem.description}
                                        onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                                        className="w-full bg-neutral-800 border border-neutral-700 p-4 rounded-2xl outline-none focus:border-amber-500 transition-colors text-sm h-32 resize-none italic text-white"
                                    />
                                </div>
                                <div className="col-span-2 flex items-center gap-3 bg-neutral-800/50 p-4 rounded-2xl border border-neutral-700">
                                    <input
                                        type="checkbox"
                                        id="edit-is-available"
                                        checked={editingItem.is_available}
                                        onChange={e => setEditingItem({ ...editingItem, is_available: e.target.checked })}
                                        className="w-5 h-5 accent-amber-600 rounded cursor-pointer"
                                    />
                                    <label htmlFor="edit-is-available" className="text-xs font-bold uppercase tracking-widest cursor-pointer">In Reserve (Available)</label>
                                </div>

                                <button
                                    type="submit"
                                    className="col-span-2 bg-amber-600 hover:bg-amber-700 p-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl active:scale-95 transition-all mt-4 text-white"
                                >
                                    Update Masterpiece
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
