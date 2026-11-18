// Port of modules/delivery/pages/History/DeliveryHistory.jsx (converted with scripts/web2rn.js, then reviewed)
import { Dialog, Sheet } from '../components/ui/Sheet';
import React, { useState, useEffect } from "react";
import { CheckCircle2, Calendar, Truck, Package, ChevronRight, IndianRupee, Clock, Camera, ShieldCheck, X, Wallet, Loader2 } from "lucide-react-native";
import deliveryService from "../lib/deliveryService";
import { Box, Txt, I, Btn, Img, Scroll } from '../components/ui/primitives';
import Spin from '../components/ui/Spin';
const DeliveryHistory = () => {
  const [selectedProof, setSelectedProof] = useState(null);
  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState({
    orders: [],
    stats: {
      totalEarnings: 0
    }
  });
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const [ordersRes, statsRes] = await Promise.all([deliveryService.getAssignedOrders('delivered'), deliveryService.getStats()]);
        if (ordersRes.success && statsRes.success) {
          setHistoryData({
            orders: ordersRes.data,
            stats: statsRes.data
          });
        }
        setLoading(false);
      } catch (error) {
        if (error.name === 'CanceledError') return;
        console.error('Failed to fetch history:', error);
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);
  if (loading) {
    return <Box className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                <Spin className="w-10 h-10 text-slate-600 animate-spin" />
                <Txt className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-none">Retrieving Archives...</Txt>
            </Box>;
  }
  const {
    orders: historicalTasks,
    stats
  } = historyData;
  return <Box className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-2 -mt-2">
            {/* Header */}
            <Box className="px-1">
                <Txt className="text-2xl font-black text-slate-900 tracking-tighter capitalize mb-1">
                    Transaction <Txt className="text-slate-400">History</Txt>
                </Txt>
            </Box>

            {/* Earnings Summary Mini Card */}
            <Box className="bg-white p-4 rounded-xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] flex items-center justify-between overflow-hidden relative group mx-1">
                <Box className="space-y-0.5 relative z-10">
                    <Txt className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Total Admin Payouts</Txt>
                    <Txt className="text-xl font-black text-slate-900 tracking-tighter">₹{stats.totalEarnings}</Txt>
                </Box>
                <Box className="w-10 h-10 bg-slate-600 rounded-xl flex items-center justify-center text-white relative z-10">
                    <I icon={IndianRupee} size={20} strokeWidth={2.5} />
                </Box>
                <Box className="absolute top-0 right-0 w-32 h-32 bg-slate-50/50 rounded-full blur-3xl -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-1000"></Box>
            </Box>

            {/* Title for list */}
            <Box className="flex items-center justify-between px-2 pt-1">
                <Txt className="text-[10px] font-black text-slate-800 tracking-widest uppercase">Verified Deliveries</Txt>
                <Box className="flex items-center gap-1.5 text-primary bg-indigo-100 px-2 py-0.5 rounded-md">
                    <I icon={ShieldCheck} size={10} />
                    <Txt className="text-[8px] font-black uppercase tracking-wider">Proof Secured</Txt>
                </Box>
            </Box>

            {/* List */}
            <Box className="space-y-3 px-1">
                {historicalTasks.length === 0 ? <Box className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[1.5rem] p-10 text-center">
                        <I icon={Package} className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <Txt className="text-slate-500 font-bold text-sm">No historical records found.</Txt>
                        <Txt className="text-slate-400 text-[10px] mt-0.5">Complete tasks to see them here.</Txt>
                    </Box> : historicalTasks.map((task, idx) => <Box key={task._id} className="bg-white p-4 rounded-[1.25rem] border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] flex flex-col group hover:border-slate-100 transition-all">
                        <Box className="flex items-start gap-3 mb-2.5">
                            <Box className="w-10 h-10 rounded-xl bg-indigo-100 text-primary flex items-center justify-center shrink-0">
                                <I icon={Package} size={18} />
                            </Box>
                            <Box className="flex-1 min-w-0">
                                <Box className="flex items-start justify-between mb-0.5 gap-2">
                                    <Txt className="text-[13px] font-black text-slate-900 uppercase tracking-tight truncate">#{task._id.slice(-6).toUpperCase()}</Txt>
                                    <Txt className="text-[7px] font-black px-1.5 py-0.5 rounded max-w-max uppercase tracking-widest shrink-0 bg-slate-50 text-slate-600">Platform Payout</Txt>
                                </Box>
                                <Box className="flex items-center justify-between">
                                    <Txt className="text-[9px] text-slate-500 font-bold uppercase tracking-widest truncate max-w-[120px]">To: {task.customer?.name || 'Customer'}</Txt>
                                    <Txt className="text-[13px] font-black text-slate-900">₹20</Txt>
                                </Box>
                            </Box>
                        </Box>

                        {/* Bottom Metadata & Proof Action */}
                        <Box className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                            <Box className="flex items-center gap-2 opacity-80">
                                <Box className="flex items-center gap-1">
                                    <I icon={Calendar} size={9} className="text-slate-600" />
                                    <Txt className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">
                                        {new Date(task.deliveredAt || task.updatedAt).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short'
                })}
                                    </Txt>
                                </Box>
                                <Box className="w-0.5 h-0.5 bg-slate-300 rounded-full"></Box>
                                <Box className="flex items-center gap-1">
                                    <I icon={Clock} size={9} className="text-slate-600" />
                                    <Txt className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">
                                        {new Date(task.deliveredAt || task.updatedAt).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
                                    </Txt>
                                </Box>
                            </Box>

                            <Btn onPress={() => setSelectedProof(task)} className="flex items-center gap-1 text-[8px] font-black text-slate-600 bg-slate-50/50 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg uppercase tracking-widest transition-colors active:scale-95">
                                <I icon={Camera} size={11} />
                                View Proof
                            </Btn>
                        </Box>
                    </Box>)}
            </Box>


            {/* Empty Footnote */}
            <Txt className="text-center text-[11px] font-bold text-slate-500 pt-6 pb-2">Records older than 90 days are archived externally.</Txt>


            {/* Photo Proof Modal */}
            <React.Fragment>
                {selectedProof && <Dialog visible={!!(selectedProof)} onClose={() => setSelectedProof(null)} className={`bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl relative overflow-hidden`}>
<Box className="flex-shrink flex flex-col overflow-hidden">
                            <Btn onPress={() => setSelectedProof(null)} className="absolute top-5 right-5 w-8 h-8 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center hover:bg-slate-200 hover:text-slate-600 transition-colors z-20">
                                <I icon={X} size={16} />
                            </Btn>

                            <Box className="flex items-center gap-3 mb-5 mt-1 relative z-10">
                                <Box className="w-12 h-12 bg-indigo-100 text-primary rounded-2xl flex items-center justify-center">
                                    <I icon={ShieldCheck} size={24} />
                                </Box>
                                <Box>
                                    <Txt className="text-lg font-black text-slate-900 tracking-tight leading-none mb-1 capitalize">Delivery Proof</Txt>
                                    <Txt className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Task #{selectedProof._id.slice(-6).toUpperCase()}</Txt>
                                </Box>
                            </Box>

                            {/* Image Area */}
                            <Box className="aspect-[4/3] bg-slate-100 rounded-[1.5rem] border border-slate-200 flex flex-col items-center justify-center mb-5 relative overflow-hidden group">
                                <Img src={selectedProof.deliveryProof || "https://images.unsplash.com/photo-1607083206968-13611e3d76db?q=80&w=600&auto=format&fit=crop"} alt="Delivery Proof" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                

                                <Box className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-sm">
                                    <Box className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></Box>
                                    <Txt className="text-[8px] font-black text-slate-700 uppercase tracking-widest">Live Capture</Txt>
                                </Box>                                <Box className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1.5 rounded-md text-[8px] font-black tracking-widest text-white uppercase flex flex-col items-end gap-0.5">
                                    <Txt>{new Date(selectedProof.deliveredAt || selectedProof.updatedAt).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short'
                })}</Txt>
                                    <Txt className="text-slate-300 opacity-80">{new Date(selectedProof.deliveredAt || selectedProof.updatedAt).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}</Txt>
                                </Box>
                            </Box>

                            {/* Info Box */}
                            <Box className="bg-slate-50 p-4 rounded-xl border border-slate-100 relative z-10 space-y-3">
                                <Box className="flex justify-between items-center">
                                    <Txt className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Customer</Txt>
                                    <Txt className="text-[11px] font-black text-slate-800 capitalize">{selectedProof.customer?.name || 'Customer'}</Txt>
                                </Box>
                                <Box className="flex justify-between items-center">
                                    <Txt className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Task Type</Txt>
                                    <Txt className="text-[11px] font-black text-slate-800 capitalize">{selectedProof.status === 'out-for-delivery' ? 'Final Delivery' : 'Fabric Pickup'}</Txt>
                                </Box>
                                <Box className="flex justify-between items-center pt-2 border-t border-slate-200/60">
                                    <Txt className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        {selectedProof.paymentStatus === 'paid' ? 'Admin Payout' : 'C.O.D. Pending'}
                                    </Txt>
                                    <Txt className="text-[11px] font-black text-primary">+₹20.00</Txt>
                                </Box>
                            </Box>

                            {/* Decorative elements */}
                            <Box className="absolute top-0 right-0 w-40 h-40 bg-slate-50 rounded-bl-full mix-blend-multiply -z-0"></Box>
                        </Box>
</Dialog>}
            </React.Fragment>
        </Box>;
};
export default DeliveryHistory;