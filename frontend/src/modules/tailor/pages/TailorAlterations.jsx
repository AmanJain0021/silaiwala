import React, { useState, useEffect } from 'react';
import { Ruler, CheckCircle, Search, X } from 'lucide-react';
import api from '../../../utils/api';
import toast from 'react-hot-toast';
import { useTailorAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../../../config/constants';

const TailorAlterations = () => {
    const { user } = useTailorAuth();
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

        socket.on('new_notification', (data) => {
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
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
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

    const handleOpenQuote = (alt) => {
        setSelectedAlt(alt);
        setQuoteAmount('');
        setEstimatedTime('');
        setQuoteModalOpen(true);
    };

    const handleOpenDetails = (alt) => {
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
        <div className="pb-24 bg-gray-50/50 min-h-screen">
            {/* Sleek Modern Header */}
            <div className="bg-white border-b border-gray-100 px-4 py-5 md:px-8 md:py-6 shadow-xs">
                <div className="max-w-5xl mx-auto">
                    <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Alteration Requests</h1>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Manage your alteration requests from customers and submit quotes</p>
                </div>
            </div>

            <div className="p-4 md:p-8 space-y-4 max-w-5xl mx-auto">
                
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                        <div className="w-10 h-10 border-4 border-[#843D9B] border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-xs text-gray-500 font-bold">Loading alterations...</p>
                    </div>
                ) : alterations.length === 0 ? (
                    <div className="bg-white rounded-3xl p-10 text-center border border-gray-100 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
                        <div className="w-16 h-16 bg-[#843D9B]/10 rounded-2xl flex items-center justify-center mb-4 text-[#843D9B]">
                            <Ruler size={32} />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 mb-1">No Alterations Yet</h3>
                        <p className="text-xs text-gray-500 max-w-[250px] font-medium">
                            When customers request alterations, they will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {alterations.map((alt) => (
                            <div key={alt._id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col gap-3 hover:shadow-md transition-all">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold tracking-wider uppercase mb-1">Alt ID: {alt.alterationId}</p>
                                        <h3 className="text-sm font-black text-gray-900">{alt.customer?.name || 'Customer'}</h3>
                                    </div>
                                    <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border ${getStatusStyle(alt.quotationStatus)}`}>
                                        {alt.quotationStatus}
                                    </span>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-3 flex gap-3 cursor-pointer hover:bg-gray-100/80 transition-colors border border-gray-100/80" onClick={() => handleOpenDetails(alt)}>
                                    <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                                        {alt.images && alt.images[0] && (
                                            <img src={alt.images[0]} alt="Garment" className="w-full h-full object-cover" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                                        <p className="text-xs text-gray-700 line-clamp-2 font-medium">{alt.description}</p>
                                        <p className="text-[10px] font-bold text-[#843D9B] mt-1">View Full Details ({alt.images?.length || 0} Images) &rarr;</p>
                                    </div>
                                </div>

                                {alt.quotationStatus === 'pending' ? (
                                    <button 
                                        onClick={() => handleOpenQuote(alt)}
                                        className="mt-2 w-full bg-[#843D9B] text-white py-3 rounded-xl text-xs font-black tracking-wider uppercase hover:bg-[#6c3080] active:scale-95 transition-all shadow-sm cursor-pointer"
                                    >
                                        Submit Quote
                                    </button>
                                ) : (
                                    <div className="mt-2 flex justify-between items-center bg-gray-50 px-3.5 py-2.5 rounded-xl border border-gray-100">
                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Your Quote</span>
                                        <span className="text-sm font-black text-[#843D9B]">₹{alt.quoteAmount}</span>
                                    </div>
                                )}

                                {alt.paymentStatus === 'paid' && alt.quotationStatus === 'accepted' && (
                                    <div className="mt-1 flex items-center justify-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 py-1.5 rounded-lg border border-emerald-100">
                                        <CheckCircle size={12} /> Payment Received. Order Auto-Created.
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Details Modal - Modern Centered Modal */}
            {detailsModalOpen && selectedAlt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-xl relative max-h-[85vh] overflow-y-auto shadow-2xl border border-gray-100 custom-scrollbar">
                        <button 
                            onClick={() => setDetailsModalOpen(false)}
                            className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 transition-colors bg-gray-50 hover:bg-gray-100 rounded-full p-2 border border-gray-200 shadow-xs cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                        <h2 className="text-xl font-black text-gray-900 mb-1 pr-8">Alteration Details</h2>
                        <p className="text-xs text-gray-500 font-medium mb-6">Request ID: #{selectedAlt.alterationId}</p>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 block">Garment Images ({selectedAlt.images?.length})</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {selectedAlt.images?.map((img, idx) => (
                                        <div 
                                            key={idx} 
                                            className="aspect-square rounded-2xl border border-gray-200 overflow-hidden bg-gray-50 cursor-pointer hover:opacity-90 transition-all group relative shadow-xs"
                                            onClick={() => setFullscreenImage(img)}
                                        >
                                            <img src={img} alt={`Alteration ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-200/80">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Customer Requirements & Notes</label>
                                <p className="text-xs font-semibold text-gray-800 leading-relaxed whitespace-pre-wrap">{selectedAlt.description || 'No description provided.'}</p>
                            </div>

                            {selectedAlt.deliveryAddress && (
                                <div className="bg-purple-50/60 rounded-2xl p-4 border border-purple-100/80">
                                    <label className="text-[10px] font-black text-[#843D9B] uppercase tracking-widest mb-1.5 block">📍 Pickup & Delivery Address</label>
                                    <p className="text-xs font-bold text-gray-900">{selectedAlt.deliveryAddress.receiverName || selectedAlt.customer?.name}</p>
                                    <p className="text-xs font-medium text-gray-700 mt-0.5">
                                        {selectedAlt.deliveryAddress.street}, {selectedAlt.deliveryAddress.city}, {selectedAlt.deliveryAddress.state} - {selectedAlt.deliveryAddress.zipCode}
                                    </p>
                                    {selectedAlt.deliveryAddress.phoneNumber && (
                                        <p className="text-[11px] font-bold text-gray-500 mt-1">Phone: {selectedAlt.deliveryAddress.phoneNumber}</p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="mt-8 pt-4 border-t border-gray-100 flex gap-3">
                            <button 
                                onClick={() => setDetailsModalOpen(false)}
                                className="flex-1 bg-gray-100 text-gray-700 py-3.5 rounded-2xl text-xs font-black tracking-wider uppercase hover:bg-gray-200 transition-all cursor-pointer"
                            >
                                Close
                            </button>
                            {selectedAlt.quotationStatus === 'pending' && (
                                <button 
                                    onClick={() => {
                                        setDetailsModalOpen(false);
                                        handleOpenQuote(selectedAlt);
                                    }}
                                    className="flex-1 bg-[#843D9B] text-white py-3.5 rounded-2xl text-xs font-black tracking-wider uppercase hover:bg-[#6c3080] transition-all shadow-md cursor-pointer"
                                >
                                    Submit Quote
                                </button>
                            )}
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

            {/* Quote Modal - Modern Centered Modal */}
            {quoteModalOpen && selectedAlt && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md relative shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
                        <button 
                            onClick={() => setQuoteModalOpen(false)}
                            className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 transition-colors bg-gray-50 hover:bg-gray-100 rounded-full p-2 border border-gray-200 shadow-xs cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                        <h2 className="text-xl font-black text-gray-900 mb-1">Submit Quote</h2>
                        <p className="text-xs text-gray-500 font-medium mb-6 leading-relaxed">
                            Review the customer's request and provide your final quote. Once accepted and paid by the customer, a new order will be created.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Quote Amount (₹) *</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</span>
                                    <input 
                                        type="number" 
                                        placeholder="e.g. 350"
                                        value={quoteAmount}
                                        onChange={(e) => setQuoteAmount(e.target.value)}
                                        className="w-full bg-gray-50/70 border border-gray-200 rounded-2xl pl-9 pr-4 py-3.5 text-xs font-bold text-gray-900 outline-none focus:border-[#843D9B] focus:ring-2 focus:ring-[#843D9B]/10 focus:bg-white transition-all shadow-xs"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">Estimated Delivery Time *</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. 2-3 Days"
                                    value={estimatedTime}
                                    onChange={(e) => setEstimatedTime(e.target.value)}
                                    className="w-full bg-gray-50/70 border border-gray-200 rounded-2xl px-4 py-3.5 text-xs font-bold text-gray-900 outline-none focus:border-[#843D9B] focus:ring-2 focus:ring-[#843D9B]/10 focus:bg-white transition-all shadow-xs"
                                />
                            </div>

                            <button 
                                onClick={handleSubmitQuote}
                                className="w-full bg-[#843D9B] text-white py-4 rounded-2xl text-xs font-black tracking-wider uppercase hover:bg-[#6c3080] active:scale-95 transition-all shadow-md mt-2 cursor-pointer"
                            >
                                Send Quote to Customer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TailorAlterations;
