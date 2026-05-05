import React, { useEffect, useState } from 'react';
import { CheckCircle, PackageCheck, ShoppingBag, Truck } from 'lucide-react';
import { Link, useLocation, Navigate } from 'react-router-dom';

const OrderSuccess = () => {
    const [animationDone, setAnimationDone] = useState(false);
    const location = useLocation();
    const { orderId, orderNumber } = location.state || {};

    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimationDone(true);
        }, 1200);
        return () => clearTimeout(timer);
    }, []);

    // Redirect if direct access without order data
    if (!orderId) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">

            {/* Lottie or SVG Animation */}
            <div className="w-32 h-32 rounded-full bg-green-50 flex items-center justify-center mb-6 relative">
                <div className={`w-32 h-32 absolute border-4 border-green-200 rounded-full animate-ping opacity-75 ${animationDone ? "hidden" : "block"}`} />
                <CheckCircle size={64} className="text-green-600 animate-[bounce_1s_ease-out]" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2 animate-in slide-in-from-bottom-2 duration-700 delay-200">
                Order Placed Successfully!
            </h1>
            <p className="text-sm font-bold text-primary mb-1 font-mono uppercase tracking-widest">{orderNumber}</p>
            <p className="text-xs text-gray-500 mb-8 max-w-xs animate-in slide-in-from-bottom-2 duration-700 delay-300">
                Thank you for choosing us. We have received your order and our artisan is starting to prepare it.
            </p>

            <div className="w-full max-w-xs space-y-3 animate-in slide-in-from-bottom-2 duration-700 delay-500">
                <Link
                    to={`/orders/${orderId}/track`}
                    className="w-full py-3.5 rounded-full bg-primary text-white font-bold shadow-lg shadow-indigo-900/10 hover:bg-primary-dark active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    <PackageCheck size={18} />
                    Track Order Status
                </Link>

                <Link
                    to="/"
                    className="w-full py-3.5 rounded-full bg-gray-50 text-gray-700 font-bold hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                >
                    <ShoppingBag size={18} />
                    Continue Shopping
                </Link>
            </div>

            <div className="mt-8 text-xs text-gray-400 flex items-center gap-1.5 opacity-60">
                <Truck size={12} />
                Tracking is now live for your order
            </div>
        </div>
    );
};

export default OrderSuccess;
