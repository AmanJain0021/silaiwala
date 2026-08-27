import { create } from 'zustand';
import api from '../utils/api';

const useMeasurementStore = create((set, get) => ({
    measurements: [],
    isLoading: false,
    error: null,

    fetchMeasurements: async () => {
        set({ isLoading: true });
        try {
            const response = await api.get('/measurements');
            const list = Array.isArray(response.data.data) ? response.data.data : [];
            // Newest first (API also sorts; keep client-side too)
            list.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
            set({ measurements: list, isLoading: false });
        } catch (err) {
            set({ error: err.message, isLoading: false });
        }
    },

    addMeasurement: async (measurementData) => {
        set({ isLoading: true });
        try {
            const response = await api.post('/measurements', measurementData);
            // Newest saved profile always on top
            set((state) => ({
                measurements: [response.data.data, ...state.measurements],
                isLoading: false,
            }));
            return response.data.data;
        } catch (err) {
            set({ error: err.message, isLoading: false });
            throw err;
        }
    },

    updateMeasurement: async (id, updatedData) => {
        set({ isLoading: true });
        try {
            const response = await api.put(`/measurements/${id}`, updatedData);
            // Updated profile moves to top
            set((state) => ({
                measurements: [
                    response.data.data,
                    ...state.measurements.filter((m) => m._id !== id),
                ],
                isLoading: false,
            }));
            return response.data.data;
        } catch (err) {
            set({ error: err.message, isLoading: false });
            throw err;
        }
    },

    deleteMeasurement: async (id) => {
        set({ isLoading: true });
        try {
            await api.delete(`/measurements/${id}`);
            set(state => ({
                measurements: state.measurements.filter(m => m._id !== id),
                isLoading: false
            }));
        } catch (err) {
            set({ error: err.message, isLoading: false });
            throw err;
        }
    }
}));

export default useMeasurementStore;
