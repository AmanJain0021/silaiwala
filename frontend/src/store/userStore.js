import { create } from 'zustand';
import api from '../utils/api';
import axios from 'axios';

const useUserStore = create((set, get) => ({
    profile: null,
    addresses: [],
    selectedAddressId: null,
    isLoading: false,
    error: null,

    fetchProfile: async () => {
        if (get().isLoading) return;
        set({ isLoading: true });
        try {
            const response = await api.get('/customers/profile');
            const data = response.data.data;
            set({ 
                profile: data, 
                addresses: data.profile?.addresses || [],
                isLoading: false 
            });
            return data;
        } catch (err) {
            if (!axios.isCancel(err)) {
                set({ error: err.message, isLoading: false });
            }
        }
    },

    updateProfile: async (updateData) => {
        set({ isLoading: true });
        try {
            const response = await api.patch('/customers/profile', updateData);
            const data = response.data.data;
            set({ 
                profile: data, 
                addresses: data.profile?.addresses || [],
                isLoading: false 
            });
            return data;
        } catch (err) {
            if (!axios.isCancel(err)) {
                set({ error: err.message, isLoading: false });
            }
            throw err;
        }
    },

    fetchAddresses: async () => {
        if (get().isLoading) return;
        set({ isLoading: true });
        try {
            const response = await api.get('/customers/addresses');
            set({ addresses: response.data.data, isLoading: false });
        } catch (err) {
            if (!axios.isCancel(err)) {
                set({ error: err.message, isLoading: false });
            }
        }
    },

    addAddress: async (newAddress) => {
        set({ isLoading: true });
        try {
            const response = await api.post('/customers/addresses', newAddress);
            set({ addresses: response.data.data, isLoading: false });
        } catch (err) {
            if (!axios.isCancel(err)) {
                set({ error: err.message, isLoading: false });
            }
            throw err;
        }
    },

    updateAddress: async (id, updatedData) => {
        set({ isLoading: true });
        try {
            const response = await api.patch(`/customers/addresses/${id}`, updatedData);
            set({ addresses: response.data.data, isLoading: false });
        } catch (err) {
            if (!axios.isCancel(err)) {
                set({ error: err.message, isLoading: false });
            }
            throw err;
        }
    },

    removeAddress: async (id) => {
        set({ isLoading: true });
        try {
            const response = await api.delete(`/customers/addresses/${id}`);
            set({ addresses: response.data.data, isLoading: false });
        } catch (err) {
            if (!axios.isCancel(err)) {
                set({ error: err.message, isLoading: false });
            }
            throw err;
        }
    },

    selectAddress: (id) => set(() => ({
        selectedAddressId: id
    })),

    getSelectedAddress: () => {
        const state = get();
        return state.addresses.find(addr => addr._id === state.selectedAddressId) || state.addresses[0];
    },

    referralStats: null,
    fetchReferralStats: async () => {
        set({ isLoading: true });
        try {
            const response = await api.get('/customers/referral-stats');
            set({ referralStats: response.data.data, isLoading: false });
        } catch (err) {
            if (!axios.isCancel(err)) {
                set({ error: err.message, isLoading: false });
            }
        }
    }
}));

export default useUserStore;
