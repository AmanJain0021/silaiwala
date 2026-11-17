// Port of modules/tailor/pages/DeliveryDetails.jsx (converted with scripts/web2rn.js, then reviewed)
import { useNavigate } from '../lib/nav';
import { Linking } from 'react-native';
import React, { useState, useEffect } from "react";
import { Phone, MessageSquare, History, User, MapPin, Truck, Loader2, PackageSearch } from "lucide-react-native";
import api from "../lib/api";
import { Box, Txt, I, Img, Btn, Scroll } from '../components/ui/primitives';
import Spin from '../components/ui/Spin';
const DeliveryDetails = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const fetchDeliveryDetails = async () => {
      try {
        const response = await api.get('/tailors/delivery-details');
        if (response.data.success) setData(response.data.data);
      } catch (error) {
        console.error('Error fetching delivery details:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDeliveryDetails();
  }, []);
  if (isLoading) {
    return <Box className="flex flex-col items-center justify-center py-20 bg-gray-50/50 min-h-screen">
                <Spin size={36} className="text-[#843D9B] animate-spin mb-4" />
                <Txt className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fetching active riders...</Txt>
            </Box>;
  }
  const currentPartner = data?.activePartner;
  const activeTasks = data?.activeTasks || [];
  const recentHistory = data?.history || [];
  if (!currentPartner && activeTasks.length === 0 && recentHistory.length === 0) {
    return <Box className="bg-white border border-gray-100 p-10 rounded-3xl text-center flex flex-col items-center gap-4 mx-4 mt-4 shadow-sm">
                <Box className="w-20 h-20 bg-[#843D9B]/10 rounded-full flex items-center justify-center text-[#843D9B]">
                    <I icon={Truck} size={40} />
                </Box>
                <Txt className="text-lg font-black text-gray-900">No active deliveries</Txt>
                <Txt className="text-[11px] text-gray-500 font-bold uppercase tracking-widest max-w-[200px]">
                    Once a courier is assigned to your orders, they will appear here.
                </Txt>
            </Box>;
  }
  return <Box className="space-y-4 animate-in fade-in duration-500 pb-20 bg-gray-50/50 min-h-screen p-4">

            {/* Active Partner Card */}
            {currentPartner ? <Box className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
                    {/* Glow */}
                    <Box className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-[#843D9B]/5 blur-2xl pointer-events-none" />

                    <Box className="flex flex-col items-center">
                        <Box className="h-20 w-20 bg-[#1A1A1A] rounded-[2rem] border-2 border-[#2A2A2A] overflow-hidden flex items-center justify-center shadow-xl">
                            {currentPartner.profileImage ? <Img src={currentPartner.profileImage} alt={currentPartner.name} className="w-full h-full object-cover" /> : <I icon={User} size={40} className="text-white/10" />}
                        </Box>
                        <Txt className="text-xl font-black text-white mt-4 tracking-tight">{currentPartner.name}</Txt>
                        <Box className="flex items-center gap-1.5 mt-2 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                            <Txt className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <Txt className="text-[9px] font-black uppercase text-emerald-400 tracking-widest">Currently Active</Txt>
                        </Box>
                    </Box>

                    <Box className="grid grid-cols-2 gap-3 mt-6">
                        <Btn onPress={() => Linking.openURL(`tel:${currentPartner.phone || '+91'}`)} className="flex items-center justify-center gap-2 py-3 bg-[#843D9B] rounded-2xl text-white font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all no-underline shadow-lg shadow-[#843D9B]/25">
                            <I icon={Phone} size={14} fill="currentColor" /> Call
                        </Btn>
                        <Btn className="flex items-center justify-center gap-2 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl text-white/50 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all outline-none">
                            <I icon={MessageSquare} size={14} /> Chat
                        </Btn>
                    </Box>

                    <Box className="mt-4">
                        <Box className="flex items-center justify-between p-3.5 bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A]">
                            <Box className="flex items-center gap-3">
                                <Box className="text-[#843D9B]"><I icon={Truck} size={18} /></Box>
                                <Txt className="text-xs font-bold text-white/40">Active Task</Txt>
                            </Box>
                            <Txt className="text-[11px] font-black text-white uppercase">#{currentPartner.orderId} · {currentPartner.task}</Txt>
                        </Box>
                    </Box>
                </Box> : <Box className="bg-[#843D9B] p-6 rounded-3xl text-white flex items-center justify-between relative overflow-hidden">
                    <Box className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
                    <Box>
                        <Txt className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Status</Txt>
                        <Txt className="text-lg font-black tracking-tight leading-none uppercase italic">Waiting for Courier</Txt>
                    </Box>
                    <Box className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                        <I icon={PackageSearch} size={22} className="text-white animate-pulse" />
                    </Box>
                </Box>}

            {/* Delivery History */}
            <Box className="space-y-3">
                <Box className="flex items-center gap-2 px-1">
                    <I icon={History} size={14} className="text-white/25" />
                    <Txt className="text-[11px] font-black text-white/25 uppercase tracking-widest">Delivery History</Txt>
                </Box>
                <Box className="space-y-2.5">
                    {recentHistory.length > 0 ? recentHistory.map((item, idx) => <Box key={idx} className="bg-[#111111] p-4 rounded-3xl border border-[#1E1E1E] flex items-center justify-between">
                            <Box className="flex items-center gap-3">
                                <Box className="h-9 w-9 bg-[#843D9B]/10 rounded-xl flex items-center justify-center text-[#843D9B] font-black text-[11px]">
                                    {new Date(item.deliveredAt).getDate()}
                                </Box>
                                <Box>
                                    <Txt className="text-xs font-black text-white leading-none">Order #{item.orderId}</Txt>
                                    <Txt className="text-[9px] text-white/30 font-bold uppercase mt-1 tracking-tighter">Handed to {item.partnerName}</Txt>
                                </Box>
                            </Box>
                            <Txt className="text-[9px] font-black uppercase px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                {item.status}
                            </Txt>
                        </Box>) : <Box className="bg-[#111111] p-6 rounded-3xl border border-[#1E1E1E] text-center text-[10px] font-black uppercase text-white/15 tracking-widest italic">
                            No recent fulfillment history
                        </Box>}
                </Box>
            </Box>
        </Box>;
};
export default DeliveryDetails;