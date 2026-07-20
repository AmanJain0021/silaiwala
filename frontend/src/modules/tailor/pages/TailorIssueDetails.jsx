import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Send, Loader2, CheckCircle2, XCircle, Truck, User, Radio, X } from 'lucide-react';
import api from '../../../modules/tailor/services/api';
import { toast } from 'react-hot-toast';
import { useTailorAuth } from '../context/AuthContext';
import useSocketStore from '../../../store/socketStore';

const TailorIssueDetails = () => {
    const { issueId } = useParams();
    const navigate = useNavigate();
    const { user } = useTailorAuth();
    const socket = useSocketStore(state => state.socket);
    
    const [issue, setIssue] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showDispatchModal, setShowDispatchModal] = useState(false);
    const [dispatchCycle, setDispatchCycle] = useState('pickup');
    const [deliveryQuote, setDeliveryQuote] = useState(null);
    const [isLoadingQuote, setIsLoadingQuote] = useState(false);
    const [isDispatching, setIsDispatching] = useState(false);
    
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchIssueDetails();
        fetchMessages();
    }, [issueId]);

    useEffect(() => {
        if (!socket) return;
        socket.emit('join_issue_room', issueId);
        
        socket.on('receive_issue_message', (msg) => {
            setMessages(prev => [...prev, msg]);
            scrollToBottom();
        });

        return () => {
            socket.emit('leave_issue_room', issueId);
            socket.off('receive_issue_message');
        };
    }, [socket, issueId]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const fetchIssueDetails = async () => {
        try {
            const res = await api.get(`/issues/${issueId}`);
            setIssue(res.data.data);
        } catch (err) {
            if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
            toast.error("Failed to load issue details");
            navigate(-1);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMessages = async () => {
        try {
            const res = await api.get(`/issues/${issueId}/chat`);
            setMessages(res.data.data);
            scrollToBottom();
        } catch (err) {
            if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
            console.error(err);
        }
    };

    const openDispatchModal = async (cycle) => {
        setDispatchCycle(cycle);
        setShowDispatchModal(true);
        setDeliveryQuote(null);
        setIsLoadingQuote(true);
        try {
            const res = await api.get(`/issues/${issueId}/delivery-quote`, { params: { cycle } });
            setDeliveryQuote(res.data.data);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Could not calculate delivery charge');
            setShowDispatchModal(false);
        } finally {
            setIsLoadingQuote(false);
        }
    };

    const handleDispatch = async (deliveryMethod) => {
        if (!deliveryQuote?.canAfford) {
            return toast.error('Insufficient wallet balance for delivery charge');
        }
        setIsDispatching(true);
        try {
            const res = await api.post(`/issues/${issueId}/dispatch-delivery`, {
                deliveryMethod,
                cycle: dispatchCycle,
            });
            setIssue(res.data.data.issue);
            setShowDispatchModal(false);
            toast.success(
                deliveryMethod === 'broadcast'
                    ? 'Broadcast sent to delivery partners'
                    : 'Admin will assign a delivery partner'
            );
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to assign delivery');
        } finally {
            setIsDispatching(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setIsSending(true);
        try {
            await api.post(`/issues/${issueId}/chat`, {
                message: newMessage
            });
            setNewMessage('');
        } catch (err) {
            toast.error("Failed to send message");
        } finally {
            setIsSending(false);
        }
    };

    const handleAcceptIssue = async () => {
        try {
            const res = await api.patch(`/issues/${issueId}/status`, { status: 'accepted' });
            setIssue(res.data.data);
            toast.success("Issue accepted! Assign a delivery partner when ready.");
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to accept issue");
        }
    };

    const handleRejectIssue = async () => {
        if (!rejectionReason.trim()) return toast.error("Please provide a reason");
        try {
            const res = await api.patch(`/issues/${issueId}/status`, { 
                status: 'rejected', 
                rejectionReason 
            });
            setIssue(res.data.data);
            setShowRejectModal(false);
            toast.success("Issue rejected");
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to reject issue");
        }
    };

    const showPickupDispatch = issue?.status === 'accepted' && !issue?.reworkOrder;

    const showReturnDispatch =
        ['rework_in_progress', 'pickup_completed', 'ready_for_delivery'].includes(issue?.status);

    if (isLoading) return <div className="flex h-[100dvh] items-center justify-center"><Loader2 size={32} className="animate-spin text-primary" /></div>;

    return (
        <div className="flex flex-col h-[100dvh] pb-[76px] md:pb-0 bg-gray-50 relative">
            <div className="bg-white border-b border-gray-100 p-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
                <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full text-gray-900 active:scale-95 transition-transform">
                    <ChevronLeft size={20} />
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-sm font-black text-gray-900 uppercase tracking-tight truncate">
                        {issue.issueId ? `${issue.issueId} - ` : ''}{issue.customer?.name || 'Customer'}
                    </h1>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        Status: <span className="text-primary">{issue.status.replace(/_/g, ' ')}</span>
                    </p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-5">
                    {issue.status === 'pending' && (
                        <div className="flex gap-2 mb-5">
                            <button onClick={handleAcceptIssue} className="flex-1 bg-primary text-white py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-wide flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-lg shadow-primary/20">
                                <CheckCircle2 size={16} /> Accept Issue
                            </button>
                            <button onClick={() => setShowRejectModal(true)} className="flex-1 bg-red-50 text-red-600 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-wide flex items-center justify-center gap-1.5 active:scale-95 transition-transform border border-red-100 hover:bg-red-100">
                                <XCircle size={16} /> Reject
                            </button>
                        </div>
                    )}
                    {showPickupDispatch && (
                        <div className="mb-5">
                            <button
                                onClick={() => openDispatchModal('pickup')}
                                className="w-full bg-indigo-600 text-white py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-wide flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-200 active:scale-95 transition-transform hover:bg-indigo-700"
                            >
                                <Truck size={16} /> Assign Partner — Pickup from Customer
                            </button>
                            <p className="text-[10px] text-gray-500 font-medium mt-2 text-center">
                                Delivery charge (distance-based) will be deducted from your wallet
                            </p>
                        </div>
                    )}
                    {showReturnDispatch && (
                        <div className="mb-5">
                            <button
                                onClick={() => openDispatchModal('dropoff')}
                                className="w-full bg-emerald-600 text-white py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-wide flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-200 active:scale-95 transition-transform hover:bg-emerald-700"
                            >
                                <Truck size={16} /> Assign Partner — Return to Customer
                            </button>
                        </div>
                    )}

                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Customer's Report</h3>
                    <p className="text-sm font-medium text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">{issue.description}</p>
                    {issue.images?.length > 0 && (
                        <div className="flex gap-3 overflow-x-auto mt-4 pb-2 snap-x">
                            {issue.images.map((img, i) => (
                                <img key={i} src={img} alt="Issue" className="w-24 h-24 rounded-2xl object-cover border border-gray-200 shrink-0 shadow-sm snap-center" />
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3 py-2 opacity-50">
                    <div className="h-px bg-gray-200 flex-1"></div>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Conversation</span>
                    <div className="h-px bg-gray-200 flex-1"></div>
                </div>

                {messages.length === 0 ? (
                    <div className="py-10 flex flex-col items-center justify-center text-gray-400">
                        <p className="text-sm font-bold">No messages yet</p>
                        <p className="text-xs font-medium mt-1">Reply below to start the conversation.</p>
                    </div>
                ) : (
                    messages.map((msg, i) => {
                        const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
                        return (
                            <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-3xl p-4 shadow-sm ${isMe ? 'bg-primary text-white rounded-br-sm shadow-primary/10' : 'bg-white border border-gray-100 text-gray-900 rounded-bl-sm'}`}>
                                    {msg.imageUrl && (
                                        <img src={msg.imageUrl} alt="attachment" className="w-full h-auto rounded-xl mb-3" />
                                    )}
                                    {msg.message && <p className="text-[13px] font-medium leading-relaxed">{msg.message}</p>}
                                    <p className={`text-[9px] font-bold mt-2 tracking-wider uppercase ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} className="h-4" />
            </div>

            <div className="p-4 bg-white border-t border-gray-100">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Message customer..."
                        className="flex-1 h-12 bg-gray-50 border border-gray-100 rounded-full px-4 text-sm font-medium focus:ring-2 focus:ring-primary focus:bg-white outline-none"
                    />
                    <button
                        type="submit"
                        disabled={isSending || !newMessage.trim()}
                        className="w-12 h-12 bg-primary text-white flex items-center justify-center rounded-full shrink-0 disabled:opacity-50 active:scale-95 transition-transform shadow-lg shadow-primary/20"
                    >
                        {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                </form>
            </div>

            {showDispatchModal && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-black text-gray-900">Assign Delivery Partner</h3>
                            <button onClick={() => !isDispatching && setShowDispatchModal(false)} className="p-2 bg-gray-100 rounded-full">
                                <X size={18} />
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 font-medium mb-4">
                            {dispatchCycle === 'pickup'
                                ? 'Pickup garment from customer → your shop'
                                : 'Deliver reworked order → customer'}
                        </p>

                        {isLoadingQuote ? (
                            <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
                        ) : deliveryQuote && (
                            <>
                                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-4 text-sm">
                                    <p className="font-black text-amber-900 uppercase text-[10px] tracking-widest mb-2">Delivery charge (from your wallet)</p>
                                    <p className="text-2xl font-black text-gray-900">₹{deliveryQuote.deliveryFee}</p>
                                    <p className="text-[11px] text-gray-600 mt-1">
                                        ~{deliveryQuote.distanceKm} km × ₹{deliveryQuote.perKmRate}/km + ₹{deliveryQuote.baseFee} base
                                    </p>
                                    <p className="text-[11px] font-bold mt-2 text-gray-700">
                                        Wallet balance: ₹{deliveryQuote.walletBalance}
                                        {!deliveryQuote.canAfford && (
                                            <span className="text-red-600 block mt-1">Insufficient balance — add funds first</span>
                                        )}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <button
                                        type="button"
                                        disabled={isDispatching || !deliveryQuote.canAfford}
                                        onClick={() => handleDispatch('broadcast')}
                                        className="w-full p-4 border border-blue-100 bg-blue-50 rounded-2xl flex items-center gap-4 text-left disabled:opacity-50"
                                    >
                                        <Radio size={20} className="text-blue-600 shrink-0" />
                                        <div>
                                            <h4 className="text-sm font-black text-blue-900">Broadcast to Partners</h4>
                                            <p className="text-[10px] font-bold text-blue-600/70">Notify nearby delivery agents</p>
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isDispatching || !deliveryQuote.canAfford}
                                        onClick={() => handleDispatch('manual')}
                                        className="w-full p-4 border border-amber-100 bg-amber-50 rounded-2xl flex items-center gap-4 text-left disabled:opacity-50"
                                    >
                                        <User size={20} className="text-amber-600 shrink-0" />
                                        <div>
                                            <h4 className="text-sm font-black text-amber-900">Manual Assignment</h4>
                                            <p className="text-[10px] font-bold text-amber-600/70">Admin selects a partner</p>
                                        </div>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {showRejectModal && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
                        <h3 className="text-lg font-black uppercase text-gray-900 mb-4">Reject Issue</h3>
                        <p className="text-xs font-medium text-gray-500 mb-4">Please explain why you are rejecting this issue report.</p>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Reason for rejection..."
                            className="w-full h-32 bg-gray-50 rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary outline-none resize-none mb-4"
                        />
                        <div className="flex gap-2">
                            <button onClick={() => setShowRejectModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-black text-xs uppercase active:scale-95">Cancel</button>
                            <button onClick={handleRejectIssue} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-black text-xs uppercase shadow-lg shadow-red-200 active:scale-95">Confirm Reject</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TailorIssueDetails;
