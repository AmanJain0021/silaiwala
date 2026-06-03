import React from 'react';
import { Calendar, Ruler, Scissors, Shirt, X } from 'lucide-react';
import { cn } from '../../../../../utils/cn';

const ServiceReviewCard = ({ service, config, pricing, onRemove }) => {
    if (!service) return null;

    const deliveryDate = new Date();
    // Default to 14 days if not present
    const deliveryDays = config?.deliveryType === 'express' ? 10 : 15;
    deliveryDate.setDate(deliveryDate.getDate() + deliveryDays);
    const dateString = deliveryDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    return (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-4 relative">
            {onRemove && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onRemove();
                    }}
                    className="absolute top-3 right-3 p-1.5 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors z-10"
                >
                    <X size={14} />
                </button>
            )}

            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2 pr-8">
                <Shirt size={14} className="text-primary" />
                Service Details
            </h3>

            <div className="flex gap-4">
                <img
                    src={service.image}
                    alt={service.title}
                    className="w-20 h-24 object-cover rounded-xl border border-gray-100 shrink-0"
                />

                <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start pr-6">
                        <h4 className="text-sm font-bold text-gray-900 line-clamp-2 pr-2">{service.title}</h4>
                        {pricing && (
                            <div className="flex flex-col items-end">
                                <span className="text-sm font-black text-gray-900 shrink-0">₹{pricing.total}</span>
                                {pricing.base && <span className="text-[9px] text-gray-400 font-bold">Base: ₹{pricing.base}</span>}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                            <Scissors size={10} />
                            <span>{config?.fabricSource === 'customer' ? 'Your Fabric' : 'Fabric Provided'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                            <Ruler size={10} />
                            <span>{config?.measurements?.type === 'saved' ? 'Saved Prof.' : 'Custom Fit'}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-green-700 bg-green-50 px-2 py-1 rounded-md border border-green-100 w-fit">
                        <Calendar size={10} />
                        <span>Delivery by {dateString}</span>
                    </div>

                    {service.tailorName && (
                        <div className="pt-1 mt-1 border-t border-gray-50 flex items-center gap-1 text-[10px] text-primary font-bold">
                            <Scissors size={10} />
                            <span>Tallored by: {service.tailorName}</span>
                        </div>
                    )}
                    
                    {/* Price Breakdown Details */}
                    {pricing && (
                        <div className="pt-2 mt-2 border-t border-gray-100 space-y-1">
                            {pricing.fabric > 0 && (
                                <div className="flex justify-between text-[10px] text-indigo-600 font-bold">
                                    <span>Fabric Cost</span>
                                    <span>+₹{pricing.fabric}</span>
                                </div>
                            )}
                            {pricing.addons > 0 && (
                                <div className="flex justify-between text-[10px] text-emerald-600 font-bold">
                                    <span>Style Addons</span>
                                    <span>+₹{pricing.addons}</span>
                                </div>
                            )}
                            {pricing.tailorAtHome > 0 && (
                                <div className="flex justify-between text-[10px] text-sky-600 font-bold">
                                    <span>Tailor Visit Fee</span>
                                    <span>+₹{pricing.tailorAtHome}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Instructions if any */}
            {config?.instructions && typeof config.instructions === 'string' && (
                <div className="mt-3 p-2 bg-yellow-50 rounded-lg border border-yellow-100 text-[10px] text-yellow-800 leading-relaxed italic">
                    Note: "{config.instructions}"
                </div>
            )}
        </div>
    );
};

export default ServiceReviewCard;
