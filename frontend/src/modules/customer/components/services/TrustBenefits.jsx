import React from 'react';
import { ShieldCheck, Lock, Clock, Award } from 'lucide-react';

const TrustBenefits = () => {
    const benefits = [
        {
            id: 1,
            icon: <ShieldCheck size={20} className="text-primary" />,
            title: "Verified Tailors",
            subtitle: "100% Verified"
        },
        {
            id: 2,
            icon: <Lock size={20} className="text-primary" />,
            title: "Secure Payment",
            subtitle: "Safe & Encrypted"
        },
        {
            id: 3,
            icon: <Clock size={20} className="text-primary" />,
            title: "On-time Delivery",
            subtitle: "Punctual & Reliable"
        },
        {
            id: 4,
            icon: <Award size={20} className="text-primary" />,
            title: "Quality Promise",
            subtitle: "Satisfaction Guaranteed"
        }
    ];

    return (
        <div className="w-full overflow-x-auto no-scrollbar py-4 px-4 sm:px-6 lg:px-8 mb-4 border-t border-gray-100 bg-white">
            <div className="flex gap-3 min-w-max">
                {benefits.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 bg-gray-50/80 border border-gray-100 rounded-2xl px-4 py-3 min-w-[160px]">
                        <div className="p-2 rounded-xl bg-primary/10 shrink-0">
                            {item.icon}
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-gray-900 leading-tight">{item.title}</h4>
                            <p className="text-[10px] text-gray-500 font-medium">{item.subtitle}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TrustBenefits;
