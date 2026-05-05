import { Link } from 'react-router-dom';
import { ChevronRight, Calendar, Package } from 'lucide-react';

const OrderCard = ({ order }) => {
    const serviceTitle = order.items?.[0]?.service?.title || order.items?.[0]?.product?.name || "Custom Stitching";
    const deliveryType = order.items?.[0]?.deliveryType || "Standard";
    const displayId = order.orderId || "ORD-0000";
    const status = order.status?.replace(/-/g, ' ').toUpperCase();

    // Status color logic
    const getStatusColor = (status) => {
        const s = status?.toLowerCase();
        if (s?.includes('delivered')) return 'bg-green-50 text-green-600 border-green-100';
        if (s?.includes('cancelled')) return 'bg-indigo-50 text-red-600 border-indigo-100';
        if (s?.includes('pending')) return 'bg-orange-50 text-orange-600 border-orange-100';
        return 'bg-indigo-50 text-primary border-indigo-100';
    };

    const formattedDate = new Date(order.createdAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });

    return (
        <Link to={`/orders/${order._id}/track`} className="block bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex gap-4">
                {/* 1. Image */}
                <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0">
                    <img
                        src={order.items?.[0]?.service?.image || "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=200"}
                        alt={serviceTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/5" />
                </div>

                {/* 2. Details */}
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${getStatusColor(order.status)}`}>
                                    {status}
                                </span>
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                    {displayId}
                                </span>
                            </div>
                            <h3 className="text-sm font-black text-gray-900 line-clamp-1 group-hover:text-[#2D2F6E] transition-colors uppercase tracking-tight">
                                {serviceTitle}
                            </h3>
                        </div>
                        <div className="text-right">
                            <span className="text-sm font-black text-[#2D2F6E]">₹{order.totalAmount}</span>
                            <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">{order.paymentStatus}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-[10px] text-gray-500 mt-3 font-bold uppercase tracking-wide">
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg border border-gray-100">
                            <Calendar size={12} className="text-gray-400" />
                            <span>{formattedDate}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg border border-gray-100">
                            <Package size={12} className="text-gray-400" />
                            <span>{deliveryType}</span>
                        </div>
                    </div>
                </div>

                {/* 3. Arrow */}
                <div className="self-center text-gray-300 group-hover:text-[#2D2F6E] transition-colors">
                    <ChevronRight size={20} />
                </div>
            </div>
        </Link>
    );
};

export default OrderCard;
