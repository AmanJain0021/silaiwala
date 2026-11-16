// Port of modules/common/pages/WalletPage.jsx (converted with scripts/web2rn.js, then reviewed)
import Screen from '../components/common/Screen';
import { Dialog, Sheet } from '../components/ui/Sheet';
import React, { useState, useEffect } from "react";
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Wallet, Download, LayoutGrid, History, Banknote, Loader2, Info } from "lucide-react-native";
import { useNavigate } from '../lib/nav';
import api from "../lib/api";
import toast from '../lib/toast';
import { Box, Txt, Btn, I, Input, Scroll } from '../components/ui/primitives';
import Spin from '../components/ui/Spin';
const WalletPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    balance: 0,
    totalWithdrawn: 0,
    currency: "INR"
  });
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const balanceRes = await api.get('/wallet/dashboard');
      setStats(balanceRes.data.data);
      setTransactions(balanceRes.data.data.recentTransactions || []);
      setIsLoading(false);
    } catch (error) {
      if (error?.name === 'CanceledError') return;
      console.error('Failed to fetch wallet data:', error);
      toast.error('Could not load wallet details');
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);
  const handleWithdraw = async e => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return toast.error('Enter a valid amount');
    if (numAmount > stats.balance) return toast.error('Insufficient balance');
    setIsSubmitting(true);
    try {
      const res = await api.post('/wallet/withdraw', {
        amount: numAmount
      });
      if (res.data.success) {
        toast.success('Withdrawal request submitted!');
        setShowWithdraw(false);
        setAmount('');
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Withdrawal failed');
    } finally {
      setIsSubmitting(false);
    }
  };
  const getStatusStyle = status => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };
  if (isLoading) {
    return <Screen className="bg-gray-50"><Box className="flex-1 bg-gray-50 flex flex-col items-center justify-center p-10">
                <Spin className="w-10 h-10 animate-spin text-primary mb-4" />
                <Txt className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Loading Wallet...</Txt>
            </Box></Screen>;
  }
  return <Screen className="bg-gray-50" statusBg="bg-primary" statusBar="light"><Box className="flex-1 bg-gray-50 md:p-6 font-sans">
            {/* Header */}
            <Box className="sticky top-0 z-50 bg-primary md:bg-transparent md:mb-8 px-4 py-4 flex items-center gap-4 text-white md:text-gray-900 border-b border-white/10 md:border-0 backdrop-blur-md">
                <Btn onPress={() => navigate(-1)} className="p-2 -ml-2 rounded-2xl md:bg-white md:shadow-sm hover:bg-white/10 md:hover:bg-gray-50 transition-all">
                    <I icon={ArrowLeft} size={20} />
                </Btn>
                <Box className="flex-1">
                    <Txt className="text-sm md:text-2xl font-black md:tracking-tight italic uppercase md:not-italic md:normal-case">Earning Wallet</Txt>
                </Box>
                <Btn className="md:hidden p-2 rounded-2xl hover:bg-white/10">
                    <I icon={Info} size={20} />
                </Btn>
            </Box>
            <Scroll className="flex-1" contentClassName="pb-20">

            <Box className="max-w-4xl mx-auto px-4 md:px-0 space-y-6">
                
                {/* Balance Card Section */}
                <Box className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Primary Card */}
                    <Box className="md:col-span-2 relative h-56 bg-gradient-to-br from-primary to-[#0a1e1a] rounded-[2.5rem] p-8 shadow-2xl overflow-hidden flex flex-col justify-between group">
                        <Box className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                            <I icon={Wallet} size={180} strokeWidth={1} />
                        </Box>
                        
                        <Box>
                            <Txt className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-green-100/60 mb-2 underline decoration-green-100/20">Available Balance</Txt>
                            <Txt className="text-5xl md:text-6xl font-black text-white tracking-tighter flex items-start">
                                <Txt className="text-2xl mt-2 mr-1">₹</Txt>
                                {stats.balance.toLocaleString()}
                            </Txt>
                        </Box>

                        <Box className="flex justify-between items-end">
                            <Btn onPress={() => setShowWithdraw(true)} className="bg-white text-primary px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all hover:bg-green-50">
                                Withdraw Funds
                            </Btn>
                            <Txt className="text-[9px] text-white/40 font-bold uppercase tracking-widest italic hidden md:block">Safe & Secure Transactions</Txt>
                        </Box>
                    </Box>

                    {/* Secondary Stat Card */}
                    <Box className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center">
                        <Box className="p-4 bg-green-50 text-primary rounded-3xl mb-4">
                            <I icon={Banknote} size={24} />
                        </Box>
                        <Txt className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Total Payouts</Txt>
                        <Txt className="text-3xl font-black text-gray-900 tracking-tighter">₹{stats.totalWithdrawn.toLocaleString()}</Txt>
                        <Txt className="text-[9px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded mt-3 uppercase tracking-wider italic">Lifetime Earnings</Txt>
                    </Box>
                </Box>

                {/* Transactions History Section */}
                <Box className="bg-white rounded-[2.5rem] p-6 md:p-10 border border-gray-100 shadow-sm">
                    <Box className="flex justify-between items-center mb-8">
                        <Txt className="text-sm md:text-lg font-black text-gray-900 tracking-widest md:tracking-tight uppercase md:normal-case italic md:not-italic flex items-center gap-2">
                            <I icon={History} size={18} className="text-primary" />
                            Journal Records
                        </Txt>
                        <Btn className="text-[10px] font-black text-primary flex items-center gap-1 uppercase tracking-widest hover:underline">
                            <I icon={Download} size={14} /> Export CSV
                        </Btn>
                    </Box>

                    <Box className="space-y-4">
                        {transactions.map((txn, idx) => <Box key={txn._id} className="flex items-center gap-4 p-4 rounded-3xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all group">
                                <Box className={`h-12 w-12 shrink-0 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${txn.type === 'credit' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                    {txn.type === 'credit' ? <I icon={ArrowDownRight} size={20} /> : <I icon={ArrowUpRight} size={20} />}
                                </Box>
                                <Box className="flex-1 min-w-0">
                                    <Box className="flex justify-between items-start">
                                        <Box>
                                            <Txt className="text-xs font-black text-gray-900 line-clamp-1">{txn.description || 'Transaction Record'}</Txt>
                                            <Txt className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">
                                                {new Date(txn.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                                            </Txt>
                                        </Box>
                                        <Box className="text-right">
                                            <Txt className={`text-sm font-black tracking-tight ${txn.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                                {txn.type === 'credit' ? '+' : '-'} ₹{txn.amount.toLocaleString()}
                                            </Txt>
                                            <Txt className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border tracking-tighter italic ${getStatusStyle(txn.status)}`}>
                                                {txn.status}
                                            </Txt>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>)}

                        {transactions.length === 0 && <Box className="py-20 text-center flex flex-col items-center justify-center opacity-30 grayscale saturate-0">
                                <I icon={LayoutGrid} size={48} strokeWidth={1} />
                                <Txt className="text-xs font-black uppercase tracking-widest mt-4 italic">No Transactional History Found</Txt>
                            </Box>}
                    </Box>
                </Box>

            </Box>

            {/* Withdrawal Modal */}
            <React.Fragment>
                {showWithdraw && <Sheet visible={!!(showWithdraw)} onClose={() => setShowWithdraw(false)} className={`bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 relative overflow-hidden`}>
<Box className="flex-shrink flex flex-col overflow-hidden">
                            <Box className="absolute top-0 right-0 p-8 opacity-5">
                                <I icon={Banknote} size={100} />
                            </Box>

                            <Txt className="text-xl font-black text-gray-900 tracking-tight italic">Request Payout</Txt>
                            <Txt className="text-xs text-gray-500 font-medium mt-2">Funds will be transferred to your registered bank account.</Txt>

                            <Box className="mt-8 space-y-6">
                                <Box>
                                    <Txt className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Enter Amount (INR)</Txt>
                                    <Box className="relative">
                                        <Txt className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400">₹</Txt>
                                        <Input value={amount} onChangeText={e => setAmount(e)} placeholder="Min. 500" className="w-full pl-10 pr-6 py-5 bg-gray-50 border-2 border-transparent focus:border-primary outline-none rounded-2xl text-2xl font-black tracking-tighter" keyboardType="numeric" />
                                    </Box>
                                    <Box className="flex justify-between items-center mt-3">
                                        <Txt className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Balance: ₹{stats.balance.toLocaleString()}</Txt>
                                        <Btn onPress={() => setAmount(stats.balance.toString())} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">
                                            Max
                                        </Btn>
                                    </Box>
                                </Box>

                                <Box className="flex gap-3 pt-2">
                                    <Btn onPress={() => setShowWithdraw(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">
                                        Cancel
                                    </Btn>
                                    <Btn onPress={handleWithdraw} disabled={isSubmitting || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > stats.balance} className="flex-[2] py-4 bg-primary text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-green-900/20 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2">
                                        {isSubmitting && <Spin size={16} className="animate-spin" />}
                                        {isSubmitting ? 'Sending...' : 'Confirm Withdrawal'}
                                    </Btn>
                                </Box>
                            </Box>
                        </Box>
</Sheet>}
            </React.Fragment>
                    </Scroll>
</Box></Screen>;
};
export default WalletPage;
