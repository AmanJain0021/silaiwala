import { create } from 'zustand';
import api from '../lib/api';

const useWishlistStore = create((set, get) => ({
    items: [],
    isLoading: false,
    error: null,

    fetchWishlist: async () => {
        set({ isLoading: true });
        try {
            const response = await api.get('/customers/wishlist');
            set({ items: response.data.data, isLoading: false });
        } catch (err) {
            set({ error: err.message, isLoading: false });
        }
    },

    toggleWishlist: async (productId) => {
        try {
            const response = await api.post('/customers/wishlist/toggle', { productId });
            // The backend returns the list of IDs, but we might want full objects
            // For now, let's just refetch or handle local update
            await get().fetchWishlist();
        } catch (err) {
            set({ error: err.message });
        }
    },

    isInWishlist: (productId) => {
        return get().items.some((item) => (item._id || item.id) === productId);
    },

    clearWishlist: () => set({ items: [] }),
}));

export default useWishlistStore;
