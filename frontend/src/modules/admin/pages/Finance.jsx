import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, Filter, ArrowUpRight, ArrowDownRight, CreditCard, 
    Banknote, FileText, Download, CheckCircle2, Loader2, IndianRupee,
    Wallet, TrendingUp, X, Eye, Calendar
} from 'lucide-react';
import api from '../../../utils/api';
import { toast } from 'react-hot-toast';
import OrderFinancialDetailModal from './OrderFinancialDetailModal';
import FinanceDashboardOverview from '../components/FinanceDashboardOverview';

const AdminFinance = () => {
    const [selectedTab, setSelectedTab] = useState('Overview');
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState({
        dashboard: null,
        transactions: [],
        tailorEarnings: [],
        deliveryEarnings: [],
        gstReport: [],
        walletAudit: [],
        paymentLedger: [],
        tailorPayouts: [],
        deliveryPayouts: [],
        executivePayouts: []
    });
    
    // Pagination & Filtering
    const [pagination, setPagination] = useState({ page: 1, limit: 20, totalPages: 1 });
    const [filters, setFilters] = useState({ search: '', status: '', startDate: '', endDate: '' });
    
    // UI State
    const [processingPayoutId, setProcessingPayoutId] = useState(null);
    const [payoutRef, setPayoutRef] = useState('');
    const [payoutProof, setPayoutProof] = useState('');
    const [isUploadingProof, setIsUploadingProof] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState(null);

    const tabs = [
        'Overview', 
        'Transactions', 
        'Payment Ledger', 
        'Wallet Audit',
        'Tailor Earnings', 
        'Delivery Earnings', 
        'Delivery Payouts',
        'Executive Payouts',
        'GST Report'
    ];

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit,
                ...(filters.search && { search: filters.search }),
                ...(filters.status && { status: filters.status }),
                ...(filters.startDate && { startDate: filters.startDate }),
                ...(filters.endDate && { endDate: filters.endDate })
            }).toString();

            let res;
            switch (selectedTab) {
                case 'Overview':
                    res = await api.get('/admin/finance/dashboard');
                    setData(prev => ({ ...prev, dashboard: res.data.data }));
                    break;
                case 'Transactions':
                    res = await api.get(`/admin/finance/transactions?${queryParams}`);
                    setData(prev => ({ ...prev, transactions: res.data.data }));
                    setPagination(prev => ({ ...prev, totalPages: res.data.pages }));
                    break;
                case 'Payment Ledger':
                    res = await api.get(`/admin/finance/ledger?${queryParams}`);
                    setData(prev => ({ ...prev, paymentLedger: res.data.data }));
                    setPagination(prev => ({ ...prev, totalPages: res.data.pages }));
                    break;
                case 'Wallet Audit':
                    res = await api.get(`/admin/finance/wallet-audit?${queryParams}`);
                    setData(prev => ({ ...prev, walletAudit: res.data.data.transactions }));
                    setPagination(prev => ({ ...prev, totalPages: res.data.pages }));
                    break;
                case 'Tailor Earnings':
                    res = await api.get(`/admin/finance/tailor-earnings?${queryParams}`);
                    setData(prev => ({ ...prev, tailorEarnings: res.data.data.transactions }));
                    setPagination(prev => ({ ...prev, totalPages: res.data.pages }));
                    break;
                case 'Delivery Earnings':
                    res = await api.get(`/admin/finance/delivery-earnings?${queryParams}`);
                    setData(prev => ({ ...prev, deliveryEarnings: res.data.data.transactions }));
                    setPagination(prev => ({ ...prev, totalPages: res.data.pages }));
                    break;
                case 'Tailor Payouts':
                    res = await api.get(`/wallet/admin/withdrawals?role=tailor`);
                    setData(prev => ({ ...prev, tailorPayouts: res.data.data }));
                    break;
                case 'Delivery Payouts':
                    res = await api.get(`/wallet/admin/withdrawals?role=delivery`);
                    setData(prev => ({ ...prev, deliveryPayouts: res.data.data }));
                    break;
                case 'Executive Payouts':
                    res = await api.get(`/wallet/admin/withdrawals?role=measurement_executive`);
                    setData(prev => ({ ...prev, executivePayouts: res.data.data }));
                    break;
                case 'GST Report':
                    res = await api.get(`/admin/finance/gst?${queryParams}`);
                    setData(prev => ({ ...prev, gstReport: res.data.data.entries }));
                    setPagination(prev => ({ ...prev, totalPages: res.data.pages }));
                    break;
                default:
                    break;
            }
        } catch (error) {
            if (error.name !== 'CanceledError') {
                console.error('Failed to fetch finance data:', error);
                toast.error('Failed to load financial data');
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setPagination(prev => ({ ...prev, page: 1 }));
        setFilters({ search: '', status: '', startDate: '', endDate: '' });
    }, [selectedTab]);

    useEffect(() => {
        fetchData();
    }, [selectedTab, pagination.page]);

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            setPagination(prev => ({ ...prev, page: 1 }));
            fetchData();
        }
    };

    const handleProcessPayout = async (id) => {
        if (!payoutRef.trim()) {
            toast.error("Transaction Reference is required");
            return;
        }
        
        try {
            await api.patch(`/wallet/admin/withdrawals/${id}`, { 
                status: 'paid',
                transactionReference: payoutRef,
                proofOfPayment: payoutProof
            });
            toast.success("Payout marked as completed");
            setProcessingPayoutId(null);
            setPayoutRef('');
            setPayoutProof('');
            fetchData();
        } catch (error) {
            toast.error("Failed to update payout");
        }
    };

    const handleProofUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        setIsUploadingProof(true);
        try {
            const res = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setPayoutProof(res.data.data.url);
            toast.success('Screenshot uploaded');
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('Upload failed');
        } finally {
            setIsUploadingProof(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
            case 'paid': 
                return 'bg-green-100 text-green-700 border-green-200';
            case 'processing': 
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'pending': 
                return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'refunded':
            case 'failed':
            case 'debit':
                return 'bg-red-100 text-red-700 border-red-200';
            case 'credit':
                return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const renderPagination = () => {
        if (pagination.totalPages <= 1) return null;
        return (
            <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 bg-white mt-auto">
                <span className="text-xs text-gray-500 font-medium">
                    Page {pagination.page} of {pagination.totalPages}
                </span>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                        disabled={pagination.page === 1}
                        className="px-3 py-1.5 text-xs font-bold border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                    >
                        Previous
                    </button>
                    <button 
                        onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }))}
                        disabled={pagination.page === pagination.totalPages}
                        className="px-3 py-1.5 text-xs font-bold border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                    >
                        Next
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col space-y-6 relative">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Payment & Delivery Tracking</h1>
                    <p className="text-xs text-gray-500 font-medium mt-1">Complete payment flow, wallet tracking, and earnings overview</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600">
                        <Calendar size={14} className="text-gray-400" />
                        01 May 2024 - 31 May 2024
                    </div>
                    <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-50 transition-all">
                        <Filter size={14} /> Filters
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white text-xs font-black rounded-xl hover:bg-pink-600 transition-all uppercase tracking-widest hidden sm:flex">
                        Export Report <Download size={14} />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex bg-gray-50 p-1 rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setSelectedTab(tab)}
                            className={`px-4 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${selectedTab === tab ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto space-y-6 pb-6 custom-scrollbar flex flex-col">
                {isLoading && (!data.dashboard && selectedTab === 'Overview') ? (
                    <div className="flex-1 min-h-[400px] flex flex-col items-center justify-center text-gray-400">
                        <Loader2 className="w-10 h-10 animate-spin mb-4" />
                        <span className="text-xs font-black uppercase tracking-[0.2em]">Loading Ledger...</span>
                    </div>
                ) : (
                    <>
                        {/* OVERVIEW TAB */}
                        {selectedTab === 'Overview' && data.dashboard && (
                            <FinanceDashboardOverview data={data.dashboard} />
                        )}

                        {/* TRANSACTIONS TAB */}
                        {selectedTab === 'Transactions' && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col flex-1 min-h-[500px]">
                                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                    <div className="flex gap-2">
                                        <div className="relative">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input 
                                                type="text" 
                                                value={filters.search}
                                                onChange={(e) => setFilters({...filters, search: e.target.value})}
                                                onKeyDown={handleSearch}
                                                placeholder="Search Order/Txn ID..." 
                                                className="pl-9 pr-4 py-2 text-xs font-bold bg-white border border-gray-200 rounded-xl outline-none focus:border-primary transition-colors" 
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left whitespace-nowrap">
                                        <thead>
                                            <tr className="bg-gray-50/50 text-gray-400 font-bold text-[9px] uppercase tracking-[0.2em] border-b border-gray-100">
                                                <th className="px-6 py-4">Transaction / Date</th>
                                                <th className="px-6 py-4">Order / Customer</th>
                                                <th className="px-6 py-4">Type</th>
                                                <th className="px-6 py-4">Total Amt</th>
                                                <th className="px-6 py-4">Platform Net</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4 text-right">Details</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {data.transactions.map((txn, i) => (
                                                <tr key={i} className="hover:bg-primary/5 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <span className="text-xs font-black text-primary">{txn.transactionId}</span>
                                                        <p className="text-[9px] text-gray-400 mt-0.5 font-bold uppercase">{new Date(txn.date).toLocaleString()}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="font-black text-xs text-gray-800">#{txn.orderId}</span>
                                                        <p className="text-[10px] text-gray-500 font-bold mt-0.5">{txn.customer}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-md">{txn.paymentType}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`text-xs font-black ${txn.type === 'Credit' ? 'text-green-600' : 'text-red-600'}`}>₹{txn.totalAmount.toLocaleString()}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-xs font-black text-blue-600">₹{txn.netPlatformEarning.toLocaleString()}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black border uppercase tracking-wider ${getStatusStyle(txn.status)}`}>
                                                            {txn.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button 
                                                            onClick={() => setSelectedOrderId(txn._id)}
                                                            className="text-gray-400 hover:text-primary transition-colors p-1.5 hover:bg-gray-50 rounded-xl"
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {data.transactions.length === 0 && !isLoading && (
                                                <tr>
                                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">No transactions found</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {renderPagination()}
                            </div>
                        )}

                        {/* PAYMENT LEDGER TAB */}
                        {selectedTab === 'Payment Ledger' && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col flex-1 min-h-[500px]">
                                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                                    <h3 className="text-xs font-black text-gray-900 tracking-widest uppercase mb-1">Master Payment Ledger</h3>
                                    <p className="text-[10px] text-gray-500 font-medium">Immutable record of all payment events and corresponding splits.</p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left whitespace-nowrap">
                                        <thead>
                                            <tr className="bg-gray-50/50 text-gray-400 font-bold text-[9px] uppercase tracking-[0.2em] border-b border-gray-100">
                                                <th className="px-4 py-4">Ledger ID / Date</th>
                                                <th className="px-4 py-4">Order Ref</th>
                                                <th className="px-4 py-4">Type</th>
                                                <th className="px-4 py-4">Total Paid</th>
                                                <th className="px-4 py-4">Order Amt</th>
                                                <th className="px-4 py-4">GST</th>
                                                <th className="px-4 py-4">Platform Fee</th>
                                                <th className="px-4 py-4">Tailor Share</th>
                                                <th className="px-4 py-4">Delivery Share</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {data.paymentLedger.map((ledger, i) => (
                                                <tr key={i} className="hover:bg-primary/5 transition-colors text-[11px] font-medium">
                                                    <td className="px-4 py-3">
                                                        <span className="font-black text-primary block">{ledger.ledgerId}</span>
                                                        <span className="text-[9px] text-gray-400 font-bold uppercase">{new Date(ledger.paidAt || ledger.createdAt).toLocaleString()}</span>
                                                    </td>
                                                    <td className="px-4 py-3 font-bold text-gray-800">#{ledger.orderId}</td>
                                                    <td className="px-4 py-3"><span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">{ledger.paymentType}</span></td>
                                                    <td className="px-4 py-3 font-black text-green-600">₹{ledger.totalPaid}</td>
                                                    <td className="px-4 py-3 text-gray-600">₹{ledger.orderAmount}</td>
                                                    <td className="px-4 py-3 text-red-500">₹{ledger.gstAmount}</td>
                                                    <td className="px-4 py-3 text-blue-600 font-bold">₹{ledger.platformFee}</td>
                                                    <td className="px-4 py-3 text-gray-600">₹{ledger.tailorEarning}</td>
                                                    <td className="px-4 py-3 text-gray-600">₹{ledger.deliveryPartnerEarning}</td>
                                                </tr>
                                            ))}
                                            {data.paymentLedger.length === 0 && !isLoading && (
                                                <tr><td colSpan="9" className="px-6 py-12 text-center text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">No ledger entries found</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {renderPagination()}
                            </div>
                        )}

                        {/* WALLET AUDIT TAB */}
                        {selectedTab === 'Wallet Audit' && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col flex-1 min-h-[500px]">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left whitespace-nowrap">
                                        <thead>
                                            <tr className="bg-gray-50/50 text-gray-400 font-bold text-[9px] uppercase tracking-[0.2em] border-b border-gray-100">
                                                <th className="px-6 py-4">Date</th>
                                                <th className="px-6 py-4">User</th>
                                                <th className="px-6 py-4">Category</th>
                                                <th className="px-6 py-4">Description</th>
                                                <th className="px-6 py-4">Amount</th>
                                                <th className="px-6 py-4">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {data.walletAudit.map((txn, i) => (
                                                <tr key={i} className="hover:bg-primary/5 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <span className="text-[10px] text-gray-500 font-bold uppercase">{new Date(txn.date).toLocaleString()}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-xs font-black text-gray-800 block">{txn.user}</span>
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase">{txn.userRole}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-md">{txn.category}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-medium text-gray-600 truncate max-w-[200px]">{txn.description}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`text-xs font-black ${txn.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                                            {txn.type === 'credit' ? '+' : '-'}₹{txn.amount.toLocaleString()}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black border uppercase tracking-wider ${getStatusStyle(txn.status)}`}>
                                                            {txn.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {renderPagination()}
                            </div>
                        )}

                        {/* GST REPORT TAB */}
                        {selectedTab === 'GST Report' && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col flex-1 min-h-[500px]">
                                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                    <div>
                                        <h3 className="text-xs font-black text-gray-900 tracking-widest uppercase mb-1">GST Collection Report</h3>
                                        <p className="text-[10px] text-gray-500 font-medium">Per-order GST breakdown for tax filing</p>
                                    </div>
                                    <button className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white text-[10px] font-black rounded-lg hover:bg-primary-dark transition-all uppercase tracking-widest">
                                        <Download size={14} /> Export CSV
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left whitespace-nowrap">
                                        <thead>
                                            <tr className="bg-gray-50/50 text-gray-400 font-bold text-[9px] uppercase tracking-[0.2em] border-b border-gray-100">
                                                <th className="px-6 py-4">Date</th>
                                                <th className="px-6 py-4">Order Ref</th>
                                                <th className="px-6 py-4">Taxable Amount</th>
                                                <th className="px-6 py-4">GST Rate</th>
                                                <th className="px-6 py-4">GST Collected</th>
                                                <th className="px-6 py-4">Total Invoice</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {data.gstReport.map((gst, i) => (
                                                <tr key={i} className="hover:bg-primary/5 transition-colors">
                                                    <td className="px-6 py-4 text-[10px] text-gray-500 font-bold uppercase">{new Date(gst.date).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4 font-black text-xs text-gray-800">#{gst.orderId}</td>
                                                    <td className="px-6 py-4 text-xs font-bold text-gray-600">₹{gst.taxableAmount}</td>
                                                    <td className="px-6 py-4 text-xs font-bold text-gray-500">{gst.gstPercentage}%</td>
                                                    <td className="px-6 py-4 text-xs font-black text-primary">₹{gst.gstAmount}</td>
                                                    <td className="px-6 py-4 text-xs font-black text-gray-900">₹{gst.totalWithGST}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {renderPagination()}
                            </div>
                        )}

                        {/* EARNINGS TABS (Tailor / Delivery) */}
                        {(selectedTab === 'Tailor Earnings' || selectedTab === 'Delivery Earnings') && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col flex-1 min-h-[500px]">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left whitespace-nowrap">
                                        <thead>
                                            <tr className="bg-gray-50/50 text-gray-400 font-bold text-[9px] uppercase tracking-[0.2em] border-b border-gray-100">
                                                <th className="px-6 py-4">Date</th>
                                                <th className="px-6 py-4">Partner</th>
                                                <th className="px-6 py-4">Order Ref</th>
                                                <th className="px-6 py-4">Category</th>
                                                <th className="px-6 py-4">Earned Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {(selectedTab === 'Tailor Earnings' ? data.tailorEarnings : data.deliveryEarnings).map((txn, i) => (
                                                <tr key={i} className="hover:bg-primary/5 transition-colors">
                                                    <td className="px-6 py-4 text-[10px] text-gray-500 font-bold uppercase">{new Date(txn.creditDate).toLocaleString()}</td>
                                                    <td className="px-6 py-4 font-black text-xs text-gray-800">{txn.tailorName || txn.partnerName}</td>
                                                    <td className="px-6 py-4 font-bold text-xs text-gray-600">#{txn.orderId}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-md">{txn.category}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-black text-green-600">₹{txn.amount.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {renderPagination()}
                            </div>
                        )}

                        {/* PAYOUTS TABS (Tailor / Delivery / Executive) */}
                        {(selectedTab === 'Tailor Payouts' || selectedTab === 'Delivery Payouts' || selectedTab === 'Executive Payouts') && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col flex-1 min-h-[500px]">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left whitespace-nowrap">
                                        <thead>
                                            <tr className="bg-gray-50/50 text-gray-400 font-bold text-[9px] uppercase tracking-[0.2em] border-b border-gray-100">
                                                <th className="px-6 py-4">Payout ID / Date</th>
                                                <th className="px-6 py-4">Recipient</th>
                                                <th className="px-6 py-4">Method & Details</th>
                                                <th className="px-6 py-4">Amount</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {(selectedTab === 'Tailor Payouts' ? data.tailorPayouts : selectedTab === 'Delivery Payouts' ? data.deliveryPayouts : data.executivePayouts).map((payout, i) => (
                                                <tr key={i} className="hover:bg-primary/5 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <span className="text-xs font-black text-gray-900">{payout._id.slice(-8).toUpperCase()}</span>
                                                        <p className="text-[9px] text-gray-400 mt-0.5 font-bold">{new Date(payout.createdAt).toLocaleDateString()}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-black text-gray-900">{payout.user?.name || 'Unknown User'}</span>
                                                                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${payout.role === 'delivery' ? 'bg-indigo-50 text-primary border-indigo-100' : payout.role === 'measurement_executive' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                                                    {payout.role.replace('_', ' ')}
                                                                </span>
                                                            </div>
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">{payout.user?.email || payout.user?.phoneNumber}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-[10px] font-black text-primary uppercase tracking-tighter bg-primary/10 w-max px-2 py-0.5 rounded-md">
                                                                {payout.method === 'qr_code' ? 'QR Code' : payout.method === 'bank_transfer' ? 'Bank Transfer' : 'UPI'}
                                                            </span>
                                                            {payout.method === 'qr_code' ? (
                                                                <a href={payout.bankDetails?.qrCodeImage} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-blue-500 hover:underline flex items-center gap-1">
                                                                    <ArrowUpRight size={12} /> View QR Code
                                                                </a>
                                                            ) : payout.method === 'bank_transfer' ? (
                                                                <div className="flex flex-col text-[9px] font-bold text-gray-500 font-mono">
                                                                    <span>A/C: {payout.bankDetails?.accountNumber}</span>
                                                                    <span>IFSC: {payout.bankDetails?.ifscCode}</span>
                                                                    <span>Name: {payout.bankDetails?.accountName}</span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-[10px] font-bold text-gray-600 font-mono">{payout.bankDetails?.upiId || 'N/A'}</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-xs font-black text-primary">₹{payout.amount.toLocaleString()}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black border uppercase tracking-wider flex items-center w-max gap-1.5 ${getStatusStyle(payout.status)}`}>
                                                            {payout.status === 'paid' && <CheckCircle2 size={12} />}
                                                            {payout.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {payout.status === 'pending' || payout.status === 'approved' ? (
                                                            processingPayoutId === payout._id ? (
                                                                <div className="flex flex-col items-end gap-2">
                                                                    <div className="flex gap-2">
                                                                        <input
                                                                            type="text"
                                                                            placeholder="Txn Ref..."
                                                                            value={payoutRef}
                                                                            onChange={(e) => setPayoutRef(e.target.value)}
                                                                            className="px-3 py-1.5 text-[10px] font-bold border border-gray-200 rounded-lg outline-none focus:border-primary w-24"
                                                                        />
                                                                        <label className="cursor-pointer text-[10px] font-black uppercase text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-all flex items-center justify-center min-w-[60px]">
                                                                            {isUploadingProof ? '...' : payoutProof ? 'Attached' : 'Attach'}
                                                                            <input type="file" className="hidden" accept="image/*" onChange={handleProofUpload} disabled={isUploadingProof} />
                                                                        </label>
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            onClick={() => handleProcessPayout(payout._id)}
                                                                            disabled={isUploadingProof}
                                                                            className="text-[10px] font-black uppercase text-white bg-primary px-3 py-1.5 rounded-lg hover:bg-primary-dark transition-all disabled:opacity-50"
                                                                        >
                                                                            Confirm
                                                                        </button>
                                                                        <button
                                                                            onClick={() => { setProcessingPayoutId(null); setPayoutRef(''); setPayoutProof(''); }}
                                                                            className="text-[10px] font-black uppercase text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-all"
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <button 
                                                                    onClick={() => setProcessingPayoutId(payout._id)}
                                                                    className="text-[10px] font-black uppercase text-primary bg-primary/10 px-4 py-2 rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"
                                                                >
                                                                    Mark Paid
                                                                </button>
                                                            )
                                                        ) : (
                                                            <button className="text-gray-400 hover:text-primary transition-colors p-2 hover:bg-gray-50 rounded-xl">
                                                                <FileText size={16} />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {(selectedTab === 'Tailor Payouts' ? data.tailorPayouts : selectedTab === 'Delivery Payouts' ? data.deliveryPayouts : data.executivePayouts).length === 0 && !isLoading && (
                                                <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">No payouts found</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Order Financial Detail Modal */}
            <AnimatePresence>
                {selectedOrderId && (
                    <OrderFinancialDetailModal 
                        orderId={selectedOrderId} 
                        onClose={() => setSelectedOrderId(null)} 
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminFinance;
