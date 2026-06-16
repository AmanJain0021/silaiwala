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

    const fetchWalletData = async () => {
        setIsLoading(true);
        try {
            const balanceRes = await api.get('/wallet/dashboard');

            if (balanceRes.data.success) {
                setWalletData(balanceRes.data.data);
                setTransactions(balanceRes.data.data.recentTransactions || []);
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

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    const calculatedBalance = Math.max(0, (walletData.totalEarned || 0) - (walletData.totalWithdrawn || 0) - (walletData.pendingWithdrawals || 0));

    return (
        <div className="min-h-screen bg-slate-50 pb-24 animate-in fade-in duration-500">
            {/* Top Indigo Background Area */}
            <div className="bg-[#3C1A9B] pt-4 px-5 pb-32 rounded-b-[2rem] relative">
                {/* Header */}
                <div className="flex items-center justify-between text-white mb-8">
                    <div className="flex items-center gap-4">
                        <Menu size={28} className="opacity-90" onClick={() => navigate(-1)} />
                        <h1 className="text-[22px] font-black tracking-tight">Wallet</h1>
                    </div>
                    <HelpCircle size={24} className="opacity-90" />
                </div>

                {/* Main Balance Card */}
                <div className="absolute left-5 right-5 top-[5.5rem] bg-[#4026ab] rounded-[2rem] p-6 text-white shadow-[0_20px_40px_rgba(41,23,122,0.4)] overflow-hidden border border-white/10 z-10">
                    {/* Background Pattern */}
                    <div className="absolute right-0 top-0 opacity-10 scale-150 translate-x-10 -translate-y-4">
                        <Wallet size={200} strokeWidth={1} />
                    </div>

                    <div className="relative z-10 w-[60%]">
                        <p className="text-[11px] font-medium text-indigo-200 mb-1">Current Balance</p>
                        <h2 className="text-4xl font-black tracking-tight mb-2 flex items-center">
                            ₹{calculatedBalance.toLocaleString()}
                        </h2>
                        <p className="text-[10px] font-medium text-indigo-200 mb-5">Available for withdrawal</p>
                        
                        <button
                            onClick={() => setShowWithdrawModal(true)}
                            className="bg-white text-[#29177a] px-5 py-2.5 rounded-xl font-bold text-[11px] flex items-center gap-2 hover:bg-indigo-50 transition-colors shadow-sm"
                        >
                            Withdraw Money <ChevronRight size={14} strokeWidth={3} />
                        </button>
                    </div>

                    {/* 3D Wallet Graphic */}
                    <div className="absolute -right-4 bottom-0 w-44 h-44 drop-shadow-2xl">
                        <img src={wallet3DImage} alt="Wallet" className="w-full h-full object-contain" />
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="px-5 mt-28 space-y-5">
                
                {/* Stats Grid */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-5 flex items-center justify-between">
                    <div className="flex flex-col items-center justify-center flex-1 text-center border-r border-slate-100 px-2">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
                            <Wallet size={18} />
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 mb-1">Total Earnings</p>
                        <p className="text-sm font-black text-slate-900 mb-0.5">₹{(walletData.totalEarned || 0).toLocaleString()}</p>
                        <p className="text-[8px] text-slate-400 font-medium">This Month</p>
                    </div>

                    <div className="flex flex-col items-center justify-center flex-1 text-center border-r border-slate-100 px-2">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                            <ArrowDownCircle size={18} />
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 mb-1">Withdrawn</p>
                        <p className="text-sm font-black text-slate-900 mb-0.5">₹{(walletData.totalWithdrawn || 0).toLocaleString()}</p>
                        <p className="text-[8px] text-slate-400 font-medium">This Month</p>
                    </div>

                    <div className="flex flex-col items-center justify-center flex-1 text-center px-2">
                        <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mb-2">
                            <Clock size={18} />
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 mb-1">Pending Balance</p>
                        <p className="text-sm font-black text-slate-900 mb-0.5">₹{(walletData.pendingWithdrawals || 0).toLocaleString()}</p>
                        <p className="text-[8px] text-slate-400 font-medium">Will be cleared soon</p>
                    </div>
                </div>

                {/* Info Banner */}
                

                {/* Transaction History */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-5">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-sm font-black text-slate-900">Transaction History</h3>
                        <button className="text-[11px] font-bold text-indigo-700 flex items-center gap-1">
                            View All <ChevronRight size={14} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {transactions.length > 0 ? (
                            transactions.map((txn, idx) => (
                                <div key={txn._id || idx} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${txn.type === 'credit' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-50 text-orange-500 border-orange-100'}`}>
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
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5">
                                        <div className={`flex items-center gap-2 ${txn.type === 'credit' ? 'text-emerald-600' : 'text-slate-800'}`}>
                                            <span className="text-sm font-black">{txn.type === 'credit' ? '+' : '-'} ₹{txn.amount}</span>
                                            <ChevronRight size={14} className="text-slate-300" />
                                        </div>
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${txn.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                                            {txn.type === 'credit' ? 'Credit' : 'Debit'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-10 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-100 rounded-2xl">
                                <History size={32} className="text-slate-300 mb-2" />
                                <p className="text-xs font-bold text-slate-500">No transactions yet</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Performance Banner */}
               
            </div>

            {/* Withdrawal Modal (Kept unchanged) */}
            <AnimatePresence>
                {showWithdrawModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-end justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => !isSubmitting && setShowWithdrawModal(false)}
                    >
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-t-[2.5rem] w-full max-w-md p-8 relative shadow-2xl"
                        >
                            <button
                                onClick={() => setShowWithdrawModal(false)}
                                disabled={isSubmitting}
                                className="absolute top-6 right-6 p-2 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="mb-8 flex items-center gap-4">
                                <div className="w-14 h-14 bg-indigo-50 text-[#2D2F6E] rounded-2xl flex items-center justify-center">
                                    <Send size={28} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Withdraw Funds</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Select Transfer Method</p>
                                </div>
                            </div>

                            <form onSubmit={handleWithdrawRequest} className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Amount (₹)</label>
                                    <input
                                        type="number"
                                        value={withdrawAmount}
                                        onChange={(e) => setWithdrawAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-2xl font-black text-slate-900 focus:outline-none focus:border-[#2D2F6E] focus:bg-white transition-all"
                                        required
                                        max={calculatedBalance}
                                    />
                                    <div className="flex justify-between mt-2">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Available: ₹{calculatedBalance}</p>
                                        <button
                                            type="button"
                                            onClick={() => setWithdrawAmount(calculatedBalance)}
                                            className="text-[10px] font-black text-[#2D2F6E] uppercase tracking-widest"
                                        >
                                            Max
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3 mt-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Withdrawal Method</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button type="button" onClick={() => setWithdrawMethod('upi')} className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${withdrawMethod === 'upi' ? 'border-[#2D2F6E] bg-indigo-50 text-[#2D2F6E]' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}>
                                            <Smartphone size={20} />
                                            <span className="text-[9px] font-black uppercase tracking-widest">UPI ID</span>
                                        </button>
                                        <button type="button" onClick={() => setWithdrawMethod('bank_transfer')} className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${withdrawMethod === 'bank_transfer' ? 'border-[#2D2F6E] bg-indigo-50 text-[#2D2F6E]' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}>
                                            <Building2 size={20} />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Bank A/C</span>
                                        </button>
                                        <button type="button" onClick={() => setWithdrawMethod('qr_code')} className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${withdrawMethod === 'qr_code' ? 'border-[#2D2F6E] bg-indigo-50 text-[#2D2F6E]' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}>
                                            <QrCode size={20} />
                                            <span className="text-[9px] font-black uppercase tracking-widest">QR Image</span>
                                        </button>
                                    </div>
                                </div>

                                {withdrawMethod === 'upi' && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">UPI ID</label>
                                        <input
                                            type="text"
                                            value={upiId}
                                            onChange={(e) => setUpiId(e.target.value)}
                                            placeholder="yourname@upi"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#2D2F6E] focus:bg-white transition-all uppercase placeholder:normal-case"
                                        />
                                    </motion.div>
                                )}

                                {withdrawMethod === 'bank_transfer' && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Bank Name</label>
                                            <input type="text" value={bankDetails.bankName} onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})} placeholder="e.g. HDFC Bank" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#2D2F6E] transition-all" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Account Name</label>
                                            <input type="text" value={bankDetails.accountName} onChange={(e) => setBankDetails({...bankDetails, accountName: e.target.value})} placeholder="Name on Account" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#2D2F6E] transition-all" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">A/C Number</label>
                                                <input type="text" value={bankDetails.accountNumber} onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})} placeholder="000011112222" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#2D2F6E] transition-all" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">IFSC Code</label>
                                                <input type="text" value={bankDetails.ifscCode} onChange={(e) => setBankDetails({...bankDetails, ifscCode: e.target.value})} placeholder="HDFC0000123" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#2D2F6E] uppercase transition-all" />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {withdrawMethod === 'qr_code' && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Upload Payment QR Code</label>
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
                                                        <UploadCloud size={24} className="text-[#2D2F6E]" />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tap to browse image</span>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isSubmitting || !withdrawAmount || (withdrawMethod === 'upi' && !upiId) || (withdrawMethod === 'bank_transfer' && (!bankDetails.bankName || !bankDetails.accountName || !bankDetails.accountNumber || !bankDetails.ifscCode)) || (withdrawMethod === 'qr_code' && !qrFile)}
                                    className="w-full bg-[#2D2F6E] text-white py-5 rounded-[1.5rem] font-black tracking-[0.2em] uppercase text-xs hover:bg-primary-dark active:scale-95 transition-all shadow-xl shadow-indigo-900/10 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-3"
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

                                <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] leading-relaxed">
                                    Funds will be transferred to your upi id <br /> after admin review
                                </p>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DeliveryWallet;
