import React from 'react';
import { Ticket, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Coupons = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 pb-20 md:p-6 font-sans">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-primary md:bg-transparent md:mb-8 px-4 py-4 flex items-center gap-4 text-white md:text-gray-900 border-b border-white/10 md:border-0 backdrop-blur-md">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-2xl md:bg-white md:shadow-sm hover:bg-white/10 md:hover:bg-gray-50 transition-all">
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-sm md:text-2xl font-black md:tracking-tight italic uppercase md:not-italic md:normal-case">My Coupons</h1>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 md:px-0">
                <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-purple-50 rounded-full flex items-center justify-center mb-6">
                        <Ticket size={40} className="text-[#843D9B]" />
                    </div>
                    <h2 className="text-xl font-black text-gray-900 mb-3">No Coupons Available</h2>
                    <p className="text-sm text-gray-500 max-w-sm mb-8">
                        You don't have any active coupons right now. Check back later for exciting offers and discounts!
                    </p>
                    <button 
                        onClick={() => navigate('/user/store')}
                        className="px-8 py-3 bg-[#843D9B] text-white rounded-full font-bold text-sm hover:bg-[#6b3180] transition-colors shadow-lg shadow-[#843D9B]/30"
                    >
                        Continue Shopping
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Coupons;
