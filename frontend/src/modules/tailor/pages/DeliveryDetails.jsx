import React, { useState, useEffect } from 'react';
import { Phone, MessageSquare, History, User, MapPin, Truck, Loader2, PackageSearch } from 'lucide-react';
import api from '../../../utils/api';

const DeliveryDetails = () => {
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
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-[#0A0A0A] min-h-screen">
                <Loader2 size={36} className="text-[#2D2F6E] animate-spin mb-4" />
                <p className="text-[10px] font-black text-white/25 uppercase tracking-widest">Fetching active riders...</p>
            </div>
        );
    }

    const currentPartner = data?.activePartner;
    const activeTasks = data?.activeTasks || [];
    const recentHistory = data?.history || [];

    if (!currentPartner && activeTasks.length === 0 && recentHistory.length === 0) {
        return (
            <div className="bg-[#111111] border border-[#1E1E1E] p-10 rounded-3xl text-center flex flex-col items-center gap-4 mx-4 mt-4">
                <div className="w-20 h-20 bg-[#2D2F6E]/10 rounded-full flex items-center justify-center text-[#2D2F6E]/40">
                    <Truck size={40} />
                </div>
                <h3 className="text-lg font-black text-white">No active deliveries</h3>
                <p className="text-[11px] text-white/25 font-bold uppercase tracking-widest max-w-[200px]">
                    Once a courier is assigned to your orders, they will appear here.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-in fade-in duration-500 pb-20 bg-[#0A0A0A] min-h-screen p-4">

            {/* Active Partner Card */}
            {currentPartner ? (
                <div className="bg-[#111111] p-6 rounded-3xl border border-[#1E1E1E] relative overflow-hidden">
                    {/* Glow */}
                    <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-[#2D2F6E]/5 blur-2xl pointer-events-none" />

                    <div className="flex flex-col items-center">
                        <div className="h-20 w-20 bg-[#1A1A1A] rounded-[2rem] border-2 border-[#2A2A2A] overflow-hidden flex items-center justify-center shadow-xl">
                            {currentPartner.profileImage ? (
                                <img src={currentPartner.profileImage} alt={currentPartner.name} className="w-full h-full object-cover" />
                            ) : (
                                <User size={40} className="text-white/10" />
                            )}
                        </div>
                        <h4 className="text-xl font-black text-white mt-4 tracking-tight">{currentPartner.name}</h4>
                        <div className="flex items-center gap-1.5 mt-2 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[9px] font-black uppercase text-emerald-400 tracking-widest">Currently Active</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-6">
                        <a href={`tel:${currentPartner.phone || '+91'}`}
                            className="flex items-center justify-center gap-2 py-3 bg-[#2D2F6E] rounded-2xl text-white font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all no-underline shadow-lg shadow-[#2D2F6E]/25">
                            <Phone size={14} fill="currentColor" /> Call
                        </a>
                        <button className="flex items-center justify-center gap-2 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl text-white/50 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all outline-none">
                            <MessageSquare size={14} /> Chat
                        </button>
                    </div>

                    <div className="mt-4">
                        <div className="flex items-center justify-between p-3.5 bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A]">
                            <div className="flex items-center gap-3">
                                <div className="text-[#2D2F6E]"><Truck size={18} /></div>
                                <span className="text-xs font-bold text-white/40">Active Task</span>
                            </div>
                            <span className="text-[11px] font-black text-white uppercase">#{currentPartner.orderId} · {currentPartner.task}</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-[#2D2F6E] p-6 rounded-3xl text-white flex items-center justify-between relative overflow-hidden">
                    <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Status</p>
                        <h3 className="text-lg font-black tracking-tight leading-none uppercase italic">Waiting for Courier</h3>
                    </div>
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                        <PackageSearch size={22} className="text-white animate-pulse" />
                    </div>
                </div>
            )}

            {/* Delivery History */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                    <History size={14} className="text-white/25" />
                    <h4 className="text-[11px] font-black text-white/25 uppercase tracking-widest">Delivery History</h4>
                </div>
                <div className="space-y-2.5">
                    {recentHistory.length > 0 ? recentHistory.map((item, idx) => (
                        <div key={idx} className="bg-[#111111] p-4 rounded-3xl border border-[#1E1E1E] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 bg-[#2D2F6E]/10 rounded-xl flex items-center justify-center text-[#2D2F6E] font-black text-[11px]">
                                    {new Date(item.deliveredAt).getDate()}
                                </div>
                                <div>
                                    <p className="text-xs font-black text-white leading-none">Order #{item.orderId}</p>
                                    <p className="text-[9px] text-white/30 font-bold uppercase mt-1 tracking-tighter">Handed to {item.partnerName}</p>
                                </div>
                            </div>
                            <span className="text-[9px] font-black uppercase px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                {item.status}
                            </span>
                        </div>
                    )) : (
                        <div className="bg-[#111111] p-6 rounded-3xl border border-[#1E1E1E] text-center text-[10px] font-black uppercase text-white/15 tracking-widest italic">
                            No recent fulfillment history
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DeliveryDetails;
