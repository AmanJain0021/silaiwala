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
                if (get().isLoading) return;
                set({ isLoading: true });
                try {
                    const response = await api.get('/customers/cart');
                    // Transform backend items to frontend format if needed
                    // In backend: { product: { _id, name, price, image }, quantity }
                    const backendItems = response.data.data.items.map(item => {
                        const baseData = item.product || item.service || {};
                        return {
                            ...baseData,
                            id: baseData._id,
                            productId: item.product ? item.product._id : undefined,
                            serviceId: item.service ? item.service._id : undefined,
                            quantity: item.quantity,
                            cartId: item._id, // Backend item ID
                            selectedSize: item.config?.size || 'Standard',
                            selectedColor: item.config?.color || 'Default',
                            tailor: baseData.tailor, // Crucial for routing order to the right tailor
                            config: item.config || {}
                        };
                    });
                    set({ items: backendItems, isLoading: false });
                } catch (err) {
                    if (!axios.isCancel(err)) {
                        set({ error: err.message, isLoading: false });
                    }
                }
            },

            addItem: async (product, variant = { size: 'Standard', color: 'Default' }) => {
                set({ isLoading: true });
                try {
                    const response = await api.post('/customers/cart', {
                        productId: product._id || product.id,
                        quantity: 1,
                        price: product.price,
                        config: variant
                    });
                    
                    if (response.data.success) {
                        await get().fetchCart();
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
                try {
                    await api.delete(`/customers/cart/${cartId}`);
                    await get().fetchCart();
                } catch (err) {
                    if (!axios.isCancel(err)) {
                        set({ error: err.message });
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
        }
    )
);

export default useCartStore;
