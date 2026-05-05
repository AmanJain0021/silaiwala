import React, { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import AddToCartModal from './AddToCartModal';
import api from '../../../../utils/api';
import useGeoLocation from '../../../../hooks/useLocation';

const ProductGrid = ({ filters, categoryId, categoryName, searchQuery }) => {
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const params = {
                category: categoryId || undefined,
                search: searchQuery || undefined,
                productType: 'fabric',
                ...filters
            };
            const response = await api.get('/products', { params });
            if (response.data.success) {
                setItems(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [categoryId, filters, searchQuery]);

    return (
        <div className="bg-gray-50 pb-8 min-h-[50vh]">
            <h2 className="text-xl font-bold text-[#2D2F6E] px-4 py-4">
                {categoryName && categoryName !== 'All' ? `${categoryName} Collection` : 'Explore Fabrics'}
            </h2>

            {items.length === 0 && !isLoading ? (
                <div className="flex flex-col items-center justify-center p-12 text-gray-500">
                    <p>No products found in this category.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 px-2 md:px-4">
                    {items.map((product, index) => (
                        <ProductCard
                            key={`${product.id || product._id}-${index}`}
                            product={product}
                            onAddClick={(p) => setSelectedProduct(p)}
                        />
                    ))}
                </div>
            )}

            {isLoading && (
                <div className="flex justify-center p-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2D2F6E]"></div>
                </div>
            )}

            <AddToCartModal
                isOpen={!!selectedProduct}
                onClose={() => setSelectedProduct(null)}
                product={selectedProduct}
            />
        </div>
    );
};

export default ProductGrid;
