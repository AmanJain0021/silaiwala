import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../utils/api';
import axios from 'axios';

const useCartStore = create(
    persist(
        (set, get) => ({
            items: [],
            isLoading: false,
            error: null,

            fetchCart: async () => {
                set({ isLoading: true, error: null });
                try {
                    const response = await api.get('/customers/cart');
                    // Transform backend items to frontend format if needed
                    // In backend: { product: { _id, name, price, image }, quantity }
                    const backendItems = response.data.data.items.map(item => {
                        const baseData = item.product || item.service || {};
                        return {
                            ...baseData,
                            title: item.isCustomDesign ? "Custom Design" : (item.isAlteration ? "Custom Alteration" : baseData.title),
                            price: (item.isAlteration || item.isCustomDesign) ? 0 : (item.price || baseData.basePrice || baseData.price || 0),
                            id: baseData._id || item._id,
                            productId: item.product ? item.product._id : undefined,
                            serviceId: item.service ? item.service._id : undefined,
                            isAlteration: item.isAlteration,
                            isCustomDesign: item.isCustomDesign,
                            quantity: item.quantity,
                            cartId: item._id, // Backend item ID
                            selectedSize: item.config?.size || 'Standard',
                            selectedColor: item.config?.color || 'Default',
                            images: item.isCustomDesign ? item.config?.customDesignImages : (item.isAlteration ? item.config?.alterationImages : baseData.images),
                            image: (item.isCustomDesign && item.config?.customDesignImages?.length > 0) ? item.config.customDesignImages[0] : ((item.isAlteration && item.config?.alterationImages?.length > 0) ? item.config.alterationImages[0] : baseData.image),
                            tailor: item.tailor || baseData.tailor, // Crucial for routing order to the right tailor
                            config: item.config || {}
                        };
                    });
                    // Persist to local storage manually to ensure it's saved
                    set({ items: backendItems, isLoading: false });
                } catch (err) {
                    if (!axios.isCancel(err)) {
                        set({ error: err.message, isLoading: false });
                    }
                }
            },

            addItem: async (product, variant = { size: 'Standard', color: 'Default' }, options = {}) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await api.post('/customers/cart', {
                        productId: product?.isCustomDesign ? null : (product._id || product.id),
                        serviceId: product?.isCustomDesign ? null : undefined, // If needed
                        isCustomDesign: product?.isCustomDesign || options.isCustomDesign,
                        tailorId: options.tailorId,
                        quantity: 1,
                        price: product?.price || 0,
                        config: variant
                    });
                    
                    if (response.data.success) {
                        await get().fetchCart();
                    } else {
                        set({ isLoading: false });
                    }
                } catch (err) {
                    if (!axios.isCancel(err)) {
                        console.error('Add to cart failed:', err);
                        // Fallback to local if needed, but here we want backend sync
                        set({ error: err.message, isLoading: false });
                    }
                }
            },

            removeItem: async (cartId) => {
                set({ isLoading: true, error: null });
                try {
                    await api.delete(`/customers/cart/${cartId}`);
                    await get().fetchCart();
                } catch (err) {
                    if (!axios.isCancel(err)) {
                        set({ error: err.message, isLoading: false });
                    }
                }
            },

            updateQuantity: async (cartId, quantity) => {
                if (quantity < 1) {
                    await get().removeItem(cartId);
                    return;
                }
                
                try {
                    // Assuming POST /cart also handles updates if productId/serviceId matches
                    // If not, we might need a PATCH route, but let's check controller.
                    // Controller addToCart (line 46) does: cart.items[itemIndex].quantity += (quantity || 1);
                    // This is cumulative. If we want to SET quantity, we need another route.
                    // For now, let's keep local update or implement a set quantity route.
                    
                    set({
                        items: get().items.map((item) =>
                            item.cartId === cartId ? { ...item, quantity } : item
                        )
                    });
                } catch (err) {
                    set({ error: err.message });
                }
            },

            clearCart: () => set({ items: [] }),

            // Getters
            getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),

            getTotalPrice: () => get().items.reduce((total, item) => total + (item.price * item.quantity), 0),
        }),
        {
            name: 'user-cart-storage',
            partialize: (state) => ({ items: state.items }),
        }
    )
);

export default useCartStore;
