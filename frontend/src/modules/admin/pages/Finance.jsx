import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, Filter, ArrowUpRight, ArrowDownRight, CreditCard, 
    Banknote, FileText, Download, CheckCircle2, Loader2, IndianRupee 
} from 'lucide-react';
import api from '../../../utils/api';
import { toast } from 'react-hot-toast';

const AdminFinance = () => {
    const [selectedTab, setSelectedTab] = useState('Overview');
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [payouts, setPayouts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const tabs = ['Overview', 'Transactions', 'Payouts', 'GST & Taxes'];

    const fetchData = async () => {
        setIsLoading(true);
        try {
            if (selectedTab === 'Overview') {
                const res = await api.get('/admin/finance/stats');
                setStats(res.data.data);
            } else if (selectedTab === 'Transactions') {
                const res = await api.get(`/admin/finance/transactions?search=${searchTerm}`);
                setTransactions(res.data.data);
            } else if (selectedTab === 'Payouts') {
                const res = await api.get('/admin/finance/payouts');
                setPayouts(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch finance data:', error);
            toast.error('Failed to load financial data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedTab]);

    const handleSearch = (e) => {
        if (e.key === 'Enter') fetchData();
    };

    const handleProcessPayout = async (id) => {
        const ref = window.prompt("Enter Transaction Reference / Bank ID:");
        if (!ref) return;
        
        try {
            await api.patch(`/admin/finance/payouts/${id}`, { 
                status: 'completed',
                transactionReference: ref
            });
            toast.success("Payout marked as completed");
            fetchData();
        } catch (error) {
            toast.error("Failed to update payout");
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
                return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const maxRevenue = stats?.revenueTrend ? Math.max(...stats.revenueTrend.map(d => d.revenue), 1) : 1;

    return (
        <div className="h-full flex flex-col space-y-6 relative">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Finance</h1>
                    <p className="text-xs text-gray-500 font-medium mt-1">Manage platform revenue, vendor payouts, and transaction history</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 text-gray-700 border border-gray-200 text-xs font-black rounded-xl hover:bg-gray-100 transition-all uppercase tracking-widest hidden sm:flex">
                    <Download size={16} /> Export Report
                </button>
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
            <div className="flex-1 overflow-y-auto space-y-6 pb-6 custom-scrollbar">
                {isLoading ? (
                    <div className="flex-1 min-h-[400px] flex flex-col items-center justify-center text-gray-400">
                        <Loader2 className="w-10 h-10 animate-spin mb-4" />
                        <span className="text-xs font-black uppercase tracking-[0.2em]">Analyzing Finances...</span>
                    </div>
                ) : (
                    <>
                        {selectedTab === 'Overview' && stats && (
                            <>
                                {/* Stats Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {[
                                        { label: 'Total Revenue', value: stats.totalRevenue, icon: <Banknote size={20} />, change: '+12.5%', positive: true },
                                        { label: 'Platform Commission', value: stats.platformCommission, icon: <ArrowUpRight size={20} />, change: '+15.2%', positive: true },
                                        { label: 'Pending Payouts', value: stats.pendingPayouts, icon: <CreditCard size={20} />, change: '-2.4%', positive: false },
                                        { label: 'Refunds Processed', value: stats.refundsProcessed, icon: <ArrowDownRight size={20} />, change: '+1.1%', positive: false },
                                    ].map((stat, idx) => (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            key={idx}
                                            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="p-2 bg-primary/10 text-primary rounded-xl">
                                                    {stat.icon}
                                                </div>
                                                <div className={`flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-lg ${stat.positive ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                                                    {stat.change}
                                                </div>
                                            </div>
                                            <div className="mt-4">
                                                <p className="text-xl font-black text-gray-900">₹{stat.value.toLocaleString()}</p>
                                                <h3 className="text-gray-400 font-bold text-[9px] uppercase tracking-widest mt-1">{stat.label}</h3>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Chart */}
                                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                        <div className="flex justify-between items-center mb-10">
                                            <h3 className="text-sm font-black text-gray-900 tracking-tight uppercase tracking-widest">Revenue Trend</h3>
                                            <select className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-black text-gray-600 outline-none uppercase tracking-wider">
                                                <option>This Week</option>
                                            </select>
                                        </div>
                                        <div className="h-56 flex items-end justify-between gap-4 pb-4 border-b border-gray-50 relative">
                                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                                                {[...Array(4)].map((_, i) => (
                                                    <div key={i} className="w-full border-b border-gray-50 flex items-end pb-1"></div>
                                                ))}
                                            </div>
                                            {stats.revenueTrend.map((data, idx) => (
                                                <div key={idx} className="flex flex-col items-center flex-1 z-10 group">
                                                    <div className="relative w-full max-w-[40px] flex justify-center flex-1 items-end">
                                                        <motion.div
                                                            initial={{ height: 0 }}
                                                            animate={{ height: `${(data.revenue / maxRevenue) * 100}%` }}
                                                            className="w-[70%] bg-[#d4e9e2] rounded-t-lg group-hover:bg-primary transition-colors relative"
                                                        >
                                                            <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] font-black px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap z-20">
                                                                ₹{data.revenue}
                                                            </div>
                                                        </motion.div>
                                                    </div>
                                                    <span className="text-[9px] font-black text-gray-400 mt-4 uppercase tracking-tighter">{data.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Sidebar Info - Pending Action */}
                                    <div className="bg-primary p-6 rounded-2xl shadow-xl text-white relative overflow-hidden flex flex-col justify-between">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                            <IndianRupee size={150} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black tracking-widest uppercase">Action Required</h3>
                                            <p className="text-[10px] text-white/60 font-medium mt-2">There are pending payouts that need processing.</p>
                                            
                                            <div className="mt-8 space-y-4">
                                                <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <p className="text-xs font-black uppercase tracking-wider">Total Pending</p>
                                                            <p className="text-2xl font-black mt-1">₹{stats.pendingPayouts.toLocaleString()}</p>
                                                        </div>
                                                        <CreditCard className="text-white/40" size={24} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <button 
                                            onClick={() => setSelectedTab('Payouts')}
                                            className="mt-8 w-full py-3 bg-white text-primary font-black rounded-xl text-[10px] uppercase tracking-[0.2em] hover:bg-gray-100 transition-all shadow-lg"
                                        >
                                            Process All Now
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        {selectedTab === 'Transactions' && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                    <h3 className="text-xs font-black text-gray-900 tracking-widest uppercase">Transaction Ledger</h3>
                                    <div className="relative">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input 
                                            type="text" 
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            onKeyDown={handleSearch}
                                            placeholder="Search Txn ID..." 
                                            className="pl-9 pr-4 py-2 text-xs font-bold bg-white border border-gray-200 rounded-xl outline-none focus:border-primary transition-colors" 
                                        />
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left whitespace-nowrap">
                                        <thead>
                                            <tr className="bg-gray-50/50 text-gray-400 font-bold text-[9px] uppercase tracking-[0.2em] border-b border-gray-100">
                                                <th className="px-6 py-4">Transaction ID</th>
                                                <th className="px-6 py-4">Order Ref</th>
                                                <th className="px-6 py-4">Customer</th>
                                                <th className="px-6 py-4">Amount</th>
                                                <th className="px-6 py-4">Method</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4 text-right">Receipt</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {transactions.map((txn, i) => (
                                                <tr key={i} className="hover:bg-primary/5 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <span className="text-xs font-black text-primary">{txn.id}</span>
                                                        <p className="text-[9px] text-gray-400 mt-0.5 font-bold uppercase">{new Date(txn.date).toLocaleDateString()}</p>
                                                    </td>
                                                    <td className="px-6 py-4 font-bold text-xs text-gray-600">#{txn.orderId}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-xs font-bold text-gray-700">{txn.customer}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-1.5">
                                                            {txn.type === 'Credit' ? <ArrowUpRight size={14} className="text-green-500" /> : <ArrowDownRight size={14} className="text-red-500" />}
                                                            <span className={`text-xs font-black ${txn.type === 'Credit' ? 'text-green-600' : 'text-red-600'}`}>₹{txn.amount.toLocaleString()}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 font-bold text-[10px] text-gray-500 uppercase">{txn.method}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black border uppercase tracking-wider ${getStatusStyle(txn.status)}`}>
                                                            {txn.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button className="text-gray-400 hover:text-primary transition-colors p-1.5 hover:bg-gray-50 rounded-xl">
                                                            <Download size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {transactions.length === 0 && (
                                                <tr>
                                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">No transactions recorded</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {selectedTab === 'Payouts' && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left whitespace-nowrap">
                                        <thead>
                                            <tr className="bg-gray-50/50 text-gray-400 font-bold text-[9px] uppercase tracking-[0.2em] border-b border-gray-100">
                                                <th className="px-6 py-4">Payout ID</th>
                                                <th className="px-6 py-4">Recipient</th>
                                                <th className="px-6 py-4">Method & Details</th>
                                                <th className="px-6 py-4">Amount</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {payouts.map((payout, i) => (
                                                <tr key={i} className="hover:bg-primary/5 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <span className="text-xs font-black text-gray-900">{payout.payoutId}</span>
                                                        <p className="text-[9px] text-gray-400 mt-0.5 font-bold">{new Date(payout.createdAt).toLocaleDateString()}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-black text-gray-900">{payout.user?.name || 'Unknown User'}</span>
                                                                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${payout.user?.role === 'delivery' ? 'bg-indigo-50 text-primary border-indigo-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                                                    {payout.user?.role}
                                                                </span>
                                                            </div>
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">{payout.user?.email}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-black text-gray-600 uppercase tracking-tighter">{payout.method.replace('_', ' ')}</span>
                                                            <span className="text-[9px] font-bold text-gray-400 font-mono mt-0.5">{payout.bankDetails?.accountNumber || payout.bankDetails?.upiId || 'N/A'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-xs font-black text-primary">₹{payout.amount.toLocaleString()}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black border uppercase tracking-wider flex items-center w-max gap-1.5 ${getStatusStyle(payout.status)}`}>
                                                            {payout.status === 'completed' && <CheckCircle2 size={12} />}
                                                            {payout.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {payout.status === 'pending' ? (
                                                            <button 
                                                                onClick={() => handleProcessPayout(payout._id)}
                                                                className="text-[10px] font-black uppercase text-primary bg-primary/10 px-4 py-2 rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"
                                                            >
                                                                Process Payout
                                                            </button>
                                                        ) : (
                                                            <button className="text-gray-400 hover:text-primary transition-colors p-2 hover:bg-gray-50 rounded-xl">
                                                                <FileText size={16} />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {payouts.length === 0 && (
                                                <tr>
                                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">No payouts found</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {selectedTab === 'GST & Taxes' && (
                            <div className="p-16 text-center flex flex-col items-center justify-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                                <div className="p-4 bg-gray-50 text-gray-300 rounded-3xl mb-6">
                                    <FileText size={56} />
                                </div>
                                <h3 className="text-xl font-black text-gray-900 tracking-tight">Taxation & Compliance</h3>
                                <p className="text-xs text-gray-500 mt-3 max-w-sm leading-relaxed font-medium">Generate automated GST reports, TDS summaries and monthly tax records for platform earnings and payouts.</p>
                                <div className="mt-10 flex gap-3">
                                    <button className="px-8 py-3 bg-primary text-white text-[10px] font-black rounded-xl hover:bg-primary-dark uppercase tracking-[0.2em] shadow-lg shadow-green-900/20 transition-all">
                                        Download GST Report
                                    </button>
                                    <button className="px-8 py-3 bg-white border border-gray-200 text-gray-500 text-[10px] font-black rounded-xl hover:bg-gray-50 uppercase tracking-[0.2em] transition-all">
                                        View Settings
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminFinance;
