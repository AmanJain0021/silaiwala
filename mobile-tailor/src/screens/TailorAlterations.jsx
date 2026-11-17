// Port of modules/tailor/pages/TailorAlterations.jsx (converted with scripts/web2rn.js, then reviewed)
import Spin from '../components/ui/Spin';
import { Dialog, Sheet } from '../components/ui/Sheet';
import React, { useState, useEffect } from "react";
import { Ruler, CheckCircle, Search, X } from "lucide-react-native";
import api from "../lib/api";
import toast from '../lib/toast';
import { useTailorAuth } from "../context/tailor/AuthContext";
import { io } from "socket.io-client";
import { SOCKET_URL } from "../lib/config";
import { Box, Txt, I, Btn, Img, Input, Scroll } from '../components/ui/primitives';
const TailorAlterations = () => {
  const {
    user
  } = useTailorAuth();
  const [alterations, setAlterations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [selectedAlt, setSelectedAlt] = useState(null);
  const [quoteAmount, setQuoteAmount] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  useEffect(() => {
    fetchAlterations();
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });
    const userId = user?.id || user?._id;
    if (userId) socket.emit('join', `user_${userId}`);
    socket.on('new_notification', data => {
      if (data.type === 'ALTERATION_REQUEST' || data.type === 'ORDER_CREATED') {
        fetchAlterations();
      }
    });
    return () => {
      socket.off('new_notification');
    };
  }, [user]);

  // Prevent body scrolling when a modal is open
  useEffect(() => {
    if (detailsModalOpen || quoteModalOpen || fullscreenImage) {
    } else {
    }
    return () => {
    };
  }, [detailsModalOpen, quoteModalOpen, fullscreenImage]);
  const fetchAlterations = async () => {
    try {
      const res = await api.get('/alterations');
      if (res.data.success) {
        setAlterations(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch alterations:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleOpenQuote = alt => {
    setSelectedAlt(alt);
    setQuoteAmount('');
    setEstimatedTime('');
    setQuoteModalOpen(true);
  };
  const handleOpenDetails = alt => {
    setSelectedAlt(alt);
    setDetailsModalOpen(true);
  };
  const handleSubmitQuote = async () => {
    if (!quoteAmount || isNaN(quoteAmount) || Number(quoteAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!estimatedTime.trim()) {
      toast.error("Please enter estimated completion time");
      return;
    }
    try {
      const res = await api.patch(`/alterations/${selectedAlt._id}/quote`, {
        quoteAmount: Number(quoteAmount),
        estimatedCompletionTime: estimatedTime
      });
      if (res.data.success) {
        toast.success("Quote sent to customer!");
        setQuoteModalOpen(false);
        setDetailsModalOpen(false);
        fetchAlterations();
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit quote");
    }
  };
  const getStatusStyle = status => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'quoted':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'accepted':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };
  return <Box className="pb-24 bg-gray-50/50 min-h-screen">
            {/* Sleek Modern Header */}
            <Box className="bg-white border-b border-gray-100 px-4 py-5 md:px-8 md:py-6 shadow-xs">
                <Box className="max-w-5xl mx-auto">
                    <Txt className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Alteration Requests</Txt>
                    <Txt className="text-xs text-gray-500 font-medium mt-0.5">Manage your alteration requests from customers and submit quotes</Txt>
                </Box>
            </Box>

            <Box className="p-4 md:p-8 space-y-4 max-w-5xl mx-auto">
                
                {isLoading ? <Box className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                        <Spin size={40} className="text-[#843D9B]" />
                        <Txt className="text-xs text-gray-500 font-bold">Loading alterations...</Txt>
                    </Box> : alterations.length === 0 ? <Box className="bg-white rounded-3xl p-10 text-center border border-gray-100 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
                        <Box className="w-16 h-16 bg-[#843D9B]/10 rounded-2xl flex items-center justify-center mb-4 text-[#843D9B]">
                            <I icon={Ruler} size={32} />
                        </Box>
                        <Txt className="text-lg font-black text-gray-900 mb-1">No Alterations Yet</Txt>
                        <Txt className="text-xs text-gray-500 max-w-[250px] font-medium">
                            When customers request alterations, they will appear here.
                        </Txt>
                    </Box> : <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {alterations.map(alt => <Box key={alt._id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col gap-3 hover:shadow-md transition-all">
                                <Box className="flex justify-between items-start">
                                    <Box>
                                        <Txt className="text-[10px] text-gray-400 font-bold tracking-wider uppercase mb-1">Alt ID: {alt.alterationId}</Txt>
                                        <Txt className="text-sm font-black text-gray-900">{alt.customer?.name || 'Customer'}</Txt>
                                    </Box>
                                    <Txt className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border ${getStatusStyle(alt.quotationStatus)}`}>
                                        {alt.quotationStatus}
                                    </Txt>
                                </Box>

                                <Btn className="block bg-gray-50 rounded-xl p-3 flex gap-3 cursor-pointer hover:bg-gray-100/80 transition-colors border border-gray-100/80" onPress={() => handleOpenDetails(alt)}>
                                    <Box className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                                        {alt.images && alt.images[0] && <Img src={alt.images[0]} alt="Garment" className="w-full h-full object-cover" />}
                                    </Box>
                                    <Box className="flex-1 min-w-0 flex flex-col justify-between">
                                        <Txt className="text-xs text-gray-700 line-clamp-2 font-medium">{alt.description}</Txt>
                                        <Txt className="text-[10px] font-bold text-[#843D9B] mt-1">View Full Details ({alt.images?.length || 0} Images) &rarr;</Txt>
                                    </Box>
                                </Btn>

                                {alt.quotationStatus === 'pending' ? <Btn onPress={() => handleOpenQuote(alt)} className="mt-2 w-full bg-[#843D9B] text-white py-3 rounded-xl text-xs font-black tracking-wider uppercase hover:bg-[#6B2F7E] active:scale-95 transition-all shadow-sm cursor-pointer">
                                        Submit Quote
                                    </Btn> : <Box className="mt-2 flex justify-between items-center bg-gray-50 px-3.5 py-2.5 rounded-xl border border-gray-100">
                                        <Txt className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Your Quote</Txt>
                                        <Txt className="text-sm font-black text-[#843D9B]">₹{alt.quoteAmount}</Txt>
                                    </Box>}

                                {alt.paymentStatus === 'paid' && alt.quotationStatus === 'accepted' && <Box className="mt-1 flex items-center justify-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 py-1.5 rounded-lg border border-emerald-100">
                                        <I icon={CheckCircle} size={12} /> Payment Received. Order Auto-Created.
                                    </Box>}
                            </Box>)}
                    </Box>}
            </Box>

            {/* Details Modal - Modern Centered Modal */}
            {detailsModalOpen && selectedAlt && <Dialog visible={!!(detailsModalOpen && selectedAlt)} onClose={() => setDetailsModalOpen(false)} className={`bg-white rounded-3xl md:p-8 w-full max-w-xl relative max-h-[85vh] shadow-2xl border border-gray-100 custom-scrollbar`}>
<Box className="flex-shrink flex flex-col overflow-hidden"><Scroll className="flex-shrink" contentClassName="p-6" nestedScrollEnabled>
                        <Btn onPress={() => setDetailsModalOpen(false)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 transition-colors bg-gray-50 hover:bg-gray-100 rounded-full p-2 border border-gray-200 shadow-xs cursor-pointer">
                            <I icon={X} size={18} />
                        </Btn>
                        <Txt className="text-xl font-black text-gray-900 mb-1 pr-8">Alteration Details</Txt>
                        <Txt className="text-xs text-gray-500 font-medium mb-6">Request ID: #{selectedAlt.alterationId}</Txt>
                        
                        <Box className="space-y-6">
                            <Box>
                                <Txt className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 block">Garment Images ({selectedAlt.images?.length})</Txt>
                                <Box className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {selectedAlt.images?.map((img, idx) => <Btn key={idx} className="block aspect-square rounded-2xl border border-gray-200 overflow-hidden bg-gray-50 cursor-pointer hover:opacity-90 transition-all group relative shadow-xs" onPress={() => setFullscreenImage(img)}>
                                            <Img src={img} alt={`Alteration ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        </Btn>)}
                                </Box>
                            </Box>

                            <Box className="bg-gray-50/80 rounded-2xl p-4 border border-gray-200/80">
                                <Txt className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Customer Requirements & Notes</Txt>
                                <Txt className="text-xs font-semibold text-gray-800 leading-relaxed whitespace-pre-wrap">{selectedAlt.description || 'No description provided.'}</Txt>
                            </Box>

                            {selectedAlt.deliveryAddress && <Box className="bg-purple-50/60 rounded-2xl p-4 border border-purple-100/80">
                                    <Txt className="text-[10px] font-black text-[#843D9B] uppercase tracking-widest mb-1.5 block">📍 Pickup & Delivery Address</Txt>
                                    <Txt className="text-xs font-bold text-gray-900">{selectedAlt.deliveryAddress.receiverName || selectedAlt.customer?.name}</Txt>
                                    <Txt className="text-xs font-medium text-gray-700 mt-0.5">
                                        {selectedAlt.deliveryAddress.street}, {selectedAlt.deliveryAddress.city}, {selectedAlt.deliveryAddress.state} - {selectedAlt.deliveryAddress.zipCode}
                                    </Txt>
                                    {selectedAlt.deliveryAddress.phoneNumber && <Txt className="text-[11px] font-bold text-gray-500 mt-1">Phone: {selectedAlt.deliveryAddress.phoneNumber}</Txt>}
                                </Box>}
                        </Box>

                        <Box className="mt-8 pt-4 border-t border-gray-100 flex gap-3">
                            <Btn onPress={() => setDetailsModalOpen(false)} className="flex-1 bg-gray-100 text-gray-700 py-3.5 rounded-2xl text-xs font-black tracking-wider uppercase hover:bg-gray-200 transition-all cursor-pointer">
                                Close
                            </Btn>
                            {selectedAlt.quotationStatus === 'pending' && <Btn onPress={() => {
            setDetailsModalOpen(false);
            handleOpenQuote(selectedAlt);
          }} className="flex-1 bg-[#843D9B] text-white py-3.5 rounded-2xl text-xs font-black tracking-wider uppercase hover:bg-[#6B2F7E] transition-all shadow-md cursor-pointer">
                                    Submit Quote
                                </Btn>}
                        </Box>
                    </Scroll></Box>
</Dialog>}

            {/* Fullscreen Image Overlay */}
            {fullscreenImage && <Dialog visible={!!(fullscreenImage)} onClose={() => setFullscreenImage(null)} className={`w-full items-center`}>
<Box className="flex-shrink flex flex-col overflow-hidden">
                    <Btn onPress={e => {
        setFullscreenImage(null);
      }} className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full p-2">
                        <I icon={X} size={24} />
                    </Btn>
                    <Img src={fullscreenImage} alt="Fullscreen view" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" onPress={e => e.stopPropagation()} />
                </Box>
</Dialog>}

            {/* Quote Modal - Modern Centered Modal */}
            {quoteModalOpen && selectedAlt && <Dialog visible={!!(quoteModalOpen && selectedAlt)} onClose={() => setQuoteModalOpen(false)} className={`bg-white rounded-3xl p-6 md:p-8 w-full max-w-md relative shadow-2xl border border-gray-100`}>
<Box className="flex-shrink flex flex-col overflow-hidden">
                        <Btn onPress={() => setQuoteModalOpen(false)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 transition-colors bg-gray-50 hover:bg-gray-100 rounded-full p-2 border border-gray-200 shadow-xs cursor-pointer">
                            <I icon={X} size={18} />
                        </Btn>
                        <Txt className="text-xl font-black text-gray-900 mb-1">Submit Quote</Txt>
                        <Txt className="text-xs text-gray-500 font-medium mb-6 leading-relaxed">
                            Review the customer's request and provide your final quote. Once accepted and paid by the customer, a new order will be created.
                        </Txt>

                        <Box className="space-y-4">
                            <Box>
                                <Txt className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Quote Amount (₹) *</Txt>
                                <Box className="relative">
                                    <Txt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</Txt>
                                    <Input placeholder="e.g. 350" value={quoteAmount} onChangeText={e => setQuoteAmount(e)} className="w-full bg-gray-50/70 border border-gray-200 rounded-2xl pl-9 pr-4 py-3.5 text-xs font-bold text-gray-900 outline-none focus:border-[#843D9B] focus:ring-2 focus:ring-[#843D9B]/10 focus:bg-white transition-all shadow-xs" keyboardType="numeric" />
                                </Box>
                            </Box>

                            <Box>
                                <Txt className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Estimated Delivery Time *</Txt>
                                <Input placeholder="e.g. 2-3 Days" value={estimatedTime} onChangeText={e => setEstimatedTime(e)} className="w-full bg-gray-50/70 border border-gray-200 rounded-2xl px-4 py-3.5 text-xs font-bold text-gray-900 outline-none focus:border-[#843D9B] focus:ring-2 focus:ring-[#843D9B]/10 focus:bg-white transition-all shadow-xs" />
                            </Box>

                            <Btn onPress={handleSubmitQuote} className="w-full bg-[#843D9B] text-white py-4 rounded-2xl text-xs font-black tracking-wider uppercase hover:bg-[#6B2F7E] active:scale-95 transition-all shadow-md mt-2 cursor-pointer">
                                Send Quote to Customer
                            </Btn>
                        </Box>
                    </Box>
</Dialog>}
        </Box>;
};
export default TailorAlterations;
