// Port of modules/customer/components/store/ProductGrid.jsx (converted with scripts/web2rn.js, then reviewed)
import Spin from '../../../components/ui/Spin';
import React, { useEffect, useState, useMemo } from "react";
import { ChevronRight } from "lucide-react-native";
import ProductCard from "./ProductCard";
import AddToCartModal from "./AddToCartModal";
import api from "../../../lib/api";
import { Box, Txt, Btn, I, Scroll } from '../../ui/primitives';
const ProductGrid = ({
  filters,
  categoryId,
  categoryName,
  searchQuery,
  productType = 'fabric',
  showTitle = false,
  sectionTitle = null,
  onViewAll = null,
  layout = 'grid'
}) => {
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
        const response = await api.get('/products', {
          params
        }).catch(() => null);
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
    return () => {
      isMounted = false;
    };
  }, [categoryId, filtersKey, searchQuery, productType]);
  if (items.length === 0 && !isLoading) {
    return null; // Return null gracefully if section has no items in database yet
  }
  return <Box className="w-full py-2">
            <Box className="max-w-[1400px] mx-auto">
                {sectionTitle && <Box className="flex justify-between items-center px-4 md:px-6 lg:px-8 mb-3">
                        <Txt className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-1.5">
                            {sectionTitle}
                        </Txt>
                        {onViewAll && <Btn onPress={onViewAll} className="text-xs font-bold text-[#843D9B] hover:underline flex items-center gap-0.5 cursor-pointer">
                                View All <I icon={ChevronRight} size={14} />
                            </Btn>}
                    </Box>}

            {showTitle && <Box className="flex justify-between items-end px-4 md:px-6 lg:px-8 pt-4 pb-3">
                    <Box>
                        <Txt className="text-[10px] font-black uppercase text-primary tracking-widest bg-purple-100/70 border border-purple-200/50 px-2.5 py-1 rounded-lg">
                            {productType === 'fabric' ? 'Fabrics' : 'Custom Garments'}
                        </Txt>
                        <Txt className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mt-1.5">
                            {categoryName && categoryName !== 'All' ? `${categoryName} Collection` : `Explore ${productType === 'fabric' ? 'Fabrics' : 'Garments'}`}
                        </Txt>
                    </Box>
                    {items.length > 0 && <Txt className="text-xs font-extrabold text-slate-500 bg-white border border-slate-200/70 px-3 py-1 rounded-full shadow-2xs">
                            {items.length} {items.length === 1 ? 'item' : 'items'}
                        </Txt>}
                </Box>}

            {layout === 'horizontal' ? <Box className="pl-4 md:pl-6 lg:pl-8">
                    <Scroll contentClassName="flex overflow-x-auto gap-3.5 pb-4 no-scrollbar snap-x pr-4 md:pr-6 lg:pr-8" horizontal>
                        {items.map((product, index) => <Box key={`${product.id || product._id}-${index}`} className="min-w-[165px] sm:min-w-[190px] max-w-[210px] shrink-0 snap-start">
                                <ProductCard product={product} onAddClick={p => setSelectedProduct(p)} />
                            </Box>)}
                    </Scroll>
                </Box> : <Box className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 md:gap-5 px-4 md:px-6 lg:px-8 max-w-[1400px] mx-auto">
                    {items.map((product, index) => <ProductCard key={`${product.id || product._id}-${index}`} product={product} onAddClick={p => setSelectedProduct(p)} />)}
                </Box>}

            {isLoading && <Box className="flex justify-center p-8">
                    <Spin size={32} className="text-purple-700" />
                </Box>}
            </Box>

            <AddToCartModal isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} product={selectedProduct} />
        </Box>;
};
export default ProductGrid;