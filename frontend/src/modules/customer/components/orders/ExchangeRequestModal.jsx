import React, { useState } from 'react';
import { X, RefreshCcw, Camera } from 'lucide-react';
import api from '../../../../utils/api';

const ExchangeRequestModal = ({ isOpen, onClose, orderId, onSuccess }) => {
    const [reason, setReason] = useState('');
    const [requestedSize, setRequestedSize] = useState('');
    const [customerNotes, setCustomerNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await api.post(`/orders/${orderId}/exchange`, {
                reason,
                requestedSize,
                customerNotes
            });
            if (res.data.success) {
                alert('Exchange requested successfully!');
                onSuccess();
                onClose();
            }
        } catch (error) {
            console.error('Exchange error:', error);
            alert(error.response?.data?.message || 'Failed to request exchange');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-6 bg-gradient-to-br from-purple-500 to-purple-700 text-white relative">
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3">
                        <RefreshCcw size={24} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-black tracking-tighter">Request Exchange</h2>
                    <p className="text-purple-100 text-sm font-medium opacity-90 mt-1">
                        Select a reason to exchange this ready-made item.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                            Reason for Exchange *
                        </label>
                        <select 
                            required
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-purple-500 outline-none"
                        >
                            <option value="">Select a reason</option>
                            <option value="Size too small">Size too small</option>
                            <option value="Size too large">Size too large</option>
                            <option value="Received wrong item">Received wrong item</option>
                            <option value="Item damaged">Item damaged</option>
                            <option value="Color mismatch">Color mismatch</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                            Requested Size (Optional)
                        </label>
                        <select 
                            value={requestedSize}
                            onChange={(e) => setRequestedSize(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-purple-500 outline-none"
                        >
                            <option value="">Same as before</option>
                            <option value="XS">XS</option>
                            <option value="S">S</option>
                            <option value="M">M</option>
                            <option value="L">L</option>
                            <option value="XL">XL</option>
                            <option value="XXL">XXL</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                            Additional Notes
                        </label>
                        <textarea
                            value={customerNotes}
                            onChange={(e) => setCustomerNotes(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-purple-500 outline-none resize-none h-24"
                            placeholder="Provide any additional details..."
                        ></textarea>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !reason}
                        className="w-full mt-2 py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-md"
                    >
                        {isLoading ? 'Submitting...' : 'Submit Request'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ExchangeRequestModal;
