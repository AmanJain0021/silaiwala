import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, ArrowUpRight, ArrowDownRight, FileText, Download, CheckCircle2 } from 'lucide-react';
import api from '../../../utils/api';
import { toast } from 'react-hot-toast';

const OrderFinancialDetailModal = ({ orderId, onClose }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await api.get(`/admin/finance/orders/${orderId}`);
                setData(res.data.data);
            } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
                toast.error("Failed to fetch order financial details");
                onClose();
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetails();
    }, [orderId, onClose]);

    if (isLoading || !data) {
        return (
            <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl w-full max-w-4xl h-[80vh] flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">Order Financial Summary</h2>
                        <div className="flex gap-4 mt-1">
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">#{data.orderId}</p>
                            <span className="text-xs text-gray-400 font-bold uppercase">•</span>
                            <p className="text-xs text-gray-500 font-bold uppercase">{new Date(data.createdAt).toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 text-[10px] font-black rounded-xl hover:bg-gray-50 transition-all uppercase tracking-widest">
                            <Download size={14} /> Invoice
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* LEFT COL: Breakdowns */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Value Split */}
                            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Value Breakdown</h3>
                                
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm font-bold text-gray-600">
                                        <span>Base Order Amount</span>
                                        <span>₹{data.breakdown.orderAmount}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-bold text-gray-600">
                                        <span>Delivery Fee</span>
                                        <span>₹{data.breakdown.deliveryFee}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-bold text-red-500">
                                        <span>GST ({data.breakdown.gstPercentage}%)</span>
                                        <span>₹{data.breakdown.gstAmount}</span>
                                    </div>
                                    {data.breakdown.discountAmount > 0 && (
                                        <div className="flex justify-between text-sm font-bold text-green-600">
                                            <span>Discount {data.breakdown.couponCode && `(${data.breakdown.couponCode})`}</span>
                                            <span>-₹{data.breakdown.discountAmount}</span>
                                        </div>
                                    )}
                                    <div className="pt-3 border-t border-gray-200 flex justify-between text-lg font-black text-gray-900">
                                        <span>Total Paid by Customer</span>
                                        <span>₹{data.breakdown.totalAmount}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Revenue Distribution */}
                            <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10">
                                <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4">Revenue Distribution</h3>
                                
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-gray-100">
                                        <div>
                                            <p className="text-xs font-black text-gray-900">Tailor Share</p>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase">{data.tailor?.name || 'N/A'}</p>
                                        </div>
                                        <span className="text-sm font-black text-green-600">₹{data.distribution.tailorShare}</span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-gray-100">
                                        <div>
                                            <p className="text-xs font-black text-gray-900">Delivery Share</p>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase">{data.deliveryPartner?.name || 'N/A'}</p>
                                        </div>
                                        <span className="text-sm font-black text-green-600">₹{data.distribution.deliveryPartnerShare}</span>
                                    </div>

                                    <div className="flex justify-between items-center p-3 bg-primary text-white rounded-xl shadow-lg">
                                        <div>
                                            <p className="text-xs font-black text-white">Net Platform Revenue</p>
                                            <p className="text-[10px] text-primary-100 font-bold uppercase">Platform Fee (₹{data.breakdown.platformFee}) + GST (₹{data.breakdown.gstAmount})</p>
                                        </div>
                                        <span className="text-lg font-black text-white">₹{data.distribution.platformRevenue}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Ledger Entries */}
                            <div>
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Payment Ledger Entries</h3>
                                {data.ledgerEntries?.length > 0 ? (
                                    <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white">
                                        <table className="w-full text-left whitespace-nowrap">
                                            <thead className="bg-gray-50">
                                                <tr className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                                    <th className="px-4 py-3">Type</th>
                                                    <th className="px-4 py-3">Txn ID</th>
                                                    <th className="px-4 py-3">Method</th>
                                                    <th className="px-4 py-3 text-right">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {data.ledgerEntries.map(entry => (
                                                    <tr key={entry._id}>
                                                        <td className="px-4 py-3">
                                                            <span className="text-[10px] font-bold bg-gray-100 px-2 py-1 rounded text-gray-600 uppercase">{entry.paymentType}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-xs font-bold text-gray-800">{entry.transactionId}</td>
                                                        <td className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase">{entry.paymentMethod}</td>
                                                        <td className="px-4 py-3 text-right text-xs font-black text-primary">₹{entry.totalPaid}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-gray-50 rounded-xl text-center text-xs font-bold text-gray-400 uppercase">No ledger entries</div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT COL: Status & Wallets */}
                        <div className="space-y-6">
                            
                            {/* Payment Status */}
                            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Payment Status</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                                        <span className="text-xs font-bold text-gray-500">Overall Status</span>
                                        <span className="text-[10px] font-black bg-green-100 text-green-700 px-2 py-1 rounded uppercase tracking-wider">{data.payment.overallStatus}</span>
                                    </div>
                                    <div className="flex flex-col gap-1 pb-3 border-b border-gray-50">
                                        <span className="text-xs font-bold text-gray-500">Advance Status</span>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="text-[10px] font-black text-gray-900 uppercase">₹{data.partialPayment.advanceAmount}</span>
                                            <span className="text-[10px] font-black text-gray-400 uppercase">{data.partialPayment.advanceStatus || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs font-bold text-gray-500">Remaining Status</span>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="text-[10px] font-black text-gray-900 uppercase">₹{data.partialPayment.remainingAmount}</span>
                                            <span className="text-[10px] font-black text-gray-400 uppercase">{data.partialPayment.remainingStatus || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Wallet Transactions */}
                            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Partner Wallet Activity</h3>
                                <div className="space-y-3">
                                    {data.walletTransactions?.length > 0 ? data.walletTransactions.map(wt => (
                                        <div key={wt._id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                                            <div className={`p-1.5 rounded-lg ${wt.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                {wt.type === 'credit' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-900">{wt.userRole}</span>
                                                    <span className={`text-xs font-black ${wt.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                                                        {wt.type === 'credit' ? '+' : '-'}₹{wt.amount}
                                                    </span>
                                                </div>
                                                <p className="text-[9px] font-medium text-gray-500 mt-1">{wt.description}</p>
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="text-[10px] font-bold text-gray-400 uppercase text-center py-4">No wallet activity</p>
                                    )}
                                </div>
                            </div>
                            
                            {/* Withdrawals */}
                            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Recent Withdrawals</h3>
                                
                                {data.withdrawals.tailor?.length > 0 && (
                                    <div className="mb-4">
                                        <h4 className="text-[9px] font-bold text-gray-400 uppercase mb-2">Tailor</h4>
                                        <div className="space-y-2">
                                            {data.withdrawals.tailor.map(w => (
                                                <div key={w._id} className="flex justify-between items-center border border-gray-100 rounded-lg p-2">
                                                    <span className="text-xs font-black">₹{w.amount}</span>
                                                    <span className="text-[9px] font-black text-gray-500 uppercase">{w.status}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {data.withdrawals.delivery?.length > 0 && (
                                    <div>
                                        <h4 className="text-[9px] font-bold text-gray-400 uppercase mb-2">Delivery</h4>
                                        <div className="space-y-2">
                                            {data.withdrawals.delivery.map(w => (
                                                <div key={w._id} className="flex justify-between items-center border border-gray-100 rounded-lg p-2">
                                                    <span className="text-xs font-black">₹{w.amount}</span>
                                                    <span className="text-[9px] font-black text-gray-500 uppercase">{w.status}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {!data.withdrawals.tailor?.length && !data.withdrawals.delivery?.length && (
                                    <p className="text-[10px] font-bold text-gray-400 uppercase text-center py-2">No withdrawal history</p>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default OrderFinancialDetailModal;
