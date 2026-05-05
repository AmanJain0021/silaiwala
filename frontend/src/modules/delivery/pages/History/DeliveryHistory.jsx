import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2,
    Calendar,
    Truck,
    Package,
    ChevronRight,
    IndianRupee,
    Clock,
    Camera,
    ShieldCheck,
    X,
    Wallet,
    Loader2
} from 'lucide-react';
import deliveryService from '../../services/deliveryService';

const DeliveryHistory = () => {
    const [selectedProof, setSelectedProof] = useState(null);
    const [loading, setLoading] = useState(true);
    const [historyData, setHistoryData] = useState({
        orders: [],
        stats: { totalEarnings: 0 }
    });

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const [ordersRes, statsRes] = await Promise.all([
                    deliveryService.getAssignedOrders('delivered'),
                    deliveryService.getStats()
                ]);

                if (ordersRes.success && statsRes.success) {
                    setHistoryData({
                        orders: ordersRes.data,
                        stats: statsRes.data
                    });
                }
            } catch (error) {
                console.error('Failed to fetch history:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 text-slate-600 animate-spin" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-none">Retrieving Archives...</p>
            </div>
        );
    }

    const { orders: historicalTasks, stats } = historyData;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-2">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tighter capitalize mb-4">
                    Transaction <span className="text-slate-400">History</span>
                </h1>
            </div>

            {/* Earnings Summary Mini Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] flex items-center justify-between overflow-hidden relative group">
                <div className="space-y-1 relative z-10">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Total Admin Payouts</p>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter">₹{stats.totalEarnings}</h3>
                </div>
                <div className="w-11 h-11 bg-slate-600 rounded-[0.8rem] flex items-center justify-center text-white relative z-10">
                    <IndianRupee size={22} strokeWidth={2.5} />
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50/50 rounded-full blur-3xl -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-1000"></div>
            </div>

            {/* Title for list */}
            <div className="flex items-center justify-between px-2 pt-2">
                <h2 className="text-[11px] font-black text-slate-800 tracking-widest uppercase">Verified Deliveries</h2>
                <div className="flex items-center gap-1.5 text-primary bg-indigo-100 px-2 py-1 rounded-md">
                    <ShieldCheck size={12} />
                    <span className="text-[9px] font-black uppercase tracking-wider">Proof Secured</span>
                </div>
            </div>

            {/* List */}
            <div className="space-y-4">
                {historicalTasks.length === 0 ? (
                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center">
                        <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-bold text-sm">No historical records found.</p>
                        <p className="text-slate-400 text-xs mt-1">Complete tasks to see them here.</p>
                    </div>
                ) : historicalTasks.map((task, idx) => (
                    <motion.div
                        key={task._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] flex flex-col group hover:border-slate-100 transition-all"
                    >
                        <div className="flex items-start gap-4 mb-3">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-primary flex items-center justify-center shrink-0">
                                <Package size={22} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-1 gap-2">
                                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight truncate">#{task._id.slice(-6).toUpperCase()}</p>
                                    <span className="text-[8px] font-black px-2 py-1 rounded max-w-max uppercase tracking-widest shrink-0 bg-slate-50 text-slate-600">Platform Payout</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate max-w-[120px]">To: {task.customer?.name || 'Customer'}</p>
                                    <span className="text-sm font-black text-slate-900">₹20</span>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Metadata & Proof Action */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3 opacity-80">
                                <div className="flex items-center gap-1">
                                    <Calendar size={10} className="text-slate-600" />
                                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                                        {new Date(task.deliveredAt || task.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                                <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                                <div className="flex items-center gap-1">
                                    <Clock size={10} className="text-slate-600" />
                                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                                        {new Date(task.deliveredAt || task.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedProof(task)}
                                className="flex items-center gap-1.5 text-[9px] font-black text-slate-600 bg-slate-50/50 hover:bg-slate-100 px-3 py-1.5 rounded-lg uppercase tracking-widest transition-colors active:scale-95"
                            >
                                <Camera size={12} />
                                View Proof
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>


            {/* Empty Footnote */}
            <p className="text-center text-[11px] font-bold text-slate-500 pt-6 pb-2">Records older than 90 days are archived externally.</p>


            {/* Photo Proof Modal */}
            <AnimatePresence>
                {selectedProof && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => setSelectedProof(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl relative overflow-hidden"
                        >
                            <button
                                onClick={() => setSelectedProof(null)}
                                className="absolute top-5 right-5 w-8 h-8 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center hover:bg-slate-200 hover:text-slate-600 transition-colors z-20"
                            >
                                <X size={16} />
                            </button>

                            <div className="flex items-center gap-3 mb-5 mt-1 relative z-10">
                                <div className="w-12 h-12 bg-indigo-100 text-primary rounded-2xl flex items-center justify-center">
                                    <ShieldCheck size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none mb-1 capitalize">Delivery Proof</h3>
                                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Task #{selectedProof._id.slice(-6).toUpperCase()}</p>
                                </div>
                            </div>

                            {/* Image Area */}
                            <div className="aspect-[4/3] bg-slate-100 rounded-[1.5rem] border border-slate-200 flex flex-col items-center justify-center mb-5 relative overflow-hidden group">
                                <img
                                    src={selectedProof.deliveryProof || "https://images.unsplash.com/photo-1607083206968-13611e3d76db?q=80&w=600&auto=format&fit=crop"}
                                    alt="Delivery Proof"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent"></div>

                                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-sm">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                                    <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest">Live Capture</span>
                                </div>                                <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1.5 rounded-md text-[8px] font-black tracking-widest text-white uppercase flex flex-col items-end gap-0.5">
                                    <span>{new Date(selectedProof.deliveredAt || selectedProof.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                                    <span className="text-slate-300 opacity-80">{new Date(selectedProof.deliveredAt || selectedProof.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>

                            {/* Info Box */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 relative z-10 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Customer</span>
                                    <span className="text-[11px] font-black text-slate-800 capitalize">{selectedProof.customer?.name || 'Customer'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Task Type</span>
                                    <span className="text-[11px] font-black text-slate-800 capitalize">{selectedProof.status === 'out-for-delivery' ? 'Final Delivery' : 'Fabric Pickup'}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-slate-200/60">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        {selectedProof.paymentStatus === 'paid' ? 'Admin Payout' : 'C.O.D. Pending'}
                                    </span>
                                    <span className="text-[11px] font-black text-primary">+₹20.00</span>
                                </div>
                            </div>

                            {/* Decorative elements */}
                            <div className="absolute top-0 right-0 w-40 h-40 bg-slate-50 rounded-bl-full mix-blend-multiply -z-0"></div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DeliveryHistory;


