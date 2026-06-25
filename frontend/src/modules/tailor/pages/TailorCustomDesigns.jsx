import React, { useState, useEffect } from 'react';
import { Ruler, CheckCircle, Search, X, Wand2 } from 'lucide-react';
import api from '../../../utils/api';
import toast from 'react-hot-toast';
import { useTailorAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../../config/constants';

const TailorCustomDesigns = () => {
    const { user } = useTailorAuth();
    const [designs, setDesigns] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [quoteModalOpen, setQuoteModalOpen] = useState(false);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [fullscreenImage, setFullscreenImage] = useState(null);
    const [selectedDesign, setSelectedDesign] = useState(null);
    const [quoteAmount, setQuoteAmount] = useState('');
    const [estimatedTime, setEstimatedTime] = useState('');

    useEffect(() => {
        fetchDesigns();

        const socket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling']
        });

        const userId = user?.id || user?._id;
        if (userId) socket.emit('join', `user_${userId}`);

        socket.on('new_notification', (data) => {
            if (data.type === 'CUSTOM_DESIGN_REQUEST' || data.type === 'ORDER_CREATED') {
                fetchDesigns();
            }
        });

        return () => socket.disconnect();
    }, [user]);

    const fetchDesigns = async () => {
        try {
            const res = await api.get('/custom-designs');
            if (res.data.success) {
                setDesigns(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch custom designs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenQuote = (design) => {
        setSelectedDesign(design);
        setQuoteAmount('');
        setEstimatedTime('');
        setQuoteModalOpen(true);
    };

    const handleOpenDetails = (design) => {
        setSelectedDesign(design);
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
            const res = await api.patch(`/custom-designs/${selectedDesign._id}/quote`, {
                quoteAmount: Number(quoteAmount),
                estimatedCompletionTime: estimatedTime
            });
            if (res.data.success) {
                toast.success("Quote sent to customer!");
                setQuoteModalOpen(false);
                setDetailsModalOpen(false);
                fetchDesigns();
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to submit quote");
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'quoted': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'accepted': return 'bg-green-100 text-green-700 border-green-200';
            case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="pb-24">
            <div className="bg-[#0A0A0A] px-4 py-6 md:px-8 md:py-8 lg:rounded-b-[2.5rem] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#843D9B] opacity-10 rounded-full blur-3xl" />
                <h1 className="text-2xl font-black text-white relative z-10">Custom Design Requests</h1>
                <p className="text-gray-400 text-xs mt-1 relative z-10">Manage custom designs from customers and submit quotes</p>
            </div>

            <div className="p-4 md:p-8 space-y-4 max-w-5xl mx-auto -mt-6">
                
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                        <div className="w-10 h-10 border-4 border-[#843D9B] border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-xs text-gray-500">Loading requests...</p>
                    </div>
                ) : designs.length === 0 ? (
                    <div className="bg-white rounded-3xl p-10 text-center border border-gray-100 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Wand2 size={32} className="text-gray-300" />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 mb-1">No Custom Designs Yet</h3>
                        <p className="text-sm text-gray-500 max-w-[250px]">
                            When customers request custom stitching designs, they will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {designs.map((design) => (
                            <div key={design._id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold tracking-wider uppercase mb-1">Req ID: {design.customDesignId}</p>
                                        <h3 className="text-sm font-black text-gray-900">{design.customer?.name || 'Customer'}</h3>
                                    </div>
                                    <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border ${getStatusStyle(design.quotationStatus)}`}>
                                        {design.quotationStatus}
                                    </span>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-3 flex gap-3 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleOpenDetails(design)}>
                                    <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                                        {design.images && design.images[0] && (
                                            <img src={design.images[0]} alt="Garment" className="w-full h-full object-cover" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                                        <p className="text-xs text-gray-700 line-clamp-2">{design.description}</p>
                                        <p className="text-[10px] font-bold text-[#843D9B] mt-1">View Full Details & {design.images?.length || 0} Images &rarr;</p>
                                    </div>
                                </div>

                                {design.quotationStatus === 'pending' ? (
                                    <button 
                                        onClick={() => handleOpenQuote(design)}
                                        className="mt-2 w-full bg-[#843D9B] text-white py-2.5 rounded-xl text-xs font-black tracking-wider uppercase hover:bg-[#1E1F4D] transition-colors"
                                    >
                                        Submit Quote
                                    </button>
                                ) : (
                                    <div className="mt-2 flex justify-between items-center bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Your Quote</span>
                                        <span className="text-sm font-black text-[#843D9B]">₹{design.quoteAmount}</span>
                                    </div>
                                )}

                                {design.advancePaymentStatus === 'paid' && design.quotationStatus === 'accepted' && (
                                    <div className="mt-1 flex items-center justify-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 py-1.5 rounded-lg border border-emerald-100">
                                        <CheckCircle size={12} /> Payment Received. Order Auto-Created.
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Details Modal */}
            {detailsModalOpen && selectedDesign && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
                        <button 
                            onClick={() => setDetailsModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors bg-white rounded-full p-1 shadow-sm border border-gray-100"
                        >
                            <X size={20} />
                        </button>
                        <h2 className="text-lg font-black text-gray-900 mb-4 pr-8">Design Details</h2>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Reference Images ({selectedDesign.images?.length})</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {selectedDesign.images?.map((img, idx) => (
                                        <div 
                                            key={idx} 
                                            className="aspect-square rounded-xl border border-gray-200 overflow-hidden bg-gray-50 cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={() => setFullscreenImage(img)}
                                        >
                                            <img src={img} alt={`Design ${idx + 1}`} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Customer Description</label>
                                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{selectedDesign.description}</p>
                            </div>
                        </div>

                        <div className="mt-6">
                            <button 
                                onClick={() => {
                                    setDetailsModalOpen(false);
                                    if (selectedDesign.quotationStatus === 'pending') {
                                        handleOpenQuote(selectedDesign);
                                    }
                                }}
                                className="w-full bg-gray-900 text-white py-3.5 rounded-xl text-xs font-black tracking-wider uppercase hover:bg-black transition-colors"
                            >
                                {selectedDesign.quotationStatus === 'pending' ? 'Submit Quote Now' : 'Close Details'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Fullscreen Image Overlay */}
            {fullscreenImage && (
                <div 
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md cursor-zoom-out"
                    onClick={() => setFullscreenImage(null)}
                >
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setFullscreenImage(null);
                        }}
                        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors bg-black/50 rounded-full p-2"
                    >
                        <X size={24} />
                    </button>
                    <img 
                        src={fullscreenImage} 
                        alt="Fullscreen view" 
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()} 
                    />
                </div>
            )}

            {/* Quote Modal */}
            {quoteModalOpen && selectedDesign && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-sm relative">
                        <button 
                            onClick={() => setQuoteModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors"
                        >
                            <X size={20} />
                        </button>
                        <h2 className="text-lg font-black text-gray-900 mb-2">Submit Quote</h2>
                        <p className="text-xs text-gray-500 mb-6 leading-relaxed">
                            Review the customer's design request and provide your final quote. Once accepted and advance paid by the customer, a new order will be created.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Quote Amount (₹)</label>
                                <input 
                                    type="number" 
                                    placeholder="e.g., 5000"
                                    value={quoteAmount}
                                    onChange={(e) => setQuoteAmount(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-black text-gray-900 outline-none focus:ring-2 focus:ring-[#843D9B]/20 focus:border-[#843D9B] transition-all"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">Estimated Time</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g., 7-10 days"
                                    value={estimatedTime}
                                    onChange={(e) => setEstimatedTime(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-black text-gray-900 outline-none focus:ring-2 focus:ring-[#843D9B]/20 focus:border-[#843D9B] transition-all"
                                />
                            </div>

                            <button 
                                onClick={handleSubmitQuote}
                                className="w-full bg-[#843D9B] text-white py-3.5 rounded-xl text-xs font-black tracking-wider uppercase hover:bg-[#1E1F4D] transition-colors"
                            >
                                Send Quote
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TailorCustomDesigns;
