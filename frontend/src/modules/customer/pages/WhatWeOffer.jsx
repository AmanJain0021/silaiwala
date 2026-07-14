import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Scissors, ClipboardList, Users, Sparkles, Heart, Layers, Feather, Ruler, Wand2 } from 'lucide-react';
import BottomNav from '../components/BottomNav';

const WhatWeOffer = () => {
    const navigate = useNavigate();

    const ICON_COLOR = "#FFFFFF";
    const ICON_SIZE = 28;
    const STROKE_WIDTH = 1.5;

    const services = [
        {
            label: 'Tailors',
            icon: <Users size={ICON_SIZE} color={ICON_COLOR} strokeWidth={STROKE_WIDTH} />,
            path: '/user/tailors',
            desc: 'Find expert tailors near you'
        },
        {
            label: 'My Orders',
            icon: <ClipboardList size={ICON_SIZE} color={ICON_COLOR} strokeWidth={STROKE_WIDTH} />,
            path: '/user/orders',
            desc: 'Track and manage your orders'
        },
        {
            label: 'Stitching',
            icon: <Scissors size={ICON_SIZE} color={ICON_COLOR} strokeWidth={STROKE_WIDTH} />,
            path: '/user/services',
            desc: 'Custom stitching services'
        },
        {
            label: 'Style Add-ons',
            icon: <Sparkles size={ICON_SIZE} color={ICON_COLOR} strokeWidth={STROKE_WIDTH} />,
            path: '/user/embellishments',
            desc: 'Enhance your outfits'
        },
        {
            label: 'Bridal',
            icon: <Heart size={ICON_SIZE} color={ICON_COLOR} strokeWidth={STROKE_WIDTH} />,
            path: '/user/tailors?service=bridal',
            desc: 'Exclusive bridal collections'
        },
        {
            label: 'Bulk Order',
            icon: <Layers size={ICON_SIZE} color={ICON_COLOR} strokeWidth={STROKE_WIDTH} />,
            path: '/user/bulk-order',
            desc: 'Corporate and group orders'
        },
        {
            label: 'Embroidery',
            icon: <Feather size={ICON_SIZE} color={ICON_COLOR} strokeWidth={STROKE_WIDTH} />,
            path: '/user/embroidery',
            desc: 'Custom embroidery designs'
        },
        {
            label: 'Alteration',
            icon: <Ruler size={ICON_SIZE} color={ICON_COLOR} strokeWidth={STROKE_WIDTH} />,
            path: '/user/alteration',
            desc: 'Perfect fit alterations'
        },
        {
            label: 'Custom Design',
            icon: <Wand2 size={ICON_SIZE} color={ICON_COLOR} strokeWidth={STROKE_WIDTH} />,
            path: '/user/custom-design',
            desc: 'Design your dream outfit'
        }
    ];

    return (
        <div className="min-h-screen bg-[#F7F8FC] pb-24 font-sans">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-white shadow-sm px-4 py-4 flex items-center gap-4">
                <button 
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={24} className="text-gray-700" />
                </button>
                <h1 className="text-lg font-black text-gray-900 uppercase tracking-widest">What We Offer</h1>
            </div>

            {/* Grid Content */}
            <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                    {services.map((service, index) => (
                        <div 
                            key={index}
                            onClick={() => navigate(service.path)}
                            className="bg-white rounded-3xl p-6 flex flex-col items-center text-center cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 group"
                        >
                            <div className="w-16 h-16 bg-[#843D9B] rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-900/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                                {service.icon}
                            </div>
                            <h3 className="font-black text-gray-900 text-sm uppercase tracking-wider mb-2 group-hover:text-[#843D9B] transition-colors">{service.label}</h3>
                            <p className="text-[10px] text-gray-500 font-medium leading-relaxed">{service.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            <BottomNav />
        </div>
    );
};

export default WhatWeOffer;
