// Port of modules/tailor/pages/TailorIssueDetails.jsx (converted with scripts/web2rn.js, then reviewed)
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from '../lib/nav';
import { ChevronLeft, ChevronRight, Send, Loader2, CheckCircle2, XCircle, Truck, User, Radio, X, Scissors } from "lucide-react-native";
import api from "../lib/api";
import toast from '../lib/toast';
import { useTailorAuth } from "../context/tailor/AuthContext";
import useSocketStore from "../store/socketStore";
import { Box, Btn, I, Txt, Img, Input, Scroll } from '../components/ui/primitives';
import Spin from '../components/ui/Spin';
const TailorIssueDetails = () => {
  const {
    issueId
  } = useParams();
  const navigate = useNavigate();
  const {
    user
  } = useTailorAuth();
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
    socket.on('receive_issue_message', msg => {
      setMessages(prev => [...prev, msg]);
      scrollToBottom();
    });
    socket.on('issue_status_updated', payload => {
      if (payload?.issueId === issueId || payload?.issueId?.toString?.() === issueId) {
        fetchIssueDetails();
      }
    });
    return () => {
      socket.emit('leave_issue_room', issueId);
      socket.off('receive_issue_message');
      socket.off('issue_status_updated');
    };
  }, [socket, issueId]);
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollToEnd({ animated: true });
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
  const openDispatchModal = async cycle => {
    setDispatchCycle(cycle);
    setShowDispatchModal(true);
    setDeliveryQuote(null);
    setIsLoadingQuote(true);
    try {
      const res = await api.get(`/issues/${issueId}/delivery-quote`, {
        params: {
          cycle
        }
      });
      setDeliveryQuote(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not calculate delivery charge');
      setShowDispatchModal(false);
    } finally {
      setIsLoadingQuote(false);
    }
  };
  const handleDispatch = async deliveryMethod => {
    if (!deliveryQuote?.canAfford) {
      return toast.error('Insufficient wallet balance for delivery charge');
    }
    setIsDispatching(true);
    try {
      const res = await api.post(`/issues/${issueId}/dispatch-delivery`, {
        deliveryMethod,
        cycle: dispatchCycle
      });
      setIssue(res.data.data.issue);
      setShowDispatchModal(false);
      toast.success(deliveryMethod === 'broadcast' ? 'Broadcast sent to delivery partners' : 'Admin will assign a delivery partner');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign delivery');
    } finally {
      setIsDispatching(false);
    }
  };
  const handleSendMessage = async e => {
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
      const res = await api.patch(`/issues/${issueId}/status`, {
        status: 'accepted'
      });
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
  const showReturnDispatch = issue?.status === 'ready_for_delivery' && !issue?.reworkOrder?.reworkReturnDeliveryPaid;
  const handleMarkReworkComplete = async () => {
    try {
      const res = await api.patch(`/issues/${issueId}/status`, {
        status: 'ready_for_delivery'
      });
      setIssue(res.data.data);
      toast.success('Rework marked complete — assign return delivery when ready.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };
  if (isLoading) return <Box className="flex h-[100dvh] items-center justify-center"><Spin size={32} className="animate-spin text-primary" /></Box>;
  return <Box className="flex flex-col h-[100dvh] pb-[76px] md:pb-0 bg-gray-50 relative">
            <Box className="bg-white border-b border-gray-100 p-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
                <Btn onPress={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full text-gray-900 active:scale-95 transition-transform">
                    <I icon={ChevronLeft} size={20} />
                </Btn>
                <Box className="flex-1 min-w-0">
                    <Txt className="text-sm font-black text-gray-900 uppercase tracking-tight truncate">
                        {issue.issueId ? `${issue.issueId} - ` : ''}{issue.customer?.name || 'Customer'}
                    </Txt>
                    <Txt className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        Status: <Txt className="text-primary">{issue.status.replace(/_/g, ' ')}</Txt>
                    </Txt>
                </Box>
            </Box>

            <Scroll ref={messagesEndRef} onContentSizeChange={() => messagesEndRef.current?.scrollToEnd({ animated: false })} contentClassName="p-4 space-y-4" className="flex-1" nestedScrollEnabled>
                <Box className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-5">
                    {issue.status === 'pending' && <Box className="flex gap-2 mb-5">
                            <Btn onPress={handleAcceptIssue} className="flex-1 bg-primary text-white py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-wide flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-lg shadow-primary/20">
                                <I icon={CheckCircle2} size={16} /> Accept Issue
                            </Btn>
                            <Btn onPress={() => setShowRejectModal(true)} className="flex-1 bg-red-50 text-red-600 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-wide flex items-center justify-center gap-1.5 active:scale-95 transition-transform border border-red-100 hover:bg-red-100">
                                <I icon={XCircle} size={16} /> Reject
                            </Btn>
                        </Box>}
                    {showPickupDispatch && <Box className="mb-5">
                            <Btn onPress={() => openDispatchModal('pickup')} className="w-full bg-indigo-600 text-white py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-wide flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-200 active:scale-95 transition-transform hover:bg-indigo-700">
                                <I icon={Truck} size={16} /> Assign Partner — Pickup from Customer
                            </Btn>
                            <Txt className="text-[10px] text-gray-500 font-medium mt-2 text-center">
                                Delivery charge (distance-based) will be deducted from your wallet
                            </Txt>
                        </Box>}
                    {issue.status === 'rework_in_progress' && <Box className="mb-5">
                            <Btn onPress={handleMarkReworkComplete} className="w-full bg-[#843D9B] text-white py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-wide flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-transform">
                                <I icon={CheckCircle2} size={16} /> Mark Rework Complete
                            </Btn>
                            <Txt className="text-[10px] text-gray-500 font-medium mt-2 text-center">
                                Garment received — finish stitching, then mark complete to assign return delivery
                            </Txt>
                        </Box>}
                    {showReturnDispatch && <Box className="mb-5">
                            <Btn onPress={() => openDispatchModal('dropoff')} className="w-full bg-emerald-600 text-white py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-wide flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-200 active:scale-95 transition-transform hover:bg-emerald-700">
                                <I icon={Truck} size={16} /> Assign Partner — Return to Customer
                            </Btn>
                        </Box>}

                    {/* Rework OTPs */}
                    {issue.reworkOrder && <Box className="mb-6 space-y-3">
                            {issue.reworkOrder.dropoffDeliveryOtp && ['pending', 'accepted', 'pickup_completed'].includes(issue.status) && <>
                                    <Txt className="text-xs font-black uppercase tracking-widest text-gray-400">Delivery OTPs</Txt>
                                    <Box className="flex justify-between items-center bg-blue-50 p-4 rounded-2xl border border-blue-100">
                                        <Box>
                                            <Txt className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Dropoff to Tailor OTP</Txt>
                                            <Txt className="text-xs font-medium text-blue-900 mt-0.5">Give to rider when receiving garment</Txt>
                                        </Box>
                                        <Txt className="text-2xl font-black text-blue-700 tracking-widest bg-white px-4 py-1.5 rounded-xl border border-blue-100 shadow-sm">
                                            {issue.reworkOrder.dropoffDeliveryOtp}
                                        </Txt>
                                    </Box>
                                </>}
                            {issue.reworkOrder.pickupDeliveryOtp && ['ready_for_delivery'].includes(issue.status) && <>
                                    <Txt className="text-xs font-black uppercase tracking-widest text-gray-400">Delivery OTPs</Txt>
                                    <Box className="flex justify-between items-center bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                                        <Box>
                                            <Txt className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Pickup from Tailor OTP</Txt>
                                            <Txt className="text-xs font-medium text-emerald-900 mt-0.5">Give to rider when returning fixed garment</Txt>
                                        </Box>
                                        <Txt className="text-2xl font-black text-emerald-700 tracking-widest bg-white px-4 py-1.5 rounded-xl border border-emerald-100 shadow-sm">
                                            {issue.reworkOrder.pickupDeliveryOtp}
                                        </Txt>
                                    </Box>
                                </>}
                        </Box>}

                    {/* Original Order Items */}
                    {issue.originalOrder?.items && issue.originalOrder.items.length > 0 && <Box className="mb-6">
                            <Box className="flex items-center justify-between mb-3">
                                <Txt className="text-xs font-black uppercase tracking-widest text-gray-400">Original Order Items</Txt>
                                <Btn onPress={() => navigate('/partner/orders', {
              state: {
                highlightOrderId: issue.originalOrder._id,
                status: 'all'
              }
            })} className="text-[10px] font-black uppercase text-primary active:scale-95 transition-transform flex items-center gap-1 hover:underline">
                                    View Order Details <I icon={ChevronRight} size={14} />
                                </Btn>
                            </Box>
                            <Box className="space-y-3">
                                {issue.originalOrder.items.map((item, idx) => <Box key={idx} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-3">
                                        <Box className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                                            {item.selectedFabric?.image || item.selectedFabric?.images?.[0] || item.product?.image || item.product?.images?.[0] || item.service?.image || item.service?.images?.[0] || item.alterationRef?.images?.[0] || item.customDesignRef?.images?.[0] || item.customDesignRef?.referenceImages?.[0] ? <Img src={item.selectedFabric?.image || item.selectedFabric?.images?.[0] || item.product?.image || item.product?.images?.[0] || item.service?.image || item.service?.images?.[0] || item.alterationRef?.images?.[0] || item.customDesignRef?.images?.[0] || item.customDesignRef?.referenceImages?.[0]} className="w-full h-full object-cover" /> : <I icon={Scissors} size={20} className="text-gray-400" />}
                                        </Box>
                                        <Box className="flex-1">
                                            <Txt className="text-[13px] font-black text-gray-900 leading-snug">{item.service?.title || item.product?.name || item.alterationRef?.title || item.customDesignRef?.title || 'Custom Garment'}</Txt>
                                            <Box className="flex gap-2 mt-1.5">
                                                <Txt className="text-[9px] font-black uppercase bg-gray-50 text-gray-600 px-2 py-0.5 rounded-md border border-gray-100">
                                                    Size: {item.measurements?.type === 'slip' ? 'Slip' : 'Custom'}
                                                </Txt>
                                            </Box>
                                        </Box>
                                    </Box>)}
                            </Box>
                        </Box>}

                    <Txt className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Customer's Report</Txt>
                    <Txt className="text-sm font-medium text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">{issue.description}</Txt>
                    {issue.images?.length > 0 && <Scroll contentClassName="flex gap-3 pb-2 snap-x" className="mt-4" horizontal>
                            {issue.images.map((img, i) => <Img key={i} src={img} alt="Issue" className="w-24 h-24 rounded-2xl object-cover border border-gray-200 shrink-0 shadow-sm snap-center" />)}
                        </Scroll>}
                </Box>

                <Box className="flex items-center gap-3 py-2 opacity-50">
                    <Box className="h-px bg-gray-200 flex-1"></Box>
                    <Txt className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Conversation</Txt>
                    <Box className="h-px bg-gray-200 flex-1"></Box>
                </Box>

                {messages.length === 0 ? <Box className="py-10 flex flex-col items-center justify-center text-gray-400">
                        <Txt className="text-sm font-bold">No messages yet</Txt>
                        <Txt className="text-xs font-medium mt-1">Reply below to start the conversation.</Txt>
                    </Box> : messages.map((msg, i) => {
        const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
        return <Box key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <Box className={`max-w-[85%] rounded-3xl p-4 shadow-sm ${isMe ? 'bg-primary text-white rounded-br-sm shadow-primary/10' : 'bg-white border border-gray-100 text-gray-900 rounded-bl-sm'}`}>
                                    {msg.imageUrl && <Img src={msg.imageUrl} alt="attachment" className="w-full h-auto rounded-xl mb-3" />}
                                    {msg.message && <Txt className="text-[13px] font-medium leading-relaxed">{msg.message}</Txt>}
                                    <Txt className={`text-[9px] font-bold mt-2 tracking-wider uppercase ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                                        {new Date(msg.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
                                    </Txt>
                                </Box>
                            </Box>;
      })}
                <Box className="h-4" />
            </Scroll>

            <Box className="p-4 bg-white border-t border-gray-100">
                <Box className="flex items-center gap-2">
                    <Input value={newMessage} onChangeText={e => setNewMessage(e)} placeholder="Message customer..." className="flex-1 h-12 bg-gray-50 border border-gray-100 rounded-full px-4 text-sm font-medium focus:ring-2 focus:ring-primary focus:bg-white outline-none" />
                    <Btn onPress={handleSendMessage} disabled={isSending || !newMessage.trim()} className="w-12 h-12 bg-primary text-white flex items-center justify-center rounded-full shrink-0 disabled:opacity-50 active:scale-95 transition-transform shadow-lg shadow-primary/20">
                        {isSending ? <Spin size={18} className="animate-spin" /> : <I icon={Send} size={18} />}
                    </Btn>
                </Box>
            </Box>

            {showDispatchModal && <Box className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Box className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl">
                        <Box className="flex items-center justify-between mb-4">
                            <Txt className="text-lg font-black text-gray-900">Assign Delivery Partner</Txt>
                            <Btn onPress={() => !isDispatching && setShowDispatchModal(false)} className="p-2 bg-gray-100 rounded-full">
                                <I icon={X} size={18} />
                            </Btn>
                        </Box>
                        <Txt className="text-xs text-gray-500 font-medium mb-4">
                            {dispatchCycle === 'pickup' ? 'Pickup garment from customer → your shop' : 'Deliver reworked order → customer'}
                        </Txt>

                        {isLoadingQuote ? <Box className="py-8 flex justify-center"><Spin className="animate-spin text-primary" /></Box> : deliveryQuote && <>
                                <Box className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-4 text-sm">
                                    <Txt className="font-black text-amber-900 uppercase text-[10px] tracking-widest mb-2">Delivery charge (from your wallet)</Txt>
                                    <Txt className="text-2xl font-black text-gray-900">₹{deliveryQuote.deliveryFee}</Txt>
                                    <Txt className="text-[11px] text-gray-600 mt-1">
                                        ~{deliveryQuote.distanceKm} km × ₹{deliveryQuote.perKmRate}/km + ₹{deliveryQuote.baseFee} base
                                    </Txt>
                                    <Txt className="text-[11px] font-bold mt-2 text-gray-700">
                                        Wallet balance: ₹{deliveryQuote.walletBalance}
                                        {!deliveryQuote.canAfford && <Txt className="text-red-600 block mt-1">Insufficient balance — add funds first</Txt>}
                                    </Txt>
                                </Box>

                                <Box className="space-y-3">
                                    <Btn disabled={isDispatching || !deliveryQuote.canAfford} onPress={() => handleDispatch('broadcast')} className="w-full p-4 border border-blue-100 bg-blue-50 rounded-2xl flex items-center gap-4 text-left disabled:opacity-50">
                                        <I icon={Radio} size={20} className="text-blue-600 shrink-0" />
                                        <Box>
                                            <Txt className="text-sm font-black text-blue-900">Broadcast to Partners</Txt>
                                            <Txt className="text-[10px] font-bold text-blue-600/70">Notify nearby delivery agents</Txt>
                                        </Box>
                                    </Btn>
                                    <Btn disabled={isDispatching || !deliveryQuote.canAfford} onPress={() => handleDispatch('manual')} className="w-full p-4 border border-amber-100 bg-amber-50 rounded-2xl flex items-center gap-4 text-left disabled:opacity-50">
                                        <I icon={User} size={20} className="text-amber-600 shrink-0" />
                                        <Box>
                                            <Txt className="text-sm font-black text-amber-900">Manual Assignment</Txt>
                                            <Txt className="text-[10px] font-bold text-amber-600/70">Admin selects a partner</Txt>
                                        </Box>
                                    </Btn>
                                </Box>
                            </>}
                    </Box>
                </Box>}

            {showRejectModal && <Box className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Box className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
                        <Txt className="text-lg font-black uppercase text-gray-900 mb-4">Reject Issue</Txt>
                        <Txt className="text-xs font-medium text-gray-500 mb-4">Please explain why you are rejecting this issue report.</Txt>
                        <Input value={rejectionReason} onChangeText={e => setRejectionReason(e)} placeholder="Reason for rejection..." className="w-full h-32 bg-gray-50 rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary outline-none resize-none mb-4" multiline />
                        <Box className="flex gap-2">
                            <Btn onPress={() => setShowRejectModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-black text-xs uppercase active:scale-95">Cancel</Btn>
                            <Btn onPress={handleRejectIssue} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-black text-xs uppercase shadow-lg shadow-red-200 active:scale-95">Confirm Reject</Btn>
                        </Box>
                    </Box>
                </Box>}
        </Box>;
};
export default TailorIssueDetails;
