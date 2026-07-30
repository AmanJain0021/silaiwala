import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wallet,
    ArrowLeft,
    CreditCard,
    History,
    Loader2,
    X,
    AlertCircle,
    Info,
    ChevronRight,
    Send,
    Building2,
    QrCode,
    Smartphone,
    UploadCloud,
    Image as ImageIcon,
    HelpCircle,
    ArrowDownCircle,
    Clock,
    ArrowDown,
    Landmark,
    ShieldCheck,
    Menu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../../utils/api';
import { toast } from 'react-hot-toast';
import wallet3DImage from '../../../../assets/images/3d_wallet.png';

const DeliveryWallet = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [walletData, setWalletData] = useState({
        balance: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
        pendingWithdrawals: 0,
        recentTransactions: []
    });
    const [transactions, setTransactions] = useState([]);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawMethod, setWithdrawMethod] = useState('upi');
    const [upiId, setUpiId] = useState('');
    const [bankDetails, setBankDetails] = useState({
        accountName: '',
        accountNumber: '',
        ifscCode: '',
        bankName: ''
    });
    const [qrFile, setQrFile] = useState(null);
    const [qrPreview, setQrPreview] = useState(null);
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [depositAmount, setDepositAmount] = useState('');
    const [depositRemarks, setDepositRemarks] = useState('');
    const [depositHistory, setDepositHistory] = useState([]);

    const fetchWalletData = async () => {
        setIsLoading(true);
        try {
            const balanceRes = await api.get('/wallet/dashboard');

            if (balanceRes.data.success) {
                setWalletData(balanceRes.data.data);
                setTransactions(balanceRes.data.data.recentTransactions || []);
            }
            
            const historyRes = await api.get('/deliveries/cod-deposit/history');
            if (historyRes.data.success) {
                setDepositHistory(historyRes.data.data);
            }

            setIsLoading(false);
        } catch (error) {
            if (error?.name === 'CanceledError') return;
            console.error('Failed to fetch wallet data:', error);
            toast.error('Failed to load wallet details');
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchWalletData();
    }, []);

    useEffect(() => {
        if (showWithdrawModal || showDepositModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [showWithdrawModal, showDepositModal]);

    const handleWithdrawRequest = async (e) => {
        e.preventDefault();

        const amount = parseFloat(withdrawAmount);
        if (!amount || amount < 50) {
            return toast.error('Minimum withdrawal amount is ₹50');
        }
        if (amount > calculatedBalance) {
            return toast.error('Insufficient balance');
        }
        
        let uploadedQrUrl = '';

        if (withdrawMethod === 'upi') {
            if (!upiId || !upiId.includes('@')) {
                return toast.error('Please enter a valid UPI ID');
            }
        } else if (withdrawMethod === 'bank_transfer') {
            if (!bankDetails.accountName || !bankDetails.accountNumber || !bankDetails.ifscCode || !bankDetails.bankName) {
                return toast.error('Please fill all bank details');
            }
        } else if (withdrawMethod === 'qr_code') {
            if (!qrFile) {
                return toast.error('Please upload a QR Code image');
            }
            setIsSubmitting(true);
            try {
                const formData = new FormData();
                formData.append('image', qrFile);
                const uploadRes = await api.post('/upload/public', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                if (uploadRes.data.success) {
                    uploadedQrUrl = uploadRes.data.data;
                } else {
                    setIsSubmitting(false);
                    return toast.error('Failed to upload QR Code');
                }
            } catch (err) {
                setIsSubmitting(false);
                return toast.error('Error uploading QR Code');
            }
        }

        setIsSubmitting(true);
        try {
            const payload = {
                amount,
                method: withdrawMethod,
                bankDetails: withdrawMethod === 'upi' ? { upiId } 
                           : withdrawMethod === 'bank_transfer' ? { ...bankDetails }
                           : { qrCodeImage: uploadedQrUrl }
            };

            const res = await api.post('/wallet/withdraw', payload);

            if (res.data.success) {
                toast.success('Withdrawal request submitted!');
                setShowWithdrawModal(false);
                setWithdrawAmount('');
                setUpiId('');
                setBankDetails({ accountName: '', accountNumber: '', ifscCode: '', bankName: '' });
                setQrFile(null);
                setQrPreview(null);
                fetchWalletData();
            }
        } catch (error) {
            console.error('Withdrawal failed:', error);
            toast.error(error.response?.data?.message || 'Withdrawal request failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setQrFile(file);
            setQrPreview(URL.createObjectURL(file));
        }
    };

    const handleDepositRequest = async (e) => {
        e.preventDefault();
        const amount = parseFloat(depositAmount);
        
        if (!amount || amount <= 0) return toast.error('Please enter a valid amount');
        if (amount > walletData.codWalletBalance) return toast.error('Amount exceeds your COD balance');

        setIsSubmitting(true);
        try {
            // 1. Create Razorpay Order
            const rzpOrderRes = await api.post('/deliveries/cod-deposit/razorpay/create', {
                amount,
                remarks: depositRemarks
            });
            
            if (!rzpOrderRes.data.success) throw new Error('Razorpay order creation failed');

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_8sYbzHWidwe5Zw',
                amount: rzpOrderRes.data.data.amount,
                currency: "INR",
                name: "Silaiwala",
                description: "COD Cash Deposit",
                order_id: rzpOrderRes.data.data.id,
                handler: async function (response) {
                    try {
                        const verifyRes = await api.post('/deliveries/cod-deposit/razorpay/verify', {
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
                            fetchWalletData();
                        }
                    } catch (err) {
                        toast.error(err.response?.data?.message || 'Payment verification failed');
                    }
                },
                prefill: {
                    name: "Delivery Partner",
                    contact: "9999999999"
                },
                theme: {
                    color: "#843D9B"
                }
            };

            const rzp = new window.Razorpay(options);
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

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="w-8 h-8 text-[#843D9B] animate-spin" />
            </div>
        );
    }

    const calculatedBalance = walletData.balance || 0;

    return (
        <div className="min-h-screen bg-slate-50 pb-24 animate-in fade-in duration-500">
            {/* Top Purple Brand Background Area */}
            <div className="bg-[#843D9B] pt-4 px-5 pb-32 rounded-b-[2.5rem] relative shadow-lg shadow-purple-900/10">
                {/* Header */}
                <div className="flex items-center justify-between text-white mb-8">
                    <div className="flex items-center gap-4">
                        <Menu size={28} className="opacity-90 cursor-pointer hover:opacity-100 transition-opacity" onClick={() => navigate(-1)} />
                        <h1 className="text-[22px] font-black tracking-tight">Partner Wallet</h1>
                    </div>
                    <HelpCircle size={24} className="opacity-90 cursor-pointer hover:opacity-100 transition-opacity" />
                </div>

                {/* Main Balance Card - SewZelaa Signature Style */}
                <div className="absolute left-5 right-5 top-[5.5rem] bg-gradient-to-br from-[#843D9B] via-[#733388] to-[#57216c] rounded-[2.2rem] p-6 text-white shadow-[0_20px_40px_rgba(132,61,155,0.4)] overflow-hidden border border-white/20 z-10">
                    {/* Background Pattern */}
                    <div className="absolute right-0 top-0 opacity-10 scale-150 translate-x-10 -translate-y-4 pointer-events-none">
                        <Wallet size={200} strokeWidth={1} />
                    </div>

                    <div className="relative z-10 w-[65%]">
                        <p className="text-xs font-bold text-purple-200/90 mb-1 uppercase tracking-wider">Current Balance</p>
                        <h2 className="text-4xl font-black tracking-tight mb-1 flex items-center drop-shadow-sm">
                            ₹{calculatedBalance.toLocaleString()}
                        </h2>
                        <p className="text-[10px] font-semibold text-purple-200/80 mb-5">Available for instant withdrawal</p>
                        
                        <button
                            onClick={() => setShowWithdrawModal(true)}
                            className="bg-[#E2C17D] hover:bg-[#d5b066] text-[#3a1548] px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 uppercase tracking-wider"
                        >
                            Withdraw Money <ChevronRight size={14} strokeWidth={3} />
                        </button>
                    </div>

                    {/* 3D Wallet Graphic */}
                    <div className="absolute -right-4 bottom-0 w-44 h-44 drop-shadow-2xl pointer-events-none">
                        <img src={wallet3DImage} alt="Wallet" className="w-full h-full object-contain" />
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="px-5 mt-28 space-y-5">
                
                {/* Stats Grid */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-5 flex items-center justify-between">
                    <div className="flex flex-col items-center justify-center flex-1 text-center border-r border-slate-100 px-2">
                        <div className="w-11 h-11 rounded-2xl bg-purple-50 text-[#843D9B] flex items-center justify-center mb-2 shadow-sm">
                            <Wallet size={20} />
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 mb-0.5">Total Earnings</p>
                        <p className="text-sm font-black text-slate-900 mb-0.5">₹{(walletData.totalEarned || 0).toLocaleString()}</p>
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">This Month</p>
                    </div>

                    <div className="flex flex-col items-center justify-center flex-1 text-center border-r border-slate-100 px-2">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 shadow-sm">
                            <ArrowDownCircle size={20} />
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 mb-0.5">Withdrawn</p>
                        <p className="text-sm font-black text-slate-900 mb-0.5">₹{(walletData.totalWithdrawn || 0).toLocaleString()}</p>
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">This Month</p>
                    </div>

                    <div className="flex flex-col items-center justify-center flex-1 text-center px-2">
                        <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2 shadow-sm">
                            <Clock size={20} />
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 mb-0.5">Pending Balance</p>
                        <p className="text-sm font-black text-slate-900 mb-0.5">₹{(walletData.pendingWithdrawals || 0).toLocaleString()}</p>
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Under Clearance</p>
                    </div>
                </div>

                {/* COD Wallet Section */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#843D9B] flex items-center justify-center border border-purple-100">
                                <CreditCard size={18} />
                            </div>
                            <h3 className="text-sm font-black text-slate-900">COD Cash Wallet</h3>
                        </div>
                        {walletData.cashBlocked && (
                            <span className="text-[10px] bg-rose-100 text-rose-700 font-black px-2.5 py-1 rounded-md flex items-center gap-1 uppercase tracking-wider">
                                <AlertCircle size={12} /> BLOCKED
                            </span>
                        )}
                    </div>
                    
                    {walletData.cashBlocked && (
                        <div className="bg-rose-50 border border-rose-100 p-3.5 rounded-2xl mb-4 flex items-start gap-2 text-rose-700 text-xs font-semibold">
                            <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-600" />
                            <p>You have reached your cash collection limit. Please deposit cash dues to continue accepting delivery assignments.</p>
                        </div>
                    )}

                    <div className="flex items-end justify-between bg-purple-50/40 p-4 rounded-2xl border border-purple-100/70">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 mb-1 uppercase tracking-wider">Collected Cash Dues</p>
                            <h4 className="text-2xl font-black text-slate-900">₹{(walletData.codWalletBalance || 0).toLocaleString()}</h4>
                        </div>
                        <button
                            onClick={() => setShowDepositModal(true)}
                            className="bg-[#843D9B] text-white px-4 py-2.5 rounded-xl text-xs font-black hover:bg-[#6b3180] transition-colors shadow-md shadow-purple-900/10 uppercase tracking-wider"
                        >
                            Deposit Cash
                        </button>
                    </div>

                    {depositHistory.length > 0 && (
                        <div className="mt-5 border-t border-slate-100 pt-4">
                            <p className="text-xs font-black text-slate-400 mb-3 uppercase tracking-wider">Recent Cash Deposits</p>
                            <div className="space-y-3">
                                {depositHistory.slice(0, 3).map((dep, idx) => (
                                    <div key={idx} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${dep.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : dep.status === 'rejected' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                                                <History size={14} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-900">₹{dep.amount}</p>
                                                <p className="text-[10px] font-medium text-slate-400">{new Date(dep.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded uppercase tracking-wider ${dep.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : dep.status === 'rejected' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>
                                            {dep.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Transaction History */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-5">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-sm font-black text-slate-900">Transaction History</h3>
                        <button className="text-xs font-black text-[#843D9B] flex items-center gap-1 uppercase tracking-wider">
                            View All <ChevronRight size={14} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {transactions.length > 0 ? (
                            transactions.map((txn, idx) => (
                                <div key={txn._id || idx} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${txn.type === 'credit' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-purple-50 text-[#843D9B] border-purple-100'}`}>
                                            {txn.type === 'credit' ? <ArrowDown size={18} strokeWidth={2.5} /> : <Landmark size={18} strokeWidth={2.5} />}
                                        </div>
                                        <div>
                                            <p className="text-[12px] font-bold text-slate-900 mb-0.5">
                                                {txn.order?.orderId ? `Order #${txn.order.orderId}` : (txn.category === 'withdrawal' ? 'Weekly Payout' : txn.description)}
                                            </p>
                                            <p className="text-[10px] font-medium text-slate-500 capitalize">
                                                {txn.category.replace('_', ' ')}
                                            </p>
                                            <p className="text-[9px] text-slate-400 mt-0.5">
                                                {new Date(txn.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, {new Date(txn.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                            {txn.withdrawalRequest?.proofOfPayment && (
                                                <a href={txn.withdrawalRequest.proofOfPayment} target="_blank" rel="noreferrer" className="text-[9px] font-black text-[#843D9B] bg-purple-50 px-2 py-0.5 rounded hover:bg-purple-100 transition-colors flex items-center gap-1 w-max mt-1">
                                                    Receipt
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5">
                                        <div className={`flex items-center gap-2 ${txn.type === 'credit' ? 'text-emerald-600' : 'text-slate-800'}`}>
                                            <span className="text-sm font-black">{txn.type === 'credit' ? '+' : '-'} ₹{txn.amount}</span>
                                            <ChevronRight size={14} className="text-slate-300" />
                                        </div>
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${txn.type === 'credit' ? 'bg-emerald-50 text-emerald-700' : 'bg-purple-50 text-[#843D9B]'}`}>
                                            {txn.type === 'credit' ? 'Credit' : 'Debit'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-10 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-100 rounded-2xl">
                                <History size={32} className="text-slate-300 mb-2" />
                                <p className="text-xs font-bold text-slate-500">No transactions recorded yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Withdrawal Modal */}
            <AnimatePresence>
                {showWithdrawModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-md"
                        onClick={() => !isSubmitting && setShowWithdrawModal(false)}
                    >
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-md p-6 sm:p-8 relative shadow-2xl border border-slate-100"
                        >
                            <button
                                onClick={() => setShowWithdrawModal(false)}
                                disabled={isSubmitting}
                                className="absolute top-6 right-6 p-2 bg-slate-100 text-slate-400 rounded-full hover:bg-slate-200 hover:text-slate-700 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="mb-6 flex items-center gap-4">
                                <div className="w-14 h-14 bg-purple-50 text-[#843D9B] rounded-2xl flex items-center justify-center shrink-0 border border-purple-100">
                                    <Send size={28} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Withdraw Funds</h3>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-0.5">Select Transfer Method</p>
                                </div>
                            </div>

                            <form onSubmit={handleWithdrawRequest} className="space-y-5">
                                <div>
                                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 block">Amount (₹)</label>
                                    <input
                                        type="number"
                                        value={withdrawAmount}
                                        onChange={(e) => setWithdrawAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-5 py-3.5 text-2xl font-black text-slate-900 focus:outline-none focus:border-[#843D9B] focus:bg-white transition-all"
                                        required
                                        max={calculatedBalance}
                                    />
                                    <div className="flex justify-between mt-2">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Available: ₹{calculatedBalance}</p>
                                        <button
                                            type="button"
                                            onClick={() => setWithdrawAmount(calculatedBalance)}
                                            className="text-xs font-black text-[#843D9B] uppercase tracking-wider"
                                        >
                                            Max
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2 mt-4">
                                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">Withdrawal Method</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button type="button" onClick={() => setWithdrawMethod('upi')} className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all ${withdrawMethod === 'upi' ? 'border-[#843D9B] bg-purple-50 text-[#843D9B] font-black' : 'border-slate-200 text-slate-400 hover:bg-slate-50 font-bold'}`}>
                                            <Smartphone size={20} />
                                            <span className="text-[10px] uppercase tracking-wider">UPI ID</span>
                                        </button>
                                        <button type="button" onClick={() => setWithdrawMethod('bank_transfer')} className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all ${withdrawMethod === 'bank_transfer' ? 'border-[#843D9B] bg-purple-50 text-[#843D9B] font-black' : 'border-slate-200 text-slate-400 hover:bg-slate-50 font-bold'}`}>
                                            <Building2 size={20} />
                                            <span className="text-[10px] uppercase tracking-wider">Bank A/C</span>
                                        </button>
                                        <button type="button" onClick={() => setWithdrawMethod('qr_code')} className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all ${withdrawMethod === 'qr_code' ? 'border-[#843D9B] bg-purple-50 text-[#843D9B] font-black' : 'border-slate-200 text-slate-400 hover:bg-slate-50 font-bold'}`}>
                                            <QrCode size={20} />
                                            <span className="text-[10px] uppercase tracking-wider">QR Image</span>
                                        </button>
                                    </div>
                                </div>

                                {withdrawMethod === 'upi' && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                                        <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">UPI ID</label>
                                        <input
                                            type="text"
                                            value={upiId}
                                            onChange={(e) => setUpiId(e.target.value)}
                                            placeholder="yourname@upi"
                                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#843D9B] focus:bg-white transition-all uppercase placeholder:normal-case"
                                        />
                                    </motion.div>
                                )}

                                {withdrawMethod === 'bank_transfer' && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                                        <div>
                                            <label className="text-xs font-black text-slate-700 uppercase tracking-wider mb-1 block">Bank Name</label>
                                            <input type="text" value={bankDetails.bankName} onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})} placeholder="e.g. HDFC Bank" className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#843D9B] transition-all" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-black text-slate-700 uppercase tracking-wider mb-1 block">Account Name</label>
                                            <input type="text" value={bankDetails.accountName} onChange={(e) => setBankDetails({...bankDetails, accountName: e.target.value})} placeholder="Name on Account" className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#843D9B] transition-all" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-xs font-black text-slate-700 uppercase tracking-wider mb-1 block">A/C Number</label>
                                                <input type="text" value={bankDetails.accountNumber} onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})} placeholder="000011112222" className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#843D9B] transition-all" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-black text-slate-700 uppercase tracking-wider mb-1 block">IFSC Code</label>
                                                <input type="text" value={bankDetails.ifscCode} onChange={(e) => setBankDetails({...bankDetails, ifscCode: e.target.value})} placeholder="HDFC0000123" className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#843D9B] uppercase transition-all" />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {withdrawMethod === 'qr_code' && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                                        <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">Upload Payment QR Code</label>
                                        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors relative cursor-pointer overflow-hidden group">
                                            <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                            {qrPreview ? (
                                                <div className="relative w-full aspect-square max-w-[150px] mx-auto rounded-xl overflow-hidden shadow-sm border border-slate-200">
                                                    <img src={qrPreview} alt="QR Preview" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <ImageIcon className="text-white w-8 h-8" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center text-slate-400">
                                                    <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                        <UploadCloud size={24} className="text-[#843D9B]" />
                                                    </div>
                                                    <span className="text-xs font-black uppercase tracking-wider text-slate-500">Tap to upload QR image</span>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isSubmitting || !withdrawAmount || (withdrawMethod === 'upi' && !upiId) || (withdrawMethod === 'bank_transfer' && (!bankDetails.bankName || !bankDetails.accountName || !bankDetails.accountNumber || !bankDetails.ifscCode)) || (withdrawMethod === 'qr_code' && !qrFile)}
                                    className="w-full bg-[#843D9B] hover:bg-[#6b3180] text-white py-4 rounded-2xl font-black tracking-widest uppercase text-sm active:scale-95 transition-all shadow-xl shadow-purple-900/20 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-3 mt-4"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Submitting Request
                                        </>
                                    ) : (
                                        'Request Withdrawal'
                                    )}
                                </button>

                                <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-wider leading-relaxed">
                                    Funds will be transferred after admin review
                                </p>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Deposit Modal */}
            <AnimatePresence>
                {showDepositModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-md"
                        onClick={() => !isSubmitting && setShowDepositModal(false)}
                    >
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-md p-6 sm:p-8 relative shadow-2xl border border-slate-100"
                        >
                            <button
                                onClick={() => setShowDepositModal(false)}
                                disabled={isSubmitting}
                                className="absolute top-6 right-6 p-2 bg-slate-100 text-slate-400 rounded-full hover:bg-slate-200 hover:text-slate-700 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="mb-6 flex items-center gap-4">
                                <div className="w-14 h-14 bg-purple-50 text-[#843D9B] rounded-2xl flex items-center justify-center shrink-0 border border-purple-100">
                                    <Building2 size={28} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Deposit Cash</h3>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-0.5">Pay COD Dues Online</p>
                                </div>
                            </div>

                            <form onSubmit={handleDepositRequest} className="space-y-5">
                                <div>
                                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 block">Amount (₹)</label>
                                    <input
                                        type="number"
                                        value={depositAmount}
                                        onChange={(e) => setDepositAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-5 py-3.5 text-2xl font-black text-slate-900 focus:outline-none focus:border-[#843D9B] focus:bg-white transition-all"
                                        required
                                        max={walletData.codWalletBalance}
                                    />
                                    <div className="flex justify-between mt-2">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Pending Cash: ₹{walletData.codWalletBalance}</p>
                                        <button
                                            type="button"
                                            onClick={() => setDepositAmount(walletData.codWalletBalance)}
                                            className="text-xs font-black text-[#843D9B] uppercase tracking-wider"
                                        >
                                            Max
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 block">Remarks (Optional)</label>
                                    <input
                                        type="text"
                                        value={depositRemarks}
                                        onChange={(e) => setDepositRemarks(e.target.value)}
                                        placeholder="e.g. COD settlement deposit"
                                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#843D9B] transition-all"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting || !depositAmount}
                                    className="w-full bg-[#843D9B] hover:bg-[#6b3180] text-white py-4 rounded-2xl font-black tracking-widest uppercase text-sm active:scale-95 transition-all shadow-xl shadow-purple-900/20 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-3 mt-4"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Processing Payment
                                        </>
                                    ) : (
                                        'Pay Online'
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
export default DeliveryWallet;
