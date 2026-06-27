import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import api from '../../../../utils/api';

const RecentlyViewed = ({ title = "Featured Products", products: initialProducts }) => {
    const [products, setProducts] = useState(initialProducts || []);
    const [isLoading, setIsLoading] = useState(!initialProducts);

    useEffect(() => {
        if (!initialProducts) {
            const fetchFeatured = async () => {
                setIsLoading(true);
                try {
                    const response = await api.get('/products/featured');
                    if (response.data.success) {
                        setProducts(response.data.data);
                    }
                } catch (error) {
                    console.error('Error fetching featured products:', error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchFeatured();
        }
    }, [initialProducts]);

    if (isLoading) {
        return (
            <div className="py-8 bg-gray-50 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#843D9B]"></div>
            </div>
        );
    }

    if (products.length === 0) {
        return null; // Don't show if no featured products
    }

    return (
        <div className="py-8 bg-gray-50">
            <h3 className="text-lg font-bold text-primary px-4 mb-4">{title}</h3>
            <div className="flex overflow-x-auto gap-4 px-4 pb-4 scrollbar-hide snap-x">
                {products.map((product) => (
                    <div key={product._id || product.id} className="min-w-[160px] md:min-w-[200px] snap-center">
                        <ProductCard product={product} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecentlyViewed;
