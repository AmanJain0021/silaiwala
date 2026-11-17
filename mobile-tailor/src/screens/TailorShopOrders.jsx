// Port of modules/tailor/pages/TailorShopOrders.jsx (converted with scripts/web2rn.js, then reviewed)
import { useNavigate } from '../lib/nav';
import { Linking } from 'react-native';
import { Dialog, Sheet } from '../components/ui/Sheet';
import React, { useCallback, useEffect, useState } from "react";
import { Package, Loader2, Store, Search, Phone, Calendar, Ruler, AlertTriangle, Sparkles, Scissors, Clock, CheckCircle2, ChevronRight, X, Info } from "lucide-react-native";
import toast from '../lib/toast';
import api from "../lib/api";
import OfflineProductionPipeline from "../components/admin/OfflineProductionPipeline";
import MeasurementDataDisplay from "../components/common/MeasurementDataDisplay";
import { OFFLINE_PIPELINE_STEPS, getOfflineStatusLabel, offlineStatusStyle } from "../utils/admin/offlineOrderStatus";
import { io } from "socket.io-client";
import { SOCKET_URL } from "../lib/config";
import { getToken } from "../lib/auth";
import { Box, I, Txt, Input, Btn, Img, Scroll } from '../components/ui/primitives';
import Spin from '../components/ui/Spin';
const STATUS_TABS = [{
  key: 'active',
  label: 'Active'
}, {
  key: 'all',
  label: 'All'
}, {
  key: 'accepted',
  label: 'Accepted'
}, {
  key: 'cutting',
  label: 'Cutting'
}, {
  key: 'stitching',
  label: 'Stitching'
}, {
  key: 'fitting',
  label: 'Fitting'
}, {
  key: 'finishing',
  label: 'Finishing'
}, {
  key: 'ready',
  label: 'Ready'
}, {
  key: 'delivered',
  label: 'Delivered'
}];
const TailorShopOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/tailors/offline-orders', {
        params
      });
      if (res.data?.success) {
        const list = res.data.data || [];
        setOrders(list);
        setSelected(prev => {
          if (!prev) return prev;
          return list.find(o => o._id === prev._id) || prev;
        });
      }
    } catch {
      toast.error('Could not load shop orders');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Live socket updates
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      auth: {
        token: getToken()
      }
    });
    const handleUpdate = () => {
      fetchOrders();
    };
    socket.on('receive_new_offline_order', handleUpdate);
    socket.on('offline_order_assigned', handleUpdate);
    socket.on('offline_order_status_update', handleUpdate);
    return () => {
      socket.off('receive_new_offline_order', handleUpdate);
      socket.off('offline_order_assigned', handleUpdate);
      socket.off('offline_order_status_update', handleUpdate);
      socket.disconnect();
    };
  }, [fetchOrders]);
  const handleStatus = async (orderId, status) => {
    setUpdatingId(orderId);
    try {
      const res = await api.patch(`/tailors/offline-orders/${orderId}/status`, {
        status
      });
      if (res.data?.success) {
        toast.success(`Updated to ${getOfflineStatusLabel(status)}`);
        await fetchOrders();
        if (selected?._id === orderId) setSelected(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setUpdatingId(null);
    }
  };
  const filteredOrders = orders.filter(o => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (o.orderId || '').toLowerCase().includes(q) || (o.garmentType || '').toLowerCase().includes(q) || (o.offlineCustomer?.name || '').toLowerCase().includes(q) || (o.offlineCustomer?.phone || '').includes(q);
  });
  return <Box className="max-w-3xl mx-auto space-y-5 pb-24">
            {/* Header */}
            <Box className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <Box className="flex items-center gap-3">
                    <Box className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <I icon={Store} size={22} />
                    </Box>
                    <Box>
                        <Txt className="text-xl font-black text-gray-900 tracking-tight">Shop Orders</Txt>
                        <Txt className="text-xs text-gray-500">Walk-in and custom workshop orders assigned to you</Txt>
                    </Box>
                </Box>
                <Box className="flex items-center gap-2">
                    <Txt className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-black rounded-xl uppercase tracking-wider">
                        {filteredOrders.length} {filteredOrders.length === 1 ? 'Job' : 'Jobs'}
                    </Txt>
                </Box>
            </Box>

            {/* Search & Status Filters */}
            <Box className="space-y-3">
                <Box className="relative">
                    <I icon={Search} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <Input value={searchQuery} onChangeText={e => setSearchQuery(e)} placeholder="Search by Order ID, Garment or Customer Name/Phone..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium outline-none focus:border-primary shadow-sm" />
                    {searchQuery && <Btn onPress={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <I icon={X} size={14} />
                        </Btn>}
                </Box>

                <Scroll contentClassName="flex gap-1.5 pb-1" className="scrollbar-hide" horizontal>
                    {STATUS_TABS.map(tab => <Btn key={tab.key} onPress={() => setStatusFilter(tab.key)} className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${statusFilter === tab.key ? 'bg-[#843D9B] text-white shadow-sm shadow-[#843D9B]/20' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                            {tab.label}
                        </Btn>)}
                </Scroll>
            </Box>

            {/* Orders List */}
            {isLoading ? <Box className="flex justify-center py-16">
                    <Spin className="animate-spin text-primary" size={28} />
                </Box> : filteredOrders.length === 0 ? <Box className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm">
                    <I icon={Package} className="mx-auto text-gray-300 mb-3" size={36} />
                    <Txt className="text-base font-bold text-gray-700">No shop orders found</Txt>
                    <Txt className="text-xs text-gray-400 mt-1">
                        {statusFilter === 'active' ? 'You have no active walk-in tasks at the moment.' : 'No orders matched your selected status or search filter.'}
                    </Txt>
                </Box> : <Box className="space-y-3">
                    {filteredOrders.map(order => {
        const isUrgent = order.priority === 'urgent';
        return <Btn key={order._id} onPress={() => setSelected(order)} className={`w-full text-left bg-white rounded-2xl border p-4 sm:p-5 transition-all shadow-sm hover:shadow-md ${selected?._id === order._id ? 'border-primary ring-2 ring-primary/10' : 'border-gray-100 hover:border-gray-200'}`}>
                                <Box className="flex justify-between items-start gap-3">
                                    <Box className="space-y-1">
                                        <Box className="flex items-center gap-2">
                                            <Txt className="text-[11px] font-black text-primary uppercase tracking-wider">
                                                #{order.orderId}
                                            </Txt>
                                            {isUrgent && <Txt className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 border border-red-200 rounded-full text-[9px] font-black uppercase">
                                                    <I icon={AlertTriangle} size={10} /> Urgent
                                                </Txt>}
                                            {order.stitchingPackage && <Txt className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-full text-[9px] font-bold uppercase tracking-wider">
                                                    {order.stitchingPackage}
                                                </Txt>}
                                        </Box>

                                        <Txt className="text-base font-black text-gray-900">{order.garmentType}</Txt>

                                        <Txt className="text-xs text-gray-600 font-medium">
                                            {order.offlineCustomer?.name || 'Walk-in Customer'} · {order.offlineCustomer?.phone || ''}
                                        </Txt>

                                        {order.expectedCompletionDate && <Txt className="text-[11px] text-gray-500 flex items-center gap-1.5 pt-0.5">
                                                <I icon={Calendar} size={12} className="text-primary" />
                                                Due: <Txt className="font-bold text-gray-700">{new Date(order.expectedCompletionDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}</Txt>
                                            </Txt>}
                                    </Box>

                                    <Box className="flex flex-col items-end gap-2">
                                        <Txt className={`px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase tracking-wider ${offlineStatusStyle(order.status)}`}>
                                            {getOfflineStatusLabel(order.status)}
                                        </Txt>
                                        <Txt className="text-xs text-primary font-bold flex items-center gap-0.5 mt-2">
                                            View Details <I icon={ChevronRight} size={14} />
                                        </Txt>
                                    </Box>
                                </Box>
                            </Btn>;
      })}
                </Box>}

            {/* Order Details Drawer / Modal */}
            {selected && <Sheet visible={!!(selected)} onClose={() => setSelected(null)} className={`bg-white w-full max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[85vh] flex flex-col overflow-hidden`}>
<Box className="flex-shrink flex flex-col overflow-hidden">
                        {/* Modal Header */}
                        <Box className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <Box>
                                <Box className="flex items-center gap-2">
                                    <Txt className="text-xs font-black text-primary uppercase tracking-wider">
                                        #{selected.orderId}
                                    </Txt>
                                    <Txt className={`px-2 py-0.5 rounded-lg text-[9px] font-black border uppercase ${offlineStatusStyle(selected.status)}`}>
                                        {getOfflineStatusLabel(selected.status)}
                                    </Txt>
                                    {selected.priority === 'urgent' && <Txt className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[9px] font-black uppercase">
                                            Urgent
                                        </Txt>}
                                </Box>
                                <Txt className="text-lg font-black text-gray-900 mt-1">{selected.garmentType}</Txt>
                            </Box>
                            <Btn onPress={() => setSelected(null)} className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                                <I icon={X} size={20} />
                            </Btn>
                        </Box>

                        {/* Modal Content */}
                        <Scroll contentClassName="p-5 space-y-6" className="flex-1 custom-scrollbar" nestedScrollEnabled>
                            {/* Customer Contact Card */}
                            <Box className="bg-purple-50/50 border border-purple-100 rounded-2xl p-4 flex items-center justify-between gap-3">
                                <Box>
                                    <Txt className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Customer Details</Txt>
                                    <Txt className="text-sm font-black text-gray-900 mt-0.5">{selected.offlineCustomer?.name || 'Walk-in Customer'}</Txt>
                                    <Txt className="text-xs text-gray-600 font-medium">{selected.offlineCustomer?.phone || 'No phone provided'}</Txt>
                                    {selected.offlineCustomer?.address && <Txt className="text-[11px] text-gray-500 mt-1">{selected.offlineCustomer.address}</Txt>}
                                </Box>
                                {selected.offlineCustomer?.phone && <Btn onPress={() => Linking.openURL(`tel:${selected.offlineCustomer.phone}`)} className="px-3.5 py-2 bg-[#843D9B] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-[#6B2F7E] transition-colors shrink-0">
                                        <I icon={Phone} size={13} /> Call
                                    </Btn>}
                            </Box>

                            {/* Production Status Pipeline */}
                            <Box className="space-y-2">
                                <Txt className="text-xs font-black uppercase tracking-wider text-gray-500">
                                    Update Production Stage
                                </Txt>
                                <OfflineProductionPipeline currentStatus={selected.status} onSelectStatus={status => handleStatus(selected._id, status)} disabled={updatingId === selected._id} compact />
                            </Box>

                            {/* Key Order Specs */}
                            <Box className="bg-gray-50 rounded-2xl p-4 space-y-2.5 border border-gray-100 text-xs">
                                <Box className="flex justify-between">
                                    <Txt className="text-gray-500 font-medium">Stitching Package</Txt>
                                    <Txt className="font-bold capitalize">{selected.stitchingPackage || 'Basic'}</Txt>
                                </Box>
                                <Box className="flex justify-between">
                                    <Txt className="text-gray-500 font-medium">Fabric Source</Txt>
                                    <Txt className="font-bold capitalize">{selected.fabricSource === 'sewzella' ? 'Platform / SewZella' : 'Customer Provided'}</Txt>
                                </Box>
                                {selected.expectedCompletionDate && <Box className="flex justify-between">
                                        <Txt className="text-gray-500 font-medium">Expected Completion</Txt>
                                        <Txt className="font-bold text-gray-900">
                                            {new Date(selected.expectedCompletionDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
                                        </Txt>
                                    </Box>}
                                {selected.notes && <Box className="pt-2 border-t border-gray-200">
                                        <Txt className="text-gray-500 font-medium block mb-1">Tailoring Notes:</Txt>
                                        <Txt className="font-medium text-gray-800 bg-white p-2.5 rounded-xl border border-gray-200">
                                            {selected.notes}
                                        </Txt>
                                    </Box>}
                            </Box>

                            {/* Measurements Section */}
                            <Box className="space-y-3">
                                <Box className="flex items-center justify-between border-b border-gray-100 pb-2">
                                    <Txt className="text-xs font-black uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                                        <I icon={Ruler} size={15} className="text-primary" /> Body Measurements
                                    </Txt>
                                    <Txt className="text-[10px] font-bold text-gray-500 uppercase">
                                        Unit: <Txt className="text-primary">{selected.measurementUnit || 'inches'}</Txt>
                                    </Txt>
                                </Box>

                                {selected.measurements && Object.keys(selected.measurements).length > 0 ? <MeasurementDataDisplay measurements={selected.measurements} className="bg-white" /> : <Txt className="text-xs text-gray-400 italic">No detailed measurement fields recorded.</Txt>}

                                {/* Measurement Reference Photos */}
                                {selected.measurementPhotos && selected.measurementPhotos.length > 0 && <Box className="space-y-2 pt-2">
                                        <Txt className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Reference Photos</Txt>
                                        <Box className="grid grid-cols-3 gap-2">
                                            {selected.measurementPhotos.map((photo, i) => <Btn key={i} onPress={() => navigate(photo)} className="block rounded-xl overflow-hidden border border-gray-200 aspect-square">
                                                    <Img src={photo} alt={`Ref ${i + 1}`} className="w-full h-full object-cover" />
                                                </Btn>)}
                                        </Box>
                                    </Box>}
                            </Box>

                            {/* Style Add-ons & Customizations */}
                            {(() => {
            const slotLabels = {
              neck: 'Neck Design',
              sleeve: 'Sleeve Style',
              bottom: 'Bottom Style',
              embroidery: 'Embroidery Work',
              lacePiping: 'Lace / Piping',
              lining: 'Inner Lining',
              other: 'Customization'
            };
            const rawAddons = selected.styleAddons || selected.addons || [];
            const addons = Array.isArray(rawAddons) ? rawAddons.filter(a => a && (a.name || a.title || Number(a.price) > 0)) : [];
            const rawCusts = selected.customizations || {};
            const custEntries = [];
            if (rawCusts && typeof rawCusts === 'object') {
              for (const [key, val] of Object.entries(rawCusts)) {
                if (!val) continue;
                if (typeof val === 'string') {
                  const trimmed = val.trim();
                  if (trimmed) {
                    custEntries.push({
                      key,
                      label: slotLabels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
                      name: trimmed,
                      price: 0,
                      refImage: '',
                      description: '',
                      notes: ''
                    });
                  }
                } else if (typeof val === 'object') {
                  if (val.enabled === false) continue;
                  const name = val.name || val.title || '';
                  const refImage = val.refImage || val.image || '';
                  const price = Number(val.price) || 0;
                  const description = val.description || '';
                  const notes = val.notes || '';
                  if (name || refImage || price > 0 || description || notes) {
                    custEntries.push({
                      key,
                      label: slotLabels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
                      name: name || (notes ? 'Custom Instruction' : 'Selected Option'),
                      price,
                      refImage,
                      description,
                      notes
                    });
                  }
                }
              }
            }
            if (addons.length === 0 && custEntries.length === 0) return null;
            return <Box className="space-y-3 pt-2">
                                        <Txt className="text-xs font-black uppercase tracking-wider text-gray-900 flex items-center justify-between border-b border-gray-100 pb-2">
                                            <Txt className="flex items-center gap-1.5">
                                                <I icon={Sparkles} size={15} className="text-primary" /> Style Add-ons & Customizations
                                            </Txt>
                                            <Txt className="text-[9px] font-black uppercase bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md">
                                                {addons.length + custEntries.length} Specs
                                            </Txt>
                                        </Txt>

                                        {addons.length > 0 && <Box className="space-y-1.5">
                                                <Txt className="text-[10px] font-black text-indigo-700 uppercase tracking-wider">Style Add-ons</Txt>
                                                <Box className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {addons.map((addon, i) => {
                    const img = addon.image || addon.refImage;
                    return <Box key={i} className="p-2.5 bg-indigo-50/40 rounded-xl border border-indigo-100 flex items-center gap-2.5">
                                                                {img ? <Img src={img} alt={addon.name} className="w-12 h-12 object-cover rounded-lg shrink-0 border border-indigo-100 cursor-pointer shadow-xs" onPress={() => Linking.openURL(img)} /> : <Box className="w-12 h-12 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-black shrink-0">
                                                                        ✨
                                                                    </Box>}
                                                                <Box className="flex-1 min-w-0">
                                                                    <Box className="flex justify-between items-center">
                                                                        <Txt className="text-xs font-bold text-gray-900 truncate">{addon.name}</Txt>
                                                                        {Number(addon.price) > 0 && <Txt className="text-xs font-black text-primary ml-1">+₹{addon.price}</Txt>}
                                                                    </Box>
                                                                    {addon.category && <Txt className="text-[9px] text-gray-500 capitalize">{addon.category}</Txt>}
                                                                </Box>
                                                            </Box>;
                  })}
                                                </Box>
                                            </Box>}

                                        {custEntries.length > 0 && <Box className="space-y-1.5">
                                                <Txt className="text-[10px] font-black text-purple-700 uppercase tracking-wider">Garment Customizations</Txt>
                                                <Box className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {custEntries.map(cust => <Box key={cust.key} className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 flex flex-col justify-between gap-1.5">
                                                            <Box>
                                                                <Box className="flex justify-between items-center text-xs font-bold">
                                                                    <Txt className="text-gray-500 uppercase text-[9px] font-black">{cust.label}:</Txt>
                                                                    <Txt className="text-gray-900 font-black">{cust.name}</Txt>
                                                                    {cust.price > 0 && <Txt className="text-primary font-black text-xs">+₹{cust.price}</Txt>}
                                                                </Box>
                                                                {cust.description && <Txt className="text-[10px] text-gray-500 italic mt-0.5">{cust.description}</Txt>}
                                                                {cust.notes && <Box className="mt-1.5 px-2 py-1 bg-amber-50 border border-amber-200/70 rounded-lg text-amber-900 text-[10px] font-medium flex items-start gap-1">
                                                                        <Txt className="font-bold text-amber-700 shrink-0">📌 Note:</Txt>
                                                                        <Txt className="break-words">{cust.notes}</Txt>
                                                                    </Box>}
                                                            </Box>
                                                            {cust.refImage && <Box className="mt-1">
                                                                    <Img src={cust.refImage} alt={cust.name} className="h-20 w-auto rounded-lg object-cover border border-purple-200 cursor-pointer shadow-xs" onPress={() => Linking.openURL(cust.refImage)} />
                                                                </Box>}
                                                        </Box>)}
                                                </Box>
                                            </Box>}
                                    </Box>;
          })()}
                        </Scroll>

                        {/* Modal Footer */}
                        <Box className="p-4 border-t border-gray-100 bg-gray-50/80">
                            <Btn onPress={() => setSelected(null)} className="w-full py-3 bg-white border border-gray-200 rounded-xl text-xs font-black uppercase tracking-wider text-gray-700 hover:bg-gray-100 transition-colors shadow-sm">
                                Close Details
                            </Btn>
                        </Box>
                    </Box>
</Sheet>}
        </Box>;
};
export default TailorShopOrders;
