// Port of modules/customer/pages/MyBulkOrders.jsx (converted with scripts/web2rn.js, then reviewed)
import Spin from '../components/ui/Spin';
import Screen from '../components/common/Screen';
import { Sheet } from '../components/ui/Sheet';
import React, { useState, useEffect } from "react";
import { useNavigate } from '../lib/nav';
import { ArrowLeft, ClipboardList, Building2, Calendar, Clock, ChevronRight, CheckCircle2, AlertCircle, Info, MoreHorizontal, Search, Filter, Sparkles, X, FileText, Scissors } from "lucide-react-native";
import api from "../lib/api";
import useBrandingStore from "../store/brandingStore";
import { I, Box, Btn, Txt, Input, Scroll } from '../components/ui/primitives';
const statusConfig = {
  pending: {
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    icon: <I icon={Clock} size={14} />,
    label: 'Lead Received'
  },
  reviewing: {
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    icon: <I icon={Search} size={14} />,
    label: 'Reviewing'
  },
  quoted: {
    color: 'text-purple-500',
    bg: 'bg-purple-50',
    icon: <I icon={ClipboardList} size={14} />,
    label: 'Quote Ready'
  },
  accepted: {
    color: 'text-green-500',
    bg: 'bg-green-50',
    icon: <I icon={CheckCircle2} size={14} />,
    label: 'Accepted'
  },
  'in-production': {
    color: 'text-[#843D9B]',
    bg: 'bg-indigo-50',
    icon: <I icon={MoreHorizontal} size={14} />,
    label: 'In Production'
  },
  completed: {
    color: 'text-green-600',
    bg: 'bg-green-100',
    icon: <I icon={CheckCircle2} size={14} />,
    label: 'Delivered'
  },
  cancelled: {
    color: 'text-gray-400',
    bg: 'bg-gray-100',
    icon: <I icon={AlertCircle} size={14} />,
    label: 'Closed'
  }
};
const MyBulkOrders = () => {
  const appName = useBrandingStore(state => state.appName);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/bulk-orders/my');
        setOrders(res.data.data);
      } catch (error) {
        console.error('Failed to fetch bulk orders:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);
  const filteredOrders = orders.filter(order => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = order.orderId && order.orderId.toLowerCase().includes(query) || order.organizationName && order.organizationName.toLowerCase().includes(query) || order.contactPerson && order.contactPerson.toLowerCase().includes(query);
    const matchesFilter = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesFilter;
  });
  if (isLoading) return <Screen className="bg-gray-50"><Box className="flex-1 flex items-center justify-center bg-gray-50">
            <Spin size={40} className="text-[#843D9B]" />
        </Box></Screen>;
  return <Screen className="bg-[#f8fafc]"><Box className="flex-1 bg-[#f8fafc] font-sans">
            {/* Header */}
            <Box className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 py-3 flex items-center gap-4">
                <Btn onPress={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-800 transition-all active:scale-90">
                    <I icon={ArrowLeft} size={20} />
                </Btn>
                <Box className="flex-1 min-w-0 leading-none">
                    <Txt className="text-base font-black text-gray-900 truncate">Bulk Orders</Txt>
                    <Txt className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Wholesale Tracking</Txt>
                </Box>
            </Box>
            <Scroll className="flex-1" contentClassName="pb-10">

            <Box className="max-w-7xl mx-auto px-4 mt-4">
                {/* Search / Filter Placeholder - Compact */}
                <Box className="flex items-center gap-2 mb-4">
                    <Box className="flex-1 relative">
                        <I icon={Search} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                        <Input value={searchQuery} onChangeText={e => setSearchQuery(e)} placeholder="Search organization or ID..." className="w-full pl-9 pr-3 py-2 bg-white border border-gray-100 rounded-xl text-[10px] font-medium outline-none" />
                    </Box>
                    <Btn onPress={() => setShowFilters(!showFilters)} className={`p-2.5 bg-white border ${showFilters ? 'border-[#843D9B] text-[#843D9B]' : 'border-gray-100 text-gray-400'} rounded-xl transition-colors`}>
                        <I icon={Filter} size={14} />
                    </Btn>
                </Box>
                
                <React.Fragment>
                    {showFilters && <Box className="mb-4 overflow-hidden">
                            <Box className="flex flex-wrap gap-2 p-3 bg-white rounded-xl border border-gray-100">
                                <Btn onPress={() => setStatusFilter('all')} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors ${statusFilter === 'all' ? 'bg-[#843D9B] text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                                    All
                                </Btn>
                                {Object.keys(statusConfig).map(status => <Btn key={status} onPress={() => setStatusFilter(status)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors ${statusFilter === status ? 'bg-[#843D9B] text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                                        {statusConfig[status].label}
                                    </Btn>)}
                            </Box>
                        </Box>}
                </React.Fragment>

                {filteredOrders.length === 0 ? <Box className="text-center py-20 bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50">
                        <Box className="w-16 h-16 bg-gray-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 text-gray-300">
                            <I icon={ClipboardList} size={28} />
                        </Box>
                        <Txt className="text-lg font-black text-gray-900 leading-tight">No Bulk Inquiries Found</Txt>
                        <Txt className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-2">Scale your team's look Today</Txt>
                        <Btn onPress={() => navigate('/user/bulk-order')} className="mt-8 px-8 py-3 bg-[#843D9B] text-white rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-[#843D9B]/20">
                            Start First Bulk Request
                        </Btn>
                    </Box> : <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredOrders.map(order => {
          const config = statusConfig[order.status] || statusConfig.pending;
          return <Btn key={order._id} onPress={() => setSelectedOrder(order)} className="block bg-white rounded-2xl p-3 sm:p-4 shadow-xl shadow-gray-200/40 border border-white group relative overflow-hidden cursor-pointer">
                                    {/* Quote Available Badge - Compact Version */}
                                    {order.status === 'quoted' && <Box className="absolute top-0 right-0 p-1.5 px-3 bg-gradient-to-l from-[#843D9B] to-[#ff8da8] text-white rounded-bl-xl shadow-md z-10 transition-transform group-hover:scale-105">
                                            <Txt className="text-[7px] sm:text-[9px] font-black uppercase tracking-widest whitespace-nowrap flex items-center gap-1">
                                                <I icon={Sparkles} size={8} /> Quote Ready
                                            </Txt>
                                        </Box>}

                                    <Box className="flex items-center gap-2 mb-2">
                                        <Box className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-300 border border-gray-50 shrink-0">
                                            <I icon={Building2} size={16} />
                                        </Box>
                                        <Box className="flex-1 min-w-0">
                                            <Txt className="text-xs font-black text-gray-900 leading-none truncate mb-0.5">{order.organizationName || order.contactPerson}</Txt>
                                            <Box className="flex items-center gap-2">
                                                <Txt className="text-[7px] text-gray-400 font-bold uppercase tracking-tight">#{order.orderId.slice(-6)}</Txt>
                                                <Box className={`px-1.5 py-0.5 rounded-md flex items-center gap-1 ${config.bg} ${config.color} border border-current/5`}>
                                                    {React.cloneElement(config.icon, {
                      size: 8
                    })}
                                                    <Txt className="text-[6px] font-black uppercase tracking-tight">{config.label}</Txt>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Box>

                                    <Box className="grid grid-cols-2 gap-1.5 mb-2">
                                        <Box className="bg-gray-50/30 px-2 py-1.5 rounded-lg border border-gray-50/50 flex justify-between items-center">
                                            <Txt className="text-[6px] text-gray-400 font-black uppercase tracking-tight">Item</Txt>
                                            <Txt className="text-[8px] font-black text-gray-900 truncate max-w-[50%]">{order.serviceType}</Txt>
                                        </Box>
                                        <Box className="bg-gray-50/30 px-2 py-1.5 rounded-lg border border-gray-50/50 flex justify-between items-center">
                                            <Txt className="text-[6px] text-gray-400 font-black uppercase tracking-tight">Units</Txt>
                                            <Txt className="text-[8px] font-black text-gray-900">{order.estimatedQuantity}</Txt>
                                        </Box>
                                    </Box>

                                    <Box className="flex items-center justify-between">
                                        <Box className="flex items-center gap-1">
                                            <I icon={Calendar} className="text-gray-300" size={8} />
                                            <Txt className="text-[7px] font-bold text-gray-400 uppercase">{new Date(order.createdAt).toLocaleDateString()}</Txt>
                                        </Box>
                                        <Box className="w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center text-[#843D9B]">
                                            <I icon={ChevronRight} size={10} />
                                        </Box>
                                    </Box>
                                </Btn>;
        })}
                    </Box>}

                {/* Detail Drawer */}
                <React.Fragment>
                    <Sheet visible={!!selectedOrder} onClose={() => setSelectedOrder(null)} className="bg-white rounded-t-[2.5rem] h-[85vh] flex flex-col overflow-hidden">
                    {selectedOrder && <Box className="flex-1 flex flex-col">
                                {/* Drawer Header - Compact */}
                                <Box className="p-3 sm:p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                    <Box>
                                        <Txt className="text-base sm:text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                                            {selectedOrder.orderId}
                                            <Txt className={`px-2 py-0.5 rounded-full text-[6px] sm:text-[8px] uppercase tracking-widest font-black border ${statusConfig[selectedOrder.status].bg} ${statusConfig[selectedOrder.status].color}`}>
                                                {statusConfig[selectedOrder.status].label}
                                            </Txt>
                                        </Txt>
                                        <Txt className="text-[8px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Submitted: {new Date(selectedOrder.createdAt).toLocaleDateString()}</Txt>
                                    </Box>
                                    <Btn onPress={() => setSelectedOrder(null)} className="p-2 sm:p-2.5 bg-white text-gray-400 border border-gray-100 rounded-full shadow-sm">
                                        <I icon={X} size={16} />
                                    </Btn>
                                </Box>

                                {/* Drawer Body - Compact */}
                                <Scroll className="flex-1" contentClassName="p-3 space-y-4 pb-20" nestedScrollEnabled>

                                    {/* Quote Section (if available) */}
                                    {selectedOrder.status === 'quoted' && selectedOrder.quote && <Box className="bg-gradient-to-br from-[#843D9B]/10 to-indigo-50 p-5 sm:p-7 rounded-[2rem] sm:rounded-[2.5rem] border border-[#843D9B]/20 shadow-xl shadow-indigo-100/50 relative overflow-hidden group">
                                            <Box className="absolute -right-4 -top-4 w-20 sm:w-24 h-20 sm:h-24 bg-white/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
                                            <Txt className="text-[10px] sm:text-sm font-black uppercase text-[#843D9B] tracking-[0.2em] mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3 italic">
                                                <Box className="px-1.5 py-0.5 bg-[#843D9B] rounded text-white italic scale-x-[-1]">
                                                    <I icon={FileText} size={10} strokeWidth={3} />
                                                </Box>
                                                Official Quote
                                            </Txt>
                                            <Box className="grid grid-cols-2 gap-3 sm:gap-6 relative z-10">
                                                <Box className="bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm border border-[#843D9B]/10">
                                                    <Txt className="text-[8px] sm:text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1 sm:mb-1.5">Unit Price</Txt>
                                                    <Txt className="text-md sm:text-xl font-black text-gray-900 tracking-tight">₹{selectedOrder.quote.pricePerUnit.toLocaleString()}</Txt>
                                                </Box>
                                                <Box className="bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm border border-[#843D9B]/10">
                                                    <Txt className="text-[8px] sm:text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1 sm:mb-1.5">Total Quote</Txt>
                                                    <Txt className="text-md sm:text-xl font-black text-[#843D9B] tracking-tight">₹{selectedOrder.quote.totalAmount.toLocaleString()}</Txt>
                                                </Box>
                                                <Box className="bg-white p-4 sm:p-6 rounded-[2rem] border border-[#843D9B]/20 flex flex-col items-center justify-center col-span-2 mt-2 shadow-inner bg-indigo-50/30">
                                                    <Txt className="text-[10px] text-[#843D9B] font-black uppercase tracking-[0.2em] mb-1">Security Deposit Required</Txt>
                                                    <Txt className="text-2xl sm:text-3xl font-black text-[#843D9B] tracking-tighter">₹{selectedOrder.quote.depositRequired?.toLocaleString() || '0'}</Txt>
                                                    <Txt className="text-[8px] sm:text-[9px] text-gray-400 font-bold uppercase mt-1 tracking-widest text-center">Pay this amount to confirm your order & start production</Txt>
                                                </Box>
                                            </Box>
                                            {selectedOrder.quote.adminNotes && <Box className="mt-4 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white text-[10px] text-gray-600 font-medium leading-relaxed italic text-center">
                                                    " {selectedOrder.quote.adminNotes} "
                                                </Box>}
                                        </Box>}

                                    {/* Location Section */}
                                    <Box className="space-y-2">
                                        <Txt className="text-[9px] font-black uppercase text-gray-400 tracking-[0.2em] flex items-center gap-2 italic">
                                            <I icon={Building2} size={12} className="text-[#843D9B]" /> Service Location
                                        </Txt>
                                        <Box className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100 flex items-start gap-3">
                                            <Box className="p-2 bg-white rounded-xl shadow-sm border border-gray-50">
                                                <I icon={Info} size={14} className="text-gray-400" />
                                            </Box>
                                            <Box>
                                                <Txt className="text-[11px] font-bold text-gray-800 leading-snug">{selectedOrder.location.address}</Txt>
                                                <Txt className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">{selectedOrder.location.city}, {selectedOrder.location.pincode}</Txt>
                                            </Box>
                                        </Box>
                                    </Box>

                                    {/* Measurement Details */}
                                    <Box className="space-y-3">
                                        <Txt className="text-[9px] font-black uppercase text-gray-400 tracking-[0.2em] flex items-center gap-2 italic">
                                            <I icon={Scissors} size={12} className="text-[#843D9B]" /> Measurement Strategy
                                        </Txt>
                                        <Box className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm border-l-4 border-l-[#843D9B]">
                                            <Txt className="text-[10px] font-black text-gray-900 uppercase mb-1">
                                                {selectedOrder.measurementMethod === 'standard-sizes' ? 'Standard Sizing' : selectedOrder.measurementMethod === 'custom-sheet' ? 'Custom Measurement Sheet' : 'On-site Professional Measurement'}
                                            </Txt>
                                            <Txt className="text-[9px] text-gray-400 font-medium leading-tight mb-4">
                                                {selectedOrder.measurementMethod === 'standard-sizes' ? 'We will stitch based on the size distribution provided below.' : selectedOrder.measurementMethod === 'custom-sheet' ? 'Customer will provide an Excel/CSV sheet with detailed body measurements.' : `${appName} will send a professional tailor to the customer location for measurements.`}
                                            </Txt>

                                            {selectedOrder.measurementMethod === 'standard-sizes' && selectedOrder.sizeDistribution && <Box className="grid grid-cols-5 gap-1.5 p-2 bg-gray-50 rounded-xl">
                                                    {Object.entries(selectedOrder.sizeDistribution).map(([size, qty]) => qty > 0 && <Box key={size} className="text-center bg-white py-1.5 rounded-lg border border-gray-100 shadow-sm">
                                                                <Txt className="text-[8px] font-black text-[#843D9B] mb-0.5">{size}</Txt>
                                                                <Txt className="text-[10px] font-black text-gray-900">{qty}</Txt>
                                                            </Box>)}
                                                </Box>}
                                        </Box>
                                    </Box>

                                    {/* Request Section */}
                                    <Box className="space-y-3">
                                        <Txt className="text-[9px] sm:text-[11px] font-black uppercase text-gray-400 tracking-[0.2em] flex items-center gap-2 italic">
                                            <I icon={ClipboardList} size={12} className="text-[#843D9B]" /> Requirements
                                        </Txt>
                                        <Box className="bg-white p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/50 space-y-4">
                                            <Box className="flex justify-between items-start">
                                                <Box className="min-w-0">
                                                    <Txt className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight leading-none mb-1.5 truncate">{selectedOrder.serviceType}</Txt>
                                                    <Txt className="text-[9px] sm:text-[11px] font-bold text-[#843D9B] uppercase tracking-[0.2em] italic">{selectedOrder.orderType} Category</Txt>
                                                </Box>
                                                <Box className="text-right shrink-0">
                                                    <Txt className="text-md sm:text-lg font-black text-gray-900 leading-none">{selectedOrder.estimatedQuantity}</Txt>
                                                    <Txt className="text-[7px] sm:text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Units</Txt>
                                                </Box>
                                            </Box>
                                            <Box className="h-px bg-gray-50 w-full" />
                                            <Box className="flex items-center gap-2">
                                                <Box className="p-1.5 bg-indigo-50 rounded-lg text-[#843D9B]">
                                                    <I icon={Info} size={12} />
                                                </Box>
                                                <Box>
                                                    <Txt className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Fabric Choice</Txt>
                                                    <Txt className="text-[10px] font-bold text-gray-700 capitalize">{selectedOrder.fabricPreference.replace(/-/g, ' ')}</Txt>
                                                </Box>
                                            </Box>
                                            {selectedOrder.notes && <Box className="p-3.5 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                                                    <Txt className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                                        <I icon={FileText} size={10} /> My Notes
                                                    </Txt>
                                                    <Txt className="text-xs text-gray-600 font-medium leading-relaxed italic">
                                                        "{selectedOrder.notes}"
                                                    </Txt>
                                                </Box>}
                                        </Box>
                                    </Box>
                                </Scroll>

                                {/* Bottom Action (if quoted) */}
                                {selectedOrder.status === 'quoted' && <Box className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-white/80 backdrop-blur-xl border-t border-gray-100 flex gap-3 sm:gap-4">
                                        <Btn onPress={() => navigate('/user/checkout/summary', {
                state: {
                  bulkOrderId: selectedOrder._id
                }
              })} className="flex-1 py-3.5 sm:py-4 bg-[#843D9B] text-white rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest shadow-xl shadow-indigo-200 active:scale-95 transition-all">
                                            Accept Quote & Pay
                                        </Btn>
                                    </Box>}
                            </Box>}
                    </Sheet>
                </React.Fragment>

                {/* Info Card - Compact */}
                <Box className="mt-8 p-4 bg-white rounded-2xl border border-gray-100 shadow-lg shadow-gray-200/30 flex flex-col sm:flex-row items-center gap-4 mx-1">
                    <Box className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-[#843D9B] shrink-0">
                        <I icon={Info} size={20} />
                    </Box>
                    <Box className="text-center sm:text-left">
                        <Txt className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-1">About Bulk Pricing</Txt>
                        <Txt className="text-[9px] text-gray-500 font-medium leading-tight">
                            Orders are manually reviewed. Once quoted, approve to start production.
                        </Txt>
                    </Box>
                </Box>
            </Box>
                    </Scroll>
</Box></Screen>;
};
export default MyBulkOrders;
