import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const TrendingCategories = () => {
    const navigate = useNavigate();

    const categories = [
        { id: 1, name: 'Men', image: '/assets/images/men_category.png' },
        { id: 2, name: 'Women', image: '/assets/images/women_category.png' },
        { id: 3, name: 'Bridal', image: '/assets/images/bridal_wear.png' },
        { id: 4, name: 'Popular', image: '/assets/images/popular_category.png' },
        { id: 5, name: 'Under ₹500', image: '/assets/images/under_500_category.png' },
        { id: 6, name: 'Express Delivery', image: '/assets/images/express_category.png' }
    ];

    const handleCategoryClick = (categoryName) => {
        navigate('/user/services', { state: { filter: categoryName } });
    };

    return (
        <div className="py-3 px-4 md:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-3.5">
                <h2 className="text-xs sm:text-sm font-black text-gray-900 uppercase tracking-widest">
                    TRENDING CATEGORIES
                </h2>
                <button 
                    onClick={() => navigate('/user/services')}
                    className="text-[10px] sm:text-xs font-black text-[#843D9B] hover:underline flex items-center gap-0.5 uppercase tracking-wider cursor-pointer"
                >
                    See All <ArrowRight size={12} />
                </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {categories.map((item, index) => (
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.05 }}
                        key={item.id}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleCategoryClick(item.name)}
                        className="aspect-[3/4] rounded-2xl overflow-hidden relative group cursor-pointer shadow-sm border border-gray-100 hover:shadow-md transition-all"
                    >
                        <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex items-end justify-center pb-2.5 px-1">
                            <span className="text-white text-[11px] sm:text-xs font-black tracking-wider text-center drop-shadow-md">
                                {item.name}
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default TrendingCategories;
