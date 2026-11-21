// Port of modules/tailor/pages/TailorEarnings.jsx (converted with scripts/web2rn.js, then reviewed)
import Razorpay from '../lib/razorpay';
import { RAZORPAY_KEY_ID } from '../lib/config';
import { Dialog, Sheet } from '../components/ui/Sheet';
import React, { useState, useEffect } from "react";
import { ShoppingBag, Star, Gift, ArrowUpRight, Menu, Bell, Loader2, ChevronRight, X, Send, CreditCard, AlertCircle, History, Building2 } from "lucide-react-native";
import toast from '../lib/toast';
import { useNavigate } from '../lib/nav';
import api from "../lib/api";
import { useTailorAuth } from "../context/tailor/AuthContext";
import { useNotifications } from "../context/tailor/NotificationContext";
import useBrandingStore from "../store/brandingStore";
import { Box, Txt, Btn, I, Input, Scroll } from '../components/ui/primitives';
import Spin from '../components/ui/Spin';

// ── Figma-matched Earnings Page ──────────────────────────────────────────────
const TailorEarnings = () => {
  const navigate = useNavigate();
  const {
    user
  } = useTailorAuth();
  const {
    unreadCount
  } = useNotifications();
  const {
    appName,
    logos
  } = useBrandingStore();
  const [activeTab, setActiveTab] = useState('Daily');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    balance: 0,
    totalWithdrawn: 0,
    codWalletBalance: 0,
    cashBlocked: false
  });
  const [transactions, setTxns] = useState([]);
  const [earningsData, setEarningsData] = useState(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAllTxns, setShowAllTxns] = useState(false);

  // COD Deposit States
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositRemarks, setDepositRemarks] = useState('');
  const [depositHistory, setDepositHistory] = useState([]);
  const handleWithdrawRequest = async e => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      return toast.error('Please enter a valid amount');
    }
    if (amount > stats.balance) {
      return toast.error('Insufficient balance');
    }
    if (!upiId) {
      return toast.error('Please enter UPI ID');
    }
    setIsSubmitting(true);
    try {
      const res = await api.post('/wallet/withdraw', {
        amount,
        method: 'upi',
        upiId,
        bankDetails: {
          upiId
        }
      });
      if (res.data.success) {
        toast.success('Withdrawal request submitted!');
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        setUpiId('');

        // Refresh stats
        const balRes = await api.get('/wallet/dashboard');
        setStats(balRes.data.data);
        setTxns(balRes.data.data.recentTransactions || []);
      }
    } catch (error) {
      console.error('Withdrawal failed:', error);
      toast.error(error.response?.data?.message || 'Withdrawal request failed');
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleDepositRequest = async e => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) return toast.error('Please enter a valid amount');
    if (amount > stats.codWalletBalance) return toast.error('Amount exceeds your COD balance');
    setIsSubmitting(true);
    try {
      // 1. Create Razorpay Order
      const rzpOrderRes = await api.post('/tailors/cod-deposit/razorpay/create', {
        amount,
        remarks: depositRemarks
      });
      if (!rzpOrderRes.data.success) throw new Error('Razorpay order creation failed');
      const options = {
        key: rzpOrderRes.data.data.key || RAZORPAY_KEY_ID,
        amount: rzpOrderRes.data.data.amount,
        currency: "INR",
        name: appName,
        description: "COD Cash Deposit",
        order_id: rzpOrderRes.data.data.id,
        handler: async function (response) {
          try {
            const verifyRes = await api.post('/tailors/cod-deposit/razorpay/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              depositId: rzpOrderRes.data.depositId
            });
            if (verifyRes.data.success) {
              toast.success('Cash deposit successful!');
              setShowDepositModal(false);
              setDepositAmount('');
              setDepositRemarks('');

              // Re-fetch data
              const [balRes, historyRes] = await Promise.all([api.get('/wallet/dashboard'), api.get('/tailors/cod-deposit/history')]);
              setStats(balRes.data.data);
              setTxns(balRes.data.data.recentTransactions || []);
              if (historyRes.data.success) {
                setDepositHistory(historyRes.data.data);
              }
            }
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment verification failed');
          }
        },
        prefill: {
          name: user?.name || "Tailor Partner",
          contact: user?.phoneNumber || "9999999999"
        },
        theme: {
          color: "#843D9B"
        }
      };
      const rzp = new Razorpay(options);
      rzp.on('payment.failed', function (response) {
        toast.error(response.error.description || 'Payment failed');
      });
      rzp.open();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to submit deposit request');
    } finally {
      setIsSubmitting(false);
    }
  };
  const tabs = ['Daily', 'Weekly', 'Monthly'];
  useEffect(() => {
    const fetchData = async () => {
      try {
        let periodMap = {
          'Daily': 'day',
          'Weekly': 'week',
          'Monthly': 'month'
        };
        const period = periodMap[activeTab] || 'week';
        const [balRes, earnRes, historyRes] = await Promise.all([api.get('/wallet/dashboard'), api.get(`/tailors/earnings?period=${period}`), api.get('/tailors/cod-deposit/history').catch(() => ({
          data: {
            success: true,
            data: []
          }
        }))]);
        setStats(balRes.data.data);
        setTxns(balRes.data.data.recentTransactions || []);
        setEarningsData(earnRes.data.data);
        if (historyRes.data.success) {
          setDepositHistory(historyRes.data.data);
        }
        setIsLoading(false);
      } catch (error) {
        if (error?.name === 'CanceledError') return;
        console.error('Earnings fetch error:', error);
        setIsLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);
  const periodTotal = earningsData?.summary?.periodTotal || 0;
  // Real split from wallet credits (backend summary.breakdown); no invented percentages
  const breakdown = earningsData?.summary?.breakdown || {};
  const orderEarnings = Number(breakdown.orderEarnings) || 0;
  const incentives = Number(breakdown.incentives) || 0;
  const bonus = Number(breakdown.bonus) || 0;
  const displayedEarnings = periodTotal || 0;
  const getBadgeStyle = label => {
    if (!label) return 'text-green-700 bg-green-50';
    const lower = label.toLowerCase();
    if (lower === 'incentive' || lower === 'bonus') return 'text-blue-600 bg-blue-50';
    if (lower === 'credit' || lower === 'completed' || lower === 'paid') return 'text-green-700 bg-green-50';
    if (lower === 'pending') return 'text-amber-600 bg-amber-50';
    if (lower === 'rejected') return 'text-rose-600 bg-rose-50';
    return 'text-gray-500 bg-gray-100';
  };
  const getBadgeLabel = txn => {
    if (txn.description?.toLowerCase().includes('bonus')) return 'INCENTIVE';
    if (txn.category === 'withdrawal' && txn.withdrawalRequest) return txn.withdrawalRequest.status.toUpperCase();
    if (txn.type === 'credit') return 'COMPLETED';
    return (txn.status || 'COMPLETED').toUpperCase();
  };
  const formatTime = dateStr => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    const time = d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return isToday ? `Today, ${time}` : `Yesterday, ${time}`;
  };
  if (isLoading) {
    return <Box className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
                <Spin size={32} className="animate-spin text-[#843D9B]" />
            </Box>;
  }
  return <Box className="min-h-full bg-[#F5F5F5] flex flex-col font-sans selection:bg-[#843D9B] selection:text-white pb-24 md:pb-8">

            <Box className="flex-1 p-2 md:p-0">
                
                {/* ── DESKTOP TITLE ── */}
                <Box className="hidden md:block py-6">
                    <Txt className="text-2xl font-black text-gray-900 tracking-tight">Earnings & Wallet</Txt>
                    <Txt className="text-xs text-gray-400 font-black uppercase tracking-[0.2em] mt-1">Track your financial performance and payouts</Txt>
                </Box>

                {/* ── MAIN CONTENT GRID ── */}
                <Box className="flex flex-col lg:flex-row gap-6">
                    
                    {/* LEFT COLUMN: BALANCE & BREAKDOWN */}
                    <Box className="flex-1 space-y-6">
                        
                        {/* ── TAB BAR ── */}
                        <Box className="bg-gray-200/50 rounded-2xl p-1 flex gap-1 w-fit">
                            {tabs.map(tab => <Btn key={tab} onPress={() => setActiveTab(tab)} className={`px-8 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'text-[#843D9B] bg-white shadow-md shadow-black/5' : 'text-gray-500 hover:bg-gray-100'}`}>
                                    {tab}
                                </Btn>)}
                        </Box>

                        {/* ── TOTAL EARNINGS CARD ── */}
                        <Box className="bg-[#1A1A1A] rounded-[2.5rem] p-8 relative overflow-hidden group shadow-2xl shadow-black/10">
                            <Box className="absolute right-[-20px] top-1/2 -translate-y-1/2 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                                <I icon={ArrowUpRight} size={240} color="white" />
                            </Box>
                            <Box className="relative z-10">
                                <Txt className="text-[11px] text-gray-400 font-black uppercase tracking-[0.2em] mb-3">
                                    Total Wallet Balance
                                </Txt>
                                <Box className="flex items-baseline gap-2 mb-6">
                                    <Txt className="text-2xl font-black text-white/40">₹</Txt>
                                    <Txt className="text-5xl font-black text-white tracking-tighter">
                                    {(stats.balance || 0).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                                </Txt>
                                </Box>
                                <Box className="flex items-center gap-6">
                                    <Box className="flex items-center gap-2 bg-green-500/10 px-3 py-1.5 rounded-xl border border-green-500/20">
                                        <I icon={ArrowUpRight} size={14} className="text-green-500" strokeWidth={3} />
                                        <Txt className="text-[11px] font-black text-green-500">+12.5%</Txt>
                                    </Box>
                                    <Btn onPress={() => setShowWithdrawModal(true)} className="bg-[#FDE5D2] text-[#843D9B] px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white transition-all shadow-xl shadow-black/20">
                                        Withdraw Funds
                                    </Btn>
                                </Box>
                            </Box>
                        </Box>

                        {/* ── BREAKDOWN GRID ── */}
                        <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Btn onPress={() => navigate('/partner/orders')} className="w-full text-left bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm flex items-center gap-5 group hover:border-[#843D9B]/20 hover:shadow-md transition-all active:scale-[0.98]">
                                <Box className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                    <I icon={ShoppingBag} size={24} className="text-[#843D9B]" />
                                </Box>
                                <Box className="flex-1">
                                    <Txt className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Order Earnings</Txt>
                                    <Txt className="text-xl font-black text-gray-900 tracking-tight">
                                        ₹{orderEarnings.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                                    </Txt>
                                </Box>
                                <I icon={ChevronRight} size={18} className="text-gray-300 group-hover:text-[#843D9B] group-hover:translate-x-1 transition-all" />
                            </Btn>

                            <Box className="grid grid-cols-2 gap-4">
                                <Box className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm group hover:border-[#843D9B]/20 transition-all">
                                    <Box className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform">
                                        <I icon={Star} size={18} className="text-indigo-600" fill="currentColor" />
                                    </Box>
                                    <Txt className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Incentives</Txt>
                                    <Txt className="text-lg font-black text-gray-900 tracking-tight">
                                        ₹{incentives.toLocaleString('en-IN', {
                    minimumFractionDigits: 2
                  })}
                                    </Txt>
                                </Box>
                                <Box className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm group hover:border-[#843D9B]/20 transition-all">
                                    <Box className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform">
                                        <I icon={Gift} size={18} className="text-emerald-600" />
                                    </Box>
                                    <Txt className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Bonus</Txt>
                                    <Txt className="text-lg font-black text-gray-900 tracking-tight">
                                        ₹{bonus.toLocaleString('en-IN', {
                    minimumFractionDigits: 2
                  })}
                                    </Txt>
                                </Box>
                            </Box>
                        </Box>


                    </Box>

                    {/* RIGHT COLUMN: RECENT PAYOUTS */}
                    <Box className="w-full lg:w-[400px] flex flex-col">
                        <Box className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col pb-2">
                            <Box className="p-8 border-b border-gray-50 flex items-center justify-between">
                                <Box>
                                    <Txt className="text-xl font-black text-gray-900 tracking-tight">Activity Log</Txt>
                                    <Txt className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Real-time transaction history</Txt>
                                </Box>
                                {transactions.length > 15 && <Btn onPress={() => setShowAllTxns(!showAllTxns)} className="text-[11px] font-black text-[#843D9B] hover:underline uppercase tracking-widest">
                                        {showAllTxns ? 'Show Less' : 'View All'}
                                    </Btn>}
                            </Box>

                            <Box className="p-4 space-y-3">
                                {transactions.length === 0 ? <Box className="flex flex-col items-center justify-center py-12 text-center h-full">
                                        <I icon={ShoppingBag} size={32} className="text-gray-200 mb-3" />
                                        <Txt className="text-sm font-bold text-gray-400">No recent activity.</Txt>
                                    </Box> : (showAllTxns ? transactions : transactions.slice(0, 15)).map((item, i) => {
                const isCredit = item.type === 'credit' || item.id && !item.id.startsWith('Peak') || item.badge === 'INCENTIVE';
                return <Box key={i} className="group p-4 bg-white hover:bg-gray-50 rounded-3xl border border-transparent hover:border-gray-100 transition-all flex items-center gap-4">
                                            <Box className="w-12 h-12 bg-[#1A1A1A] rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                                {item.img === 'bonus' || item.description && item.description.includes('bonus') ? <I icon={Gift} size={20} className="text-white" /> : <I icon={ShoppingBag} size={20} className="text-white" />}
                                            </Box>
                                            <Box className="flex-1 min-w-0">
                                                <Txt className="text-sm font-black text-gray-900 leading-tight truncate">
                                                    {item._id ? item.category === 'withdrawal' && item.withdrawalRequest?.status === 'paid' ? 'Withdrawal Completed' : item.description || `Order #${item.orderId || 'N/A'}` : item.id.startsWith('AL') ? `Order #${item.id}` : item.id}
                                                </Txt>
                                                <Box className="flex items-center gap-2 mt-1">
                                                    <Txt className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                                                        {item.createdAt ? formatTime(item.createdAt) : item.time}
                                                    </Txt>
                                                    {item.withdrawalRequest?.proofOfPayment && <Btn onPress={() => navigate(item.withdrawalRequest.proofOfPayment)} className="text-[9px] font-black text-[#843D9B] bg-[#843D9B]/10 px-1.5 py-0.5 rounded hover:bg-[#843D9B]/20 transition-colors flex items-center gap-1">
                                                            <I icon={ArrowUpRight} size={10} /> Receipt
                                                        </Btn>}
                                                </Box>
                                            </Box>
                                            <Box className="text-right shrink-0">
                                                <Txt className={`text-base font-black ${isCredit ? 'text-gray-900' : 'text-rose-500'}`}>
                                                    {isCredit ? '+' : '-'}₹{(item.amount || 0).toLocaleString('en-IN')}
                                                </Txt>
                                                <Txt className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-lg tracking-widest ${item.badgeColor || getBadgeStyle(getBadgeLabel(item))}`}>
                                                    {item.badge || getBadgeLabel(item)}
                                                </Txt>
                                            </Box>
                                        </Box>;
              })}
                            </Box>
                        </Box>
                    </Box>

                </Box>
            </Box>

            {/* Withdrawal Modal */}
            <React.Fragment>
                {showWithdrawModal && <Sheet visible={!!(showWithdrawModal)} onClose={() => setShowWithdrawModal(false)} className={`bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative`}>
<Box className="flex-shrink flex flex-col overflow-hidden">
                            <Btn onPress={() => setShowWithdrawModal(false)} disabled={isSubmitting} className="absolute top-6 right-6 p-2 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 transition-colors">
                                <I icon={X} size={20} />
                            </Btn>

                            <Box className="flex items-center gap-4 mb-8">
                                <Box className="w-14 h-14 bg-indigo-50 text-[#843D9B] rounded-2xl flex items-center justify-center shrink-0">
                                    <I icon={Send} size={24} />
                                </Box>
                                <Box>
                                    <Txt className="text-2xl font-black text-slate-900 tracking-tight">Withdraw Funds</Txt>
                                    <Txt className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Directly to UPI</Txt>
                                </Box>
                            </Box>

                            <Box className="space-y-6">
                                <Box>
                                    <Txt className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Amount (₹)</Txt>
                                    <Input value={withdrawAmount} onChangeText={e => setWithdrawAmount(e)} placeholder="0.00" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-2xl font-black text-slate-900 focus:outline-none focus:border-[#843D9B] focus:bg-white transition-all" disabled={isSubmitting} keyboardType="numeric" />
                                    <Box className="flex items-center justify-between mt-2 px-2">
                                        <Txt className="text-[10px] font-bold text-slate-500">Available: ₹{stats.balance?.toLocaleString()}</Txt>
                                        <Btn onPress={() => setWithdrawAmount(stats.balance)} className="text-[10px] font-black text-[#843D9B] uppercase tracking-widest">
                                            Max
                                        </Btn>
                                    </Box>
                                </Box>

                                <Box>
                                    <Txt className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">UPI ID</Txt>
                                    <Input value={upiId} onChangeText={e => setUpiId(e)} placeholder="username@bank" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#843D9B] focus:bg-white transition-all" disabled={isSubmitting} />
                                </Box>

                                <Btn onPress={handleWithdrawRequest} disabled={isSubmitting || !withdrawAmount || !upiId} className="w-full bg-[#843D9B] text-white py-5 rounded-[1.5rem] font-black tracking-[0.2em] uppercase text-xs hover:bg-primary-dark active:scale-95 transition-all shadow-xl shadow-indigo-900/10 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-3">
                                    {isSubmitting ? <>
                                            <Spin size={18} className="animate-spin" />
                                            Processing...
                                        </> : 'Request Withdrawal'}
                                </Btn>
                            </Box>
                        </Box>
</Sheet>}
            </React.Fragment>


        </Box>;
};
export default TailorEarnings;
