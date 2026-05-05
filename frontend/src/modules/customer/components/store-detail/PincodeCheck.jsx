import React, { useState } from 'react';
import { MapPin, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Input } from '../../../../components/ui/Input';

const PincodeCheck = () => {
    const [pincode, setPincode] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error

    const handleCheck = () => {
        if (pincode.length !== 6) return;
        setStatus('loading');

        // Mock API call
        setTimeout(() => {
            if (['190001', '190002', '110001'].includes(pincode)) {
                setStatus('success');
            } else {
                setStatus('error');
            }
        }, 1000);
    };

    return (
        <div className="mb-6 bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
                <MapPin size={16} className="text-gray-500" />
                <h3 className="text-sm font-bold text-gray-900">Check Delivery</h3>
            </div>

            <div className="flex gap-2 relative">
                <Input
                    maxLength={6}
                    placeholder="Enter Pincode"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    className="h-10 text-sm bg-white"
                />
                <button
                    onClick={handleCheck}
                    disabled={pincode.length !== 6 || status === 'loading'}
                    className="text-xs font-bold text-primary hover:bg-gray-200 px-4 rounded-lg bg-gray-100 disabled:opacity-50"
                >
                    {status === 'loading' ? <Loader2 size={16} className="animate-spin" /> : 'Check'}
                </button>
            </div>

            {/* Status Messages */}
            {status === 'success' && (
                <div className="mt-2 flex items-start gap-2 text-xs text-green-700 bg-green-50 p-2 rounded-lg">
                    <CheckCircle2 size={14} className="mt-0.5" />
                    <div>
                        <p className="font-bold">Delivery Available</p>
                        <p>Expected by <span className="font-bold">Wed, Feb 20</span></p>
                        <p className="text-gray-500 text-[10px] mt-0.5">Cash on Delivery Available</p>
                    </div>
                </div>
            )}

            {status === 'error' && (
                <div className="mt-2 flex items-center gap-2 text-xs text-red-700 bg-indigo-50 p-2 rounded-lg">
                    <XCircle size={14} />
                    <p className="font-bold">Not deliverable to {pincode}</p>
                </div>
            )}
        </div>
    );
};

export default PincodeCheck;
