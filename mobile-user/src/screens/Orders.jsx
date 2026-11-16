// Port of modules/customer/pages/Orders.jsx (converted with scripts/web2rn.js, then reviewed)
import Spin from '../components/ui/Spin';
import Select from '../components/ui/Select';
import Screen from '../components/common/Screen';
import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from '../lib/nav';
import { Package, Search, ListFilter, Ruler, Bell, Calendar, Clock, Truck, CheckCircle2, Scissors, PenTool, ShieldCheck, MessageCircle, ShoppingBag } from "lucide-react-native";
import useOrderStore from "../store/orderStore";
import OrderCard from "../components/customer/orders/OrderCard";
import AlterationCard from "../components/customer/orders/AlterationCard";
import CustomDesignCard from "../components/customer/orders/CustomDesignCard";
import BottomNav from "../components/customer/BottomNav";
import { io } from "socket.io-client";
import { SOCKET_URL } from "../lib/config";
import useAuthStore from "../store/authStore";
import { getToken } from "../lib/auth";
import api from "../lib/api";
import { Box, Txt, Btn, I, Input, Scroll } from '../components/ui/primitives';
const OrdersPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    orders,
    fetchOrders,
    isLoading
  } = useOrderStore();
  const {
    user
  } = useAuthStore();
  const [alterations, setAlterations] = useState([]);
  const [customDesigns, setCustomDesigns] = useState([]);
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'orders');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Typewriter effect for placeholder
  const searchPhrases = useMemo(() => ['by order ID', 'tailors', 'designs', 'stitching', 'alterations'], []);
  const [placeholderText, setPlaceholderText] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  useEffect(() => {
    let timer;
    const currentPhrase = searchPhrases[phraseIndex];
    if (isDeleting) {
      timer = setTimeout(() => {
        setPlaceholderText(currentPhrase.substring(0, placeholderText.length - 1));
      }, 50);
    } else {
      timer = setTimeout(() => {
        setPlaceholderText(currentPhrase.substring(0, placeholderText.length + 1));
      }, 100);
    }
    if (!isDeleting && placeholderText === currentPhrase) {
      timer = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && placeholderText === '') {
      setIsDeleting(false);
      setPhraseIndex(prev => (prev + 1) % searchPhrases.length);
    }
    return () => clearTimeout(timer);
  }, [placeholderText, isDeleting, phraseIndex, searchPhrases]);
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);
  useEffect(() => {
    fetchOrders();
    fetchAlterations();
    fetchCustomDesigns();
    const socket = io(SOCKET_URL, {
      auth: {
        token: getToken()
      }
    });
    if (user?.id || user?._id) {
      const userId = user.id || user._id;
      const joinOwnRoom = () => socket.emit('join_user_room', String(userId));
      socket.on('connect', joinOwnRoom);
      joinOwnRoom();
    }
    socket.on('new_notification', data => {
      fetchOrders();
    });
    socket.on('order_status_updated', data => {
      fetchOrders();
    });
    return () => {
      socket.off('new_notification');
      socket.off('order_status_updated');
      socket.disconnect();
    };
  }, [fetchOrders, user?.id, user?._id]);
  const fetchAlterations = async () => {
    try {
      const res = await api.get('/alterations');
      if (res.data.success) {
        setAlterations(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch alterations:', error);
    }
  };
  const fetchCustomDesigns = async () => {
    try {
      const res = await api.get('/custom-designs');
      if (res.data.success) {
        setCustomDesigns(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch custom designs:', error);
    }
  };
  const matchSearch = item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const idMatch = (item.orderId || item._id || '').toLowerCase().includes(q);
    let detailsMatch = false;
    if (item.items) {
      detailsMatch = item.items.some(i => (i.service?.title || i.service?.name || '').toLowerCase().includes(q) || (i.product?.name || '').toLowerCase().includes(q));
    } else if (item.garmentType) {
      detailsMatch = item.garmentType.toLowerCase().includes(q);
    } else if (item.designType || item.referenceStyle) {
      detailsMatch = ((item.designType || '') + ' ' + (item.referenceStyle || '')).toLowerCase().includes(q);
    }
    return idMatch || detailsMatch;
  };

  // Filter Logic
  let activeData = [];
  if (activeTab === 'orders' || activeTab === 'completed') activeData = orders || [];else if (activeTab === 'alterations') activeData = alterations || [];else if (activeTab === 'custom-designs') activeData = customDesigns || [];

  // Base filtering for Completed tab
  if (activeTab === 'completed') {
    activeData = activeData.filter(o => ['delivered', 'completed', 'product-delivered', 'order-completed'].includes((o.status || '').toLowerCase()));
  }
  const filteredData = activeData.filter(o => (filterStatus === 'All' || (o.status || '').toLowerCase() === filterStatus.toLowerCase()) && matchSearch(o));

  // Stats calculation based on active tab (or all)
  const stats = useMemo(() => {
    const dataToStat = activeData;
    return {
      all: dataToStat.length,
      pending: dataToStat.filter(o => (o.status || '').toLowerCase() === 'pending').length,
      inProgress: dataToStat.filter(o => {
        const s = (o.status || '').toLowerCase();
        return ['in-progress', 'fabric-picked', 'stitching', 'cutting', 'hemming', 'with-tailor'].includes(s);
      }).length,
      outForDelivery: dataToStat.filter(o => (o.status || '').toLowerCase() === 'out-for-delivery').length,
      delivered: dataToStat.filter(o => {
        const s = (o.status || '').toLowerCase();
        return ['delivered', 'completed', 'product-delivered', 'order-completed'].includes(s);
      }).length
    };
  }, [activeData]);
  return <Screen className="bg-[#F7F8FC]" bottom={false} statusBg="bg-[#6b2a80]" statusBar="light"><Box className="flex-1 bg-[#F7F8FC] font-sans">
            {/* 1. Purple Header */}
            <Box className="sticky top-0 z-50 bg-[#6b2a80] bg-gradient-to-r from-[#6b2a80] to-[#843D9B] shadow-md px-4 md:px-6 lg:px-8 pt-4 pb-4 rounded-b-[1.25rem]">
                <Box className="flex justify-between items-center mb-3">
                    <Box>
                        <Txt className="text-[22px] font-black text-white mb-0.5 tracking-tight leading-none">My Orders</Txt>
                        <Txt className="text-[11px] font-medium text-[#E0BBE4]">Track and manage your requests</Txt>
                    </Box>
                    <Box className="flex items-center gap-4">
                        <Btn className="text-white hover:text-gray-200 transition-colors">
                            <I icon={Search} size={22} />
                        </Btn>
                        <Btn onPress={() => navigate('/user/notifications')} className="relative text-white hover:text-gray-200 transition-colors cursor-pointer">
                            <I icon={Bell} size={22} />
                        </Btn>
                    </Box>
                </Box>

                {/* Search & Filter Bar */}
                <Box className="bg-white rounded-full flex items-center shadow-sm overflow-hidden h-11 border border-gray-100">
                    <Box className="flex items-center gap-2 flex-1 px-3.5">
                        <I icon={Search} size={16} className="text-gray-400 shrink-0" />
                        <Input value={searchQuery} onChangeText={e => setSearchQuery(e)} placeholder={`Search ${placeholderText}|`} className="bg-transparent text-[12px] font-medium text-gray-700 flex-1 focus:outline-none placeholder:text-gray-400 py-1" />
                    </Box>
                    
                    <Box className="w-[1px] h-5 bg-gray-200 shrink-0"></Box>

                    <Select value={filterStatus} onChange={setFilterStatus} title="Filter by status"
                        options={[{ value: 'All', label: 'All Status' }, { value: 'pending', label: 'Pending' }, { value: 'accepted', label: 'Accepted' }, { value: 'in-progress', label: 'In Progress' }, { value: 'completed', label: 'Completed' }, { value: 'delivered', label: 'Delivered' }, { value: 'cancelled', label: 'Cancelled' }]}
                        className="relative shrink-0 flex flex-row items-center justify-center gap-1.5 h-full px-4"
                        trigger={<><I icon={ListFilter} size={14} className="text-[#3b4c68]" /><Txt className="text-[11px] font-bold text-[#1F2937]">Filters</Txt></>} />
                </Box>
            </Box>
            <Scroll className="flex-1" contentClassName="pb-6">

            {/* 2. Tabs */}
            <Scroll contentClassName="px-4 py-3 flex gap-8 bg-white overflow-x-auto no-scrollbar shadow-sm" horizontal>
                <Btn onPress={() => setActiveTab('orders')} className={`pb-2.5 flex items-center gap-1.5 text-[11px] font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'orders' ? 'text-[#843D9B] border-[#843D9B]' : 'text-gray-500 border-transparent hover:text-gray-700'}`}>
                    <I icon={ShoppingBag} size={14} fill={activeTab === 'orders' ? 'currentColor' : 'none'} className={activeTab === 'orders' ? 'text-[#843D9B]' : 'text-gray-500'} /> Orders
                </Btn>
                <Btn onPress={() => setActiveTab('alterations')} className={`pb-2.5 flex items-center gap-1.5 text-[11px] font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'alterations' ? 'text-[#843D9B] border-[#843D9B]' : 'text-gray-500 border-transparent hover:text-gray-700'}`}>
                    <I icon={Scissors} size={14} /> Alterations
                </Btn>
                <Btn onPress={() => setActiveTab('custom-designs')} className={`pb-2.5 flex items-center gap-1.5 text-[11px] font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'custom-designs' ? 'text-[#843D9B] border-[#843D9B]' : 'text-gray-500 border-transparent hover:text-gray-700'}`}>
                    <I icon={PenTool} size={14} /> Custom Designs
                </Btn>
                <Btn onPress={() => setActiveTab('completed')} className={`pb-2.5 flex items-center gap-1.5 text-[11px] font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === 'completed' ? 'text-[#843D9B] border-[#843D9B]' : 'text-gray-500 border-transparent hover:text-gray-700'}`}>
                    <I icon={CheckCircle2} size={14} /> Completed
                </Btn>
            </Scroll>


            {/* 4. Orders List */}
            <Box className="px-4 md:px-6 lg:px-8 space-y-3.5 mb-6">
                {isLoading ? <Box className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                        <Spin size={40} className="text-[#843D9B]" />
                        <Txt className="text-xs text-gray-500 font-bold uppercase tracking-wider">Loading {activeTab}...</Txt>
                    </Box> : filteredData.length === 0 ? <Box className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm text-center">
                        <I icon={Package} size={40} className="text-gray-300 mb-3" />
                        <Txt className="text-[13px] font-black text-gray-900">No {activeTab} found</Txt>
                        <Txt className="text-[11px] text-gray-500 mt-1 max-w-[200px] font-medium">
                            We couldn't find any orders matching your criteria.
                        </Txt>
                    </Box> : <Box className="flex flex-col gap-3.5">
                        {activeTab === 'alterations' ? filteredData.map(alt => <AlterationCard key={alt._id} alteration={alt} onPaymentSuccess={() => {
          fetchAlterations();
          fetchOrders();
        }} />) : activeTab === 'custom-designs' ? filteredData.map(design => <CustomDesignCard key={design._id} design={design} onPaymentSuccess={() => {
          fetchCustomDesigns();
          fetchOrders();
        }} />) : filteredData.map(order => <OrderCard key={order._id || order.orderId} order={order} />)}
                    </Box>}
            </Box>

            {/* 5. Quality/Help Section */}
            <Box className="px-4 pb-28 md:px-6 lg:px-8">
                <Box className="bg-[#F8F5FF] rounded-2xl p-4 flex items-center justify-between border border-[#843D9B]/10">
                    <Box className="flex items-center gap-3">
                        <Box className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-[#843D9B] shrink-0">
                            <I icon={ShieldCheck} size={20} />
                        </Box>
                        <Box className="min-w-0">
                            <Txt className="text-[11px] font-black text-gray-900 line-clamp-1">Quality stitching. On-time delivery.</Txt>
                            <Txt className="text-[10px] text-gray-500 font-medium mt-0.5 line-clamp-1">We care about every detail of your order.</Txt>
                        </Box>
                    </Box>
                    <Btn onPress={() => navigate('/user/support')} className="shrink-0 flex items-center gap-1.5 text-[10px] font-bold text-[#843D9B] bg-white px-3.5 py-2 rounded-full border border-[#843D9B]/20 hover:bg-[#843D9B]/10 active:scale-95 transition-all shadow-sm">
                        <I icon={MessageCircle} size={12} /> Need Help?
                    </Btn>
                </Box>
            </Box>

                        </Scroll>
{/* Bottom Nav */}
            <BottomNav />
        </Box></Screen>;
};
export default OrdersPage;
