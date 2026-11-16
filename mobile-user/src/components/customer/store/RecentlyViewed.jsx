// Port of modules/customer/components/store/RecentlyViewed.jsx (converted with scripts/web2rn.js, then reviewed)
import Spin from '../../../components/ui/Spin';
import React, { useState, useEffect } from "react";
import ProductCard from "./ProductCard";
import api from "../../../lib/api";
import { Box, Txt, Scroll } from '../../ui/primitives';
const RecentlyViewed = ({
  title = "Featured Products",
  products: initialProducts
}) => {
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
    return <Box className="py-8 bg-gray-50 flex justify-center">
                <Spin size={32} className="text-[#843D9B]" />
            </Box>;
  }
  if (products.length === 0) {
    return null; // Don't show if no featured products
  }
  return <Box className="py-8 bg-gray-50">
            <Txt className="text-lg font-bold text-primary px-4 mb-4">{title}</Txt>
            <Scroll contentClassName="flex overflow-x-auto gap-4 px-4 pb-4 scrollbar-hide snap-x" horizontal>
                {products.map(product => <Box key={product._id || product.id} className="min-w-[160px] md:min-w-[200px] snap-center">
                        <ProductCard product={product} />
                    </Box>)}
            </Scroll>
        </Box>;
};
export default RecentlyViewed;