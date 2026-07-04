import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

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
        <div className="py-4 px-4 md:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-[13px] font-black text-gray-900 uppercase tracking-widest">
                    Trending Categories
                </h2>
                <button 
                    onClick={() => navigate('/user/services')}
                    className="text-[10px] font-bold text-[#843D9B] hover:underline"
                >
                    See All
                </button>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
                {categories.map((item, index) => (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        key={item.id}
                        onClick={() => handleCategoryClick(item.name)}
                        className="min-w-[100px] sm:min-w-[120px] aspect-[3/4] rounded-xl overflow-hidden relative group cursor-pointer snap-center shadow-sm"
                    >
                        <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end justify-center pb-3">
                            <span className="text-white text-[11px] font-black tracking-wider text-center px-2">
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
