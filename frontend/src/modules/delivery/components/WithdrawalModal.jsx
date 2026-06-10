import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCheckCircle, FiDollarSign, FiCreditCard, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../../shared/utils/api';

const WithdrawalModal = ({ isOpen, onClose, balance, onWithdrawalRequested }) => {
    const [amount, setAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);
        
        if (numAmount > balance) {
            toast.error(`Insufficient balance. Available: ₹${balance}`);
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await api.post('/deliveries/payouts/request', { amount: numAmount });
            setSuccess(true);
            if (onWithdrawalRequested) onWithdrawalRequested();
            toast.success('Withdrawal request submitted!');
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to submit withdrawal request.';
            setError(msg);
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4`}>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white rounded-3xl w-full max-w-sm overflow-hidden relative shadow-2xl"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-primary-600 to-emerald-600 p-6 text-white">
                        <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors">
                            <FiX className="text-2xl" />
                        </button>
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                <FiDollarSign className="text-2xl" />
                            </div>
                            <h2 className="text-xl font-bold">Request Payout</h2>
                            <p className="text-white/80 text-sm">Available: ₹{balance}</p>
                        </div>
                    </div>

                    <div className="p-6">
                        {!success ? (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Withdrawal Amount (₹)</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</div>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="Min. ₹1"
                                            className="w-full pl-10 pr-4 py-4 rounded-2xl border-2 border-gray-100 focus:border-primary-500 transition-all outline-none font-bold text-lg"
                                            required
                                            min="1"
                                            max={balance}
                                        />
                                    </div>
                                </div>

                                <div className="bg-blue-50 p-4 rounded-2xl flex gap-3 text-sm text-blue-700">
                                    <FiAlertCircle className="text-xl flex-shrink-0" />
                                    <p>Withdrawals are settled within 24-48 hours. You can request once every 7 days.</p>
                                </div>

                                {error && <p className="text-red-500 text-sm text-center font-semibold">{error}</p>}

                                <button
                                    type="submit"
                                    disabled={isSubmitting || !amount || amount <= 0}
                                    className="w-full py-4 gradient-green text-white rounded-2xl font-bold text-lg shadow-lg shadow-green-200/50 hover:shadow-xl hover:shadow-green-200 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? 'Processing...' : 'Request Payout'}
                                </button>
                            </form>
                        ) : (
                            <div className="text-center py-4 space-y-4">
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2 scale-110">
                                    <FiCheckCircle className="text-3xl" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">Request Received!</h3>
                                    <p className="text-gray-500 text-sm mt-1 px-4 text-center">Your request has been sent for admin approval. We'll update you soon.</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-full py-3 bg-gray-100 text-gray-800 rounded-2xl font-bold"
                                >
                                    Close
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default WithdrawalModal;
