import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Star } from 'lucide-react';
import api from '../../../utils/api';
import { SOCKET_URL } from '../../../config/constants';

const BestSellingGarments = () => {
    const [garments, setGarments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchGarments = async () => {
            try {
                const res = await api.get('/products/featured');
                if (res.data.success) {
                    setGarments(res.data.data);
                }
            } catch (error) {
                console.error("Error fetching featured garments:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchGarments();
    }, []);

    const getImageUrl = (img) => {
        if (!img) return '';
        if (img.startsWith('http')) return img;
        return `${SOCKET_URL}${img}`;
    };

    if (isLoading) {
        return <div className="animate-pulse h-40 bg-gray-200 rounded-xl mx-4 my-6"></div>;
    }

    if (garments.length === 0) return null;

    return (
        <div className="py-6 bg-white my-2 rounded-3xl mx-2 shadow-sm border border-gray-50">
            <div className="flex justify-between items-end px-4 md:px-6 lg:px-8 mb-5">
                <div>
                    <h2 className="text-xl md:text-2xl font-black text-[#2D2F6E] leading-tight">
                        Ready-made Garments
                    </h2>
                    <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                        Best Sellers
                    </p>
                </div>
                <Link to="/user/store" className="text-xs font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-1 group">
                    See All <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>

            <div className="flex overflow-x-auto hide-scrollbar gap-4 px-4 md:px-6 lg:px-8 pb-4">
                {garments.map((item, index) => (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        key={item._id}
                        className="min-w-[160px] max-w-[160px] flex-shrink-0 bg-white rounded-2xl p-2 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative group"
                    >
                        <Link to={`/user/store/product/${item._id}`}>
                            <div className="h-40 bg-gray-50 rounded-xl overflow-hidden mb-3 relative">
                                <img
                                    src={getImageUrl(item.image || (item.images && item.images[0]))}
                                    alt={item.title || item.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                {item.stock <= 5 && (
                                    <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded text-[8px] font-black text-error uppercase tracking-wider">
                                        Only {item.stock} left
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5 truncate">
                                    {item.category?.name || item.category || 'Store Item'}
                                </p>
                                <h3 className="text-sm font-bold text-gray-900 leading-tight mb-1 truncate">
                                    {item.title || item.name}
                                </h3>
                                <div className="flex items-center gap-1 mb-2">
                                    <div className="flex items-center gap-0.5 text-[#F59E0B]">
                                        <Star size={10} className="fill-current" />
                                        <span className="text-[10px] font-bold text-gray-700">{item.rating || '4.5'}</span>
                                    </div>
                                    <span className="text-[9px] text-gray-400">({item.reviews || 0})</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-base font-black text-[#2D2F6E]">₹{item.price}</span>
                                    <button className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                                        <ShoppingBag size={14} />
                                    </button>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default BestSellingGarments;
