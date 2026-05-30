import { create } from 'zustand';
import api from '../utils/api';
import axios from 'axios';

const useOrderStore = create((set, get) => ({
    orders: [],
    isLoading: false,
    error: null,

    fetchOrders: async () => {
        if (get().isLoading) return;
        set({ isLoading: true });
        try {
            const response = await api.get('/orders/my-orders');
            set({ orders: response.data.data, isLoading: false });
        } catch (err) {
            if (!axios.isCancel(err)) {
                set({ error: err.message, isLoading: false });
            }
        }
    },

    getOrderById: (id) => get().orders.find(o => o.id === id || o._id === id),
}));

export const ORDER_STATES = [
    { label: "Order Placed", description: "Wait for pickup assignment" },
    { label: "Pickup Assigned", description: "Rider reaching your location" },
    { label: "Pickup in Progress", description: "Rider is at your doorstep" },
    { label: "Fabric Picked", description: "On the way to workshop" },
    { label: "Tailor Assigned", description: "Best tailor selected for you" },
    { label: "With Tailor", description: "Material received by tailor" },
    { label: "Cutting", description: "Pattern making & cutting" },
    { label: "Stitching", description: "Sewing in progress" },
    { label: "Hemming", description: "Interlock & final finish" },
    { label: "Ironing", description: "Steam press & packaging" },
    { label: "Ready for Dispatch", description: "Wait for delivery partner" },
    { label: "Delivery Assigned", description: "Rider assigned for delivery" },
    { label: "Out for Delivery", description: "Rider reaching your location" },
    { label: "Delivered", description: "Enjoy your perfect fit!" }
];

export default useOrderStore;
