import React, { useEffect, useState, useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';
import AddToCartModal from './AddToCartModal';
import api from '../../../../utils/api';

const ProductGrid = ({ filters, categoryId, categoryName, searchQuery, productType = 'fabric', showTitle = false, sectionTitle = null, onViewAll = null, layout = 'grid' }) => {
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const filtersKey = useMemo(() => JSON.stringify(filters || {}), [filters]);

    useEffect(() => {
        let isMounted = true;
        const fetchProducts = async () => {
            setIsLoading(true);
            try {
                const params = {
                    category: categoryId || undefined,
                    search: searchQuery || undefined,
                    productType: productType || undefined,
                    ...filters
                };
                const response = await api.get('/products', { params }).catch(() => null);

                if (isMounted) {
                    if (response?.data?.success && Array.isArray(response.data.data)) {
                        setItems(response.data.data);
                    } else {
                        setItems([]);
                    }
                }
            } catch (error) {
                if (isMounted) setItems([]);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchProducts();
        return () => { isMounted = false; };
    }, [categoryId, filtersKey, searchQuery, productType]);

    if (items.length === 0 && !isLoading) {
        return null; // Return null gracefully if section has no items in database yet
    }

    return (
        <div className="w-full py-2">
            <div className="max-w-[1400px] mx-auto">
                {sectionTitle && (
                    <div className="flex justify-between items-center px-4 md:px-6 lg:px-8 mb-3">
                        <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-1.5">
                            {sectionTitle}
                        </h3>
                        {onViewAll && (
                            <button 
                                onClick={onViewAll}
                                className="text-xs font-bold text-[#843D9B] hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                                View All <ChevronRight size={14} />
                            </button>
                        )}
                    </div>
                )}

            {showTitle && (
                <div className="flex justify-between items-end px-4 md:px-6 lg:px-8 pt-4 pb-3">
                    <div>
                        <span className="text-[10px] font-black uppercase text-primary tracking-widest bg-purple-100/70 border border-purple-200/50 px-2.5 py-1 rounded-lg">
                            {productType === 'fabric' ? 'Fabrics' : 'Custom Garments'}
                        </span>
                        <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mt-1.5">
                            {categoryName && categoryName !== 'All' 
                                ? `${categoryName} Collection` 
                                : `Explore ${productType === 'fabric' ? 'Fabrics' : 'Garments'}`}
                        </h2>
                    </div>
                    {items.length > 0 && (
                        <span className="text-xs font-extrabold text-slate-500 bg-white border border-slate-200/70 px-3 py-1 rounded-full shadow-2xs">
                            {items.length} {items.length === 1 ? 'item' : 'items'}
                        </span>
                    )}
                </div>
            )}

            {layout === 'horizontal' ? (
                <div className="pl-4 md:pl-6 lg:pl-8">
                    <div className="flex overflow-x-auto gap-3.5 pb-4 no-scrollbar snap-x pr-4 md:pr-6 lg:pr-8">
                        {items.map((product, index) => (
                            <div key={`${product.id || product._id}-${index}`} className="min-w-[165px] sm:min-w-[190px] max-w-[210px] shrink-0 snap-start">
                                <ProductCard
                                    product={product}
                                    onAddClick={(p) => setSelectedProduct(p)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 md:gap-5 px-4 md:px-6 lg:px-8 max-w-[1400px] mx-auto">
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
                <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-3 border-purple-700 border-t-transparent"></div>
                </div>
            )}
            </div>

            <AddToCartModal
                isOpen={!!selectedProduct}
                onClose={() => setSelectedProduct(null)}
                product={selectedProduct}
            />
        </div>
    );
};

export default ProductGrid;
