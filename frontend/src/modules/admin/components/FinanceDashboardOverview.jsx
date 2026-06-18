import React from 'react';
import { Download, Calendar, Search, Map, Banknote, ShoppingBag, Crown, User, Bike, Check, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

const FinanceDashboardOverview = ({ data }) => {
    if (!data) return null;
    
    const { summary, recentTransactions, recentPartialPayments, recentPaidOrder } = data;

    // Helper formatting
    const formatCurrency = (val) => val ? `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : '₹0';
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };
    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                    { label: 'Total Payments Collected', value: formatCurrency(summary.totalRevenue), trend: '', color: 'text-purple-600', bg: 'bg-purple-100', icon: <Banknote size={20} /> },
                    { label: 'Total Orders', value: summary.totalOrders, trend: '', color: 'text-green-600', bg: 'bg-green-100', icon: <ShoppingBag size={20} /> },
                    { label: 'Admin Earnings', value: formatCurrency(summary.netPlatformEarnings), trend: '', color: 'text-orange-500', bg: 'bg-orange-100', icon: <Crown size={20} /> },
                    { label: 'Tailor Payable (Wallet)', value: formatCurrency(summary.totalTailorEarnings), trend: '', color: 'text-blue-500', bg: 'bg-blue-100', icon: <User size={20} /> },
                    { label: 'Delivery Payable (Wallet)', value: formatCurrency(summary.totalDeliveryEarnings), trend: '', color: 'text-pink-500', bg: 'bg-pink-100', icon: <Bike size={20} /> },
                ].map((stat, idx) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={idx}
                        className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-start gap-4"
                    >
                        <div className={`p-3 rounded-xl shrink-0 ${stat.bg} ${stat.color}`}>
                            {stat.icon}
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-gray-500">{stat.label}</h3>
                            <p className="text-xl font-black text-gray-900 mt-1">{stat.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Middle Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Order Payment Breakdown */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h2 className="text-sm font-black text-gray-900">Recent Paid Order Breakdown</h2>
                            {recentPaidOrder ? (
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-bold text-gray-700">Order #{recentPaidOrder.orderId}</span>
                                    <span className="text-[10px] font-black uppercase bg-green-50 text-green-600 px-2 py-0.5 rounded-full">{recentPaidOrder.status}</span>
                                    <span className="text-[10px] font-black uppercase bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{recentPaidOrder.paymentStatus}</span>
                                </div>
                            ) : (
                                <span className="text-xs text-gray-500 mt-1 block">No recent paid orders</span>
                            )}
                        </div>
                    </div>

                    {recentPaidOrder && (
                        <div className="grid grid-cols-2 gap-6">
                            {/* Customer Payment Summary */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Customer Payment Summary</h3>
                                <div className="space-y-2 text-xs font-medium text-gray-600">
                                    <div className="flex justify-between"><span>Item Subtotal</span><span>{formatCurrency(recentPaidOrder.totalAmount - (recentPaidOrder.gstAmount || 0) - (recentPaidOrder.deliveryFee || 0))}</span></div>
                                    <div className="flex justify-between"><span>Delivery Fee</span><span>{formatCurrency(recentPaidOrder.deliveryFee)}</span></div>
                                    <div className="flex justify-between"><span>GST</span><span>{formatCurrency(recentPaidOrder.gstAmount)}</span></div>
                                    <div className="flex justify-between"><span>Discount</span><span className="text-red-500">-{formatCurrency(recentPaidOrder.discountAmount)}</span></div>
                                </div>
                                <div className="flex justify-between font-black text-green-600 pt-3 border-t border-gray-100">
                                    <span>Total Paid by Customer</span><span>{formatCurrency(recentPaidOrder.totalAmount)}</span>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Admin Receivable */}
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Admin Receivable (Breakdown)</h3>
                                    <div className="space-y-2 text-[11px] font-medium text-gray-600">
                                        <div className="flex justify-between"><span>Delivery Fee</span><span>{formatCurrency(recentPaidOrder.deliveryFee)}</span></div>
                                        <div className="flex justify-between"><span>Platform Fee</span><span>{formatCurrency(recentPaidOrder.platformFee)}</span></div>
                                        <div className="flex justify-between"><span>GST Collected</span><span>{formatCurrency(recentPaidOrder.gstAmount)}</span></div>
                                    </div>
                                    <div className="flex justify-between font-black text-green-600 text-xs pt-2 border-t border-gray-100">
                                        <span>Net to Platform</span><span>{formatCurrency(recentPaidOrder.netPlatformEarning)}</span>
                                    </div>
                                </div>

                                {/* Tailor & Delivery Dist */}
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-purple-500 uppercase tracking-widest">Tailor & Delivery Distribution</h3>
                                    <div className="space-y-2 text-xs font-medium text-gray-600">
                                        <div className="flex justify-between"><span>Tailor (To Wallet)</span><span className="text-purple-600 font-bold">{formatCurrency(recentPaidOrder.tailorEarning)}</span></div>
                                        <div className="flex justify-between"><span>Delivery (To Wallet)</span><span className="text-purple-600 font-bold">{formatCurrency(recentPaidOrder.deliveryPartnerEarning)}</span></div>
                                    </div>
                                </div>
                                
                                {/* Payment Info */}
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-blue-500 uppercase tracking-widest">Payment Info</h3>
                                    <div className="space-y-2 text-[11px] font-medium text-gray-600">
                                        <div className="flex justify-between"><span>Payment Method</span><span className="font-bold">{recentPaidOrder.razorpayOrderId ? 'Online' : 'Cash'}</span></div>
                                        <div className="flex justify-between"><span>Transaction ID</span><span className="font-bold text-gray-900">{recentPaidOrder.transactionId || recentPaidOrder.paymentId || 'N/A'}</span></div>
                                        <div className="flex justify-between"><span>Payment Time</span><span>{formatDateTime(recentPaidOrder.paidAt || recentPaidOrder.createdAt)}</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Wallet & Earnings Overview */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-sm font-black text-gray-900">Wallet & Earnings Overview</h2>
                    </div>

                    <div className="flex gap-4 flex-1">
                        {/* Tailors */}
                        <div className="flex-1 bg-purple-50/50 rounded-xl p-4 border border-purple-100 flex flex-col">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><User size={16} /></div>
                                <h3 className="text-sm font-black text-purple-700">Tailors</h3>
                            </div>
                            <div className="space-y-4 flex-1">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-medium text-gray-600">Total in Wallet</span>
                                    <span className="font-black text-gray-900">{formatCurrency(summary.totalTailorEarnings)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-medium text-gray-600">Pending Withdrawals</span>
                                    {/* Approximation as we don't split pending by role globally in summary */}
                                    <span className="font-black text-gray-900">{formatCurrency(summary.pendingWithdrawals)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-medium text-gray-600">Total Paid Out</span>
                                    <span className="font-black text-gray-900">{formatCurrency(summary.totalWithdrawalsPaid)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Delivery Partners */}
                        <div className="flex-1 bg-green-50/50 rounded-xl p-4 border border-green-100 flex flex-col">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-green-100 text-green-600 rounded-lg"><Bike size={16} /></div>
                                <h3 className="text-sm font-black text-green-700">Delivery Partners</h3>
                            </div>
                            <div className="space-y-4 flex-1">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-medium text-gray-600">Total in Wallet</span>
                                    <span className="font-black text-gray-900">{formatCurrency(summary.totalDeliveryEarnings)}</span>
                                </div>
                                {/* Pending withdrawals are shared in summary so omit or use N/A */}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Partial Payments Overview */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm lg:col-span-1">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-sm font-black text-gray-900">Recent Partial Payments</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead>
                                <tr className="text-[10px] text-gray-400 font-bold uppercase tracking-wider border-b border-gray-100">
                                    <th className="pb-2">Order ID</th>
                                    <th className="pb-2">Customer</th>
                                    <th className="pb-2">Total</th>
                                    <th className="pb-2">Paid</th>
                                    <th className="pb-2">Pending</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-xs">
                                {(recentPartialPayments || []).map((row, i) => (
                                    <tr key={i}>
                                        <td className="py-3 text-gray-900 font-bold">#{row.orderId}</td>
                                        <td className="py-3 text-gray-600">{row.customer?.name || 'Guest'}</td>
                                        <td className="py-3 text-gray-600">{formatCurrency(row.totalAmount)}</td>
                                        <td className="py-3 text-gray-600">{formatCurrency(row.advancePaymentAmount)}</td>
                                        <td className="py-3 text-red-500 font-medium">{formatCurrency((row.totalAmount || 0) - (row.advancePaymentAmount || 0))}</td>
                                    </tr>
                                ))}
                                {(!recentPartialPayments || recentPartialPayments.length === 0) && (
                                    <tr><td colSpan="5" className="py-4 text-center text-gray-400 text-[10px]">No recent partial payments</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-sm font-black text-gray-900">Recent Transactions</h2>
                    </div>
                    <div className="space-y-4">
                        {(recentTransactions || []).map((txn, i) => {
                            const isPositive = txn.type === 'credit';
                            return (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isPositive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {txn.category === 'order_earnings' ? <ShoppingBag size={16} /> : <Banknote size={16} />}
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-900 capitalize">{txn.category?.replace(/_/g, ' ')}</h4>
                                        <p className="text-[10px] font-medium text-gray-500">{txn.user?.name} ({txn.user?.role})</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-xs font-black ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                        {isPositive ? '+' : '-'}{formatCurrency(txn.amount)}
                                    </p>
                                    <p className="text-[10px] font-medium text-gray-400">{formatDate(txn.createdAt)}</p>
                                </div>
                            </div>
                        )})}
                        {(!recentTransactions || recentTransactions.length === 0) && (
                            <p className="text-center text-gray-400 text-[10px] py-4">No recent transactions</p>
                        )}
                    </div>
                </div>

                {/* Commissions & Deductions */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-sm font-black text-gray-900">Commissions & Deductions</h2>
                    </div>
                    
                    <div className="flex items-center gap-6 mt-6">
                        {/* Static Donut Chart Representation using CSS */}
                        <div className="relative w-32 h-32 rounded-full flex items-center justify-center shrink-0 border-[16px] border-purple-500" style={{ borderRightColor: '#10b981', borderBottomColor: '#f59e0b', borderLeftColor: '#ef4444'}}>
                           <div className="absolute inset-0 m-auto flex flex-col items-center justify-center bg-white rounded-full">
                               <span className="text-[10px] font-bold text-gray-400 text-center leading-tight">Total Net<br/>Earned</span>
                               <span className="text-xs font-black text-gray-900 mt-1">{formatCurrency(summary.netPlatformEarnings)}</span>
                           </div>
                        </div>

                        <div className="flex-1 space-y-3">
                            {[
                                { label: 'Platform Fee Collected', value: formatCurrency(summary.totalPlatformCommission), color: 'bg-purple-500' },
                                { label: 'Delivery Charges Collected', value: formatCurrency(summary.totalDeliveryCharges), color: 'bg-green-500' },
                                { label: 'GST Collected', value: formatCurrency(summary.totalGSTCollected), color: 'bg-red-500' },
                            ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center text-[10px]">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${item.color}`}></span>
                                        <span className="font-bold text-gray-600">{item.label}</span>
                                    </div>
                                    <div className="flex gap-4">
                                        <span className="font-black text-gray-900 text-right">{item.value}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinanceDashboardOverview;
