import React from 'react';
import { Truck, Banknote, RotateCcw, ShieldCheck } from 'lucide-react';

const TrustSection = () => {
    const items = [
        { icon: Truck, title: 'Pan India Delivery', desc: 'Across 25000+ Pincodes' },
        { icon: Banknote, title: 'COD Available', desc: 'Pay upon delivery' },
        { icon: RotateCcw, title: 'Easy Returns', desc: '7 Days Replacement' },
        { icon: ShieldCheck, title: 'Secure Payments', desc: 'Razorpay Protected' },
    ];

    return (
        <div className="py-3 px-4 md:px-6 lg:px-8">
            <div className="bg-white border border-slate-100 rounded-2xl shadow-2xs py-3.5 px-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    {items.map((item, index) => (
                        <div key={index} className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#843D9B] flex items-center justify-center shrink-0 shadow-2xs">
                                <item.icon className="h-4.5 w-4.5" />
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-extrabold text-slate-900 text-xs tracking-tight leading-tight truncate">{item.title}</h4>
                                <p className="text-[10px] text-slate-400 font-semibold tracking-tight leading-tight mt-0.5 truncate">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TrustSection;
