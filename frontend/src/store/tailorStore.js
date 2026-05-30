import { create } from 'zustand';
import api from '../utils/api';
import axios from 'axios';

const useTailorStore = create((set) => ({
    tailors: [],
    isLoading: false,
    error: null,

    fetchTailors: async (params = {}) => {
        const { tailors, isLoading } = useTailorStore.getState();
        // Optimization: Prevent redundant calls if already loading or data exists
        if (isLoading || (tailors.length > 0 && Object.keys(params).length === 0)) return;

        set({ isLoading: true, error: null });
        try {
            const response = await api.get('/customers/tailors', { params });
            set({ tailors: response.data.data, isLoading: false });
        } catch (err) {
            if (!axios.isCancel(err)) {
                set({ error: err.message, isLoading: false });
            }
        }
    }
}));

export default useTailorStore;
